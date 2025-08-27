import http from 'node:http';
import { MCPServer } from '@mastra/mcp';
import { PrismaClient } from '@supplysense/prisma-client';
import { mastra } from './mastra/index.js';

import { executeQueryTool } from './mastra/tools/execute-query-tool.js';
import { analyzeTableMetadataTool } from './mastra/tools/metadata-tool.js';
import { queryAnalysisTool } from './mastra/tools/query-analysis-tools.js';
import { supplyChainTool } from './mastra/tools/supply-chain-tool.js';
import { testMetadataTool } from './mastra/tools/test-metadata-tool.js';

// Global Prisma client instance for main server operations
const prisma = new PrismaClient();

// Initialize Prisma connection
async function initializePrisma() {
  try {
    // Validate that DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.warn(
        '⚠️ DATABASE_URL environment variable is not set. Database operations will be limited.'
      );
      return false;
    }

    await prisma.$connect();
    const maskedUrl = process.env.DATABASE_URL.replace(/:\/\/([^:]+):([^@]+)@/, '://***:***@');
    console.log('✅ Prisma client connected successfully to:', maskedUrl);

    // Test database connection with a simple query
    try {
      await prisma.$queryRaw`SELECT 1 as test`;
      console.log('✅ Database health check passed');
    } catch (error) {
      console.warn('⚠️ Database connection established but query test failed:', error.message);
    }

    return true;
  } catch (error) {
    console.error('❌ Failed to connect Prisma client:', error);
    console.warn('⚠️ Database operations will not work until DATABASE_URL is properly configured.');
    return false;
  }
}

// Graceful Prisma and connection pool shutdown
async function shutdownPrisma() {
  try {
    // Clean up database connection pools first
    console.log('🔄 Cleaning up database connection pools...');

    // Then disconnect Prisma
    await prisma.$disconnect();
    console.log('🔌 Prisma client disconnected gracefully');
  } catch (error) {
    console.error('❌ Error disconnecting Prisma client:', error);
  }
}

async function main() {
  console.log('🚀 Starting SupplySense Mastra MCP Server...');

  try {
    // Initialize Prisma database connection first
    console.log('🔗 Initializing database connection...');
    const databaseConnected = await initializePrisma();

    if (databaseConnected) {
      console.log('✅ Database connection established');
    } else {
      console.log('⚠️ Continuing without database connection');
    }

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
      tools: {
        supplyChainTool,
        analyzeTableMetadataTool,
        testMetadataTool,
        queryAnalysisTool,
        executeQueryTool,
      }, // Include standalone tools
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
    console.log('   - supplyChainTool: Get supply chain status and metrics');
    console.log('   - analyzeTableMetadataTool: Analyze database schema and generate metadata');
    console.log('   - queryAnalysisTool: Analyze user queries and extract insights');
    console.log('   - testMetadataTool: Test metadata analysis functionality'); // Start the MCP server using HTTP transport with SSE
    const port = process.env.MCP_PORT || 3002;
    console.log('🚀 ~ port:', port);
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

    httpServer.listen(Number(port), () => {
      console.log('✅ SupplySense MCP Server is now running!');
      console.log('🔗 Ready to connect from MCP clients (VS Code, Chat applications, etc.)');
      console.log('📡 Server details:');
      console.log('   - Transport: HTTP (Server-Sent Events)');
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
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down MCP Server...');
  await shutdownPrisma();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down MCP Server...');
  await shutdownPrisma();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  console.error('💥 Uncaught Exception:', error);
  await shutdownPrisma();
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', async (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  await shutdownPrisma();
  process.exit(1);
});

// Start the server
main().catch((error) => {
  console.error('💥 Fatal error starting MCP Server:', error);
  process.exit(1);
});
