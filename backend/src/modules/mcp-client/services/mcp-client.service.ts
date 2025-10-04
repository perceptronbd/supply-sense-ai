import { MastraClient } from '@mastra/client-js';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

/**
 * Service for managing MCP (Model Context Protocol) client connections
 * Handles communication with Mastra MCP servers using the official @mastra/mcp client
 */
@Injectable()
export class McpClientService implements OnModuleInit {
  private readonly logger = new Logger(McpClientService.name);
  private mastraClient: MastraClient | null = null;
  private isConnected = false;

  constructor() {
    this.logger.log('McpClientService constructor called');
  }

  async onModuleInit() {
    // Try to initialize MCP client, but don't crash the app if it fails
    try {
      this.mastraClient = await this.initializeMcpClient();
    } catch (error) {
      this.logger.error(
        'Failed to initialize MCP client during module init, will retry later',
        error
      );
      this.isConnected = false;
    }
  }

  async initializeMcpClient(): Promise<MastraClient> {
    try {
      this.logger.log('Initializing MCP client connection to Mastra server...');

      this.mastraClient = new MastraClient({
        baseUrl: process.env.MASTRA_SERVER_URL || 'http://localhost:4111',
      });

      return this.mastraClient;
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
      this.mastraClient = await this.initializeMcpClient();
      return this.isConnected;
    } catch (error) {
      this.logger.error('Retry connection failed:', error);
      return false;
    }
  }

  /**
   * Get static tools (for agent initialization)
   */
  async getTools(): Promise<Record<string, unknown>> {
    if (!this.mastraClient || !this.isConnected) {
      this.logger.warn('MCP client not connected, returning empty tools');
      return {};
    }

    try {
      return await this.mastraClient.getTools();
    } catch (error) {
      this.logger.error('Failed to get tools from MCP server:', error);
      return {};
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
      if (!this.mastraClient || !this.isConnected) {
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
   * Reconnect to MCP server
   */
  async reconnect(): Promise<void> {
    await this.initializeMcpClient();
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): { connected: boolean; hasClient: boolean } {
    return {
      connected: this.isConnected,
      hasClient: this.mastraClient !== null,
    };
  }

  /**
   * Get MCP client instance for direct access
   */
  getMcpClient(): MastraClient | null {
    return this.mastraClient;
  }

  /**
   * Check if MCP client is connected
   */
  isClientConnected(): boolean {
    return this.isConnected;
  }
}
