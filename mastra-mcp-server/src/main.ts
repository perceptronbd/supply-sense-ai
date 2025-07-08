import http from 'node:http';
import { MCPServer } from '@mastra/mcp';
import { mastra } from './mastra/index.js';
import { supplyChainTool } from './mastra/tools/supply-chain-tool.js';

async function main() {
  console.log('🚀 Starting SupplySense Mastra MCP Server...');

  try {
    // Create MCP Server with our Mastra agents, tools, and workflows
    console.log('🔧 Initializing MCP Server with Supply Chain capabilities...');

    // Get agents and workflows from the Mastra instance
    const agents = mastra.getAgents();
    const workflows = mastra.getWorkflows();

    const mcpServer = new MCPServer({
      name: 'SupplySense Supply Chain Server',
      version: '1.0.0',
      // Expose agents, workflows, and tools
      agents,
      workflows,
      tools: { supplyChainTool }, // Include standalone tools
    });

    console.log('✅ MCP Server initialized successfully');
    console.log('📋 Available MCP capabilities:');

    // Log available agents
    const agentKeys = Object.keys(agents);
    if (agentKeys.length > 0) {
      console.log('🤖 Agents (exposed as tools):');
      for (const agentKey of agentKeys) {
        console.log(`   - ask_${agentKey}: Supply Chain AI Assistant`);
      }
    }

    // Log available workflows
    const workflowKeys = Object.keys(workflows);
    if (workflowKeys.length > 0) {
      console.log('🔄 Workflows (exposed as tools):');
      for (const workflowKey of workflowKeys) {
        console.log(`   - run_${workflowKey}: Supply Chain Monitoring & Alerts`);
      }
    }

    // Log available tools
    console.log('🔧 Direct Tools:');
    console.log('   - supplyChainTool: Get supply chain status and metrics'); // Start the MCP server using HTTP transport with SSE
    const port = process.env.PORT || process.env.MCP_PORT || 3002;
    const host = process.env.MCP_HOST || '0.0.0.0';
    console.log(`🔌 Starting MCP Server with HTTP/SSE transport on ${host}:${port}...`);

    // Create HTTP server
    const httpServer = http.createServer(async (req, res) => {
      try {
        await mcpServer.startSSE({
          url: new URL(req.url || '', `http://localhost:${port}`),
          ssePath: '/mcp',
          messagePath: '/message',
          req,
          res,
        });
      } catch (error) {
        console.error('Error handling MCP request:', error);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });

    httpServer.listen(Number(port), host, () => {
      console.log('✅ SupplySense MCP Server is now running!');
      console.log('🔗 Ready to connect from MCP clients (VS Code, Chat applications, etc.)');
      console.log('📡 Server details:');
      console.log('   - Transport: HTTP (Server-Sent Events)');
      console.log(`   - URL: http://${host}:${port}/mcp`);
      console.log('   - Protocol: Model Context Protocol (MCP)');
    });
  } catch (error) {
    console.error('❌ Error starting MCP Server:', error);

    if (error instanceof Error) {
      console.error('📋 Error details:', error.message);
      console.error('🔍 Stack trace:', error.stack);
    }

    console.error('💡 Troubleshooting tips:');
    console.error('   - Make sure all dependencies are installed: pnpm install');
    console.error('   - Check that agents and workflows have proper descriptions');
    console.error('   - Verify GOOGLE_GENERATIVE_AI_API_KEY is set if using Gemini models');

    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down MCP Server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down MCP Server...');
  process.exit(0);
});

// Start the server
main().catch((error) => {
  console.error('💥 Fatal error starting MCP Server:', error);
  process.exit(1);
});
