import { google } from '@ai-sdk/google';
import { Agent } from '@mastra/core/agent';
import { MCPClient } from '@mastra/mcp';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

interface AgentResponse {
  success: boolean;
  response?: string;
  context?: Record<string, unknown>;
  timestamp: string;
  usage?: unknown;
  error?: string;
  [key: string]: unknown;
}

interface WorkflowResponse {
  success: boolean;
  workflowId?: string;
  result?: unknown;
  input?: Record<string, unknown>;
  timestamp: string;
  usage?: unknown;
  error?: string;
  [key: string]: unknown;
}

/**
 * Service for managing MCP (Model Context Protocol) client connections
 * Handles communication with Mastra MCP servers using the official @mastra/mcp client
 */
@Injectable()
export class McpClientService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(McpClientService.name);
  private mcpClient: MCPClient | null = null;
  private agent: Agent | null = null;
  private isConnected = false;

  constructor() {
    this.logger.log('McpClientService constructor called');
  }

  async onModuleInit() {
    // Try to initialize MCP client, but don't crash the app if it fails
    try {
      await this.initializeMcpClient();
    } catch (error) {
      this.logger.error(
        'Failed to initialize MCP client during module init, will retry later',
        error
      );
      this.isConnected = false;
    }
  }

  async onModuleDestroy() {
    await this.disconnect();
  }
  private async initializeMcpClient(): Promise<void> {
    try {
      this.logger.log('Initializing MCP client connection to Mastra server...');

      // Create MCPClient instance with HTTP server configuration per Mastra docs
      this.mcpClient = new MCPClient({
        servers: {
          supplySense: {
            url: new URL('http://localhost:3002/mcp'), // MCP server HTTP endpoint
            timeout: 30000, // 30 second timeout
          },
        },
        timeout: 60000, // Global 60 second timeout
      });

      // Get tools from MCP server and initialize agent
      const tools = await this.mcpClient.getTools();
      this.logger.log(
        `📋 Loaded ${Object.keys(tools).length} tools from MCP server: ${Object.keys(tools).join(', ')}`
      );

      // Initialize agent with Gemini model and MCP tools
      this.agent = new Agent({
        name: 'SupplyChainAgent',
        description: 'AI assistant specialized in supply chain management and logistics',
        instructions:
          'You are a supply chain AI assistant. Use the available tools to help with supply chain queries, inventory management, purchase orders, and logistics operations.',
        model: google('gemini-2.0-flash'),
        tools, // Pass MCP tools directly to the agent
      });

      this.isConnected = true;
      this.logger.log('✅ MCP client and agent successfully initialized');
    } catch (error) {
      this.logger.error('❌ Failed to initialize MCP client and agent:', error);
      this.isConnected = false;
      // Don't throw the error, just set connection status to false
    }
  }

  /**
   * Retry initializing the MCP client connection
   * Useful if the initial connection failed during startup
   */
  async retryConnection(): Promise<boolean> {
    if (this.isConnected) {
      this.logger.log('MCP client already connected');
      return true;
    }

    try {
      await this.initializeMcpClient();
      return this.isConnected;
    } catch (error) {
      this.logger.error('Retry connection failed:', error);
      return false;
    }
  }

  private async testConnection(): Promise<void> {
    if (!this.mcpClient) {
      throw new Error('MCP client not initialized');
    }

    try {
      // Test connection by getting tools using the correct Mastra MCP API
      const tools = await this.mcpClient.getTools();
      this.logger.log(
        `� Connected to MCP server, found ${Object.keys(tools).length} available tools`
      );

      // Log available tools
      for (const [toolName, tool] of Object.entries(tools)) {
        const toolObj = tool as { description?: string };
        this.logger.log(`  - ${toolName}: ${toolObj.description || 'No description'}`);
      }
    } catch (error) {
      this.logger.error('Connection test failed:', error);
      throw error;
    }
  } /**
   * Get tools dynamically for a specific request/user context
   */
  async getToolsets(): Promise<Record<string, unknown>> {
    if (!this.mcpClient || !this.isConnected) {
      this.logger.warn('MCP client not connected, returning empty toolsets');
      return {};
    }

    try {
      return await this.mcpClient.getToolsets();
    } catch (error) {
      this.logger.error('Failed to get toolsets from MCP server:', error);
      return {};
    }
  }

  /**
   * Get static tools (for agent initialization)
   */
  async getTools(): Promise<Record<string, unknown>> {
    if (!this.mcpClient || !this.isConnected) {
      this.logger.warn('MCP client not connected, returning empty tools');
      return {};
    }

    try {
      return await this.mcpClient.getTools();
    } catch (error) {
      this.logger.error('Failed to get tools from MCP server:', error);
      return {};
    }
  } /**
   * Query the supply chain agent using natural language
   * The agent will automatically select and use appropriate MCP tools
   */
  async querySupplyChainAgent(
    query: string,
    context?: Record<string, unknown>
  ): Promise<AgentResponse> {
    if (!this.agent || !this.mcpClient || !this.isConnected) {
      throw new Error('MCP client or agent not initialized');
    }

    try {
      this.logger.log(`🤖 Processing query with AI agent: "${query}"`);

      // Use the agent to generate a response, letting it decide which tools to use
      const response = await this.agent.generate(
        [
          {
            role: 'user',
            content: context ? `${query}\n\nAdditional context: ${JSON.stringify(context)}` : query,
          },
        ],
        {
          toolsets: await this.mcpClient.getToolsets(), // Dynamic toolsets for this request
        }
      );

      this.logger.log('✅ Agent query processed successfully');
      return {
        success: true,
        response: response.text,
        context,
        timestamp: new Date().toISOString(),
        usage: response.usage,
      };
    } catch (error) {
      this.logger.error('Failed to query supply chain agent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        context,
        timestamp: new Date().toISOString(),
      };
    }
  }
  /**
   * Execute a supply chain workflow through the agent
   * The agent will determine which workflow tool to use based on the input
   */
  async executeSupplyChainWorkflow(
    workflowInput: Record<string, unknown>
  ): Promise<WorkflowResponse> {
    if (!this.agent || !this.mcpClient || !this.isConnected) {
      throw new Error('MCP client or agent not initialized');
    }

    try {
      this.logger.log(
        `🔄 Executing workflow via agent with input: ${JSON.stringify(workflowInput)}`
      );

      // Create a natural language request for the workflow
      const workflowQuery = `Execute a supply chain workflow with the following parameters: ${JSON.stringify(workflowInput, null, 2)}`;

      // Use the agent to process the workflow request
      const response = await this.agent.generate(
        [
          {
            role: 'user',
            content: workflowQuery,
          },
        ],
        {
          toolsets: await this.mcpClient.getToolsets(),
        }
      );

      this.logger.log('✅ Supply chain workflow executed successfully via agent');
      return {
        success: true,
        result: response.text,
        input: workflowInput,
        timestamp: new Date().toISOString(),
        usage: response.usage,
      };
    } catch (error) {
      this.logger.error('Failed to execute supply chain workflow via agent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        input: workflowInput,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Check if MCP client is connected and healthy
   */
  async healthCheck(): Promise<{
    connected: boolean;
    toolsCount: number;
    availableTools: string[];
    error?: string;
  }> {
    try {
      if (!this.mcpClient || !this.isConnected) {
        return {
          connected: false,
          toolsCount: 0,
          availableTools: [],
          error: 'MCP client not initialized or connected',
        };
      }
      const tools = await this.getTools();
      const toolNames = Object.keys(tools);

      return {
        connected: true,
        toolsCount: toolNames.length,
        availableTools: toolNames,
      };
    } catch (error) {
      return {
        connected: false,
        toolsCount: 0,
        availableTools: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Disconnect from MCP server
   */
  async disconnect(): Promise<void> {
    if (this.mcpClient) {
      try {
        await this.mcpClient.disconnect();
        this.logger.log('🔌 Disconnected from MCP server');
      } catch (error) {
        this.logger.error('Error disconnecting from MCP server:', error);
      } finally {
        this.mcpClient = null;
        this.isConnected = false;
      }
    }
  }

  /**
   * Reconnect to MCP server
   */
  async reconnect(): Promise<void> {
    await this.disconnect();
    await this.initializeMcpClient();
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): { connected: boolean; hasClient: boolean } {
    return {
      connected: this.isConnected,
      hasClient: this.mcpClient !== null,
    };
  }
}
