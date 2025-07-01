import { AuthenticatedUser, CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { RequirePermissions } from '@modules/auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@modules/auth/guards/permissions.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Inject,
  Logger,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CHAT_PERMISSIONS } from '@supplysense/types';
import { Response } from 'express';
import { ChatQueryDto, ChatSessionDto, CreateChatSessionDto, SendMessageDto } from './dto/chat.dto';
import { ChatService } from './services/chat.service';
import { McpClientService } from './services/mcp-client.service';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    @Inject(ChatService) private readonly chatService: ChatService,
    @Inject(McpClientService) private readonly mcpClientService: McpClientService
  ) {
    this.logger.log('ChatController constructor - explicit injection');
  }

  @Get('health')
  @ApiOperation({ summary: 'Check chat service health' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        chat: 'active',
        ai: 'connected',
        database: 'operational',
        websocket: 'ready',
      },
    };
  }

  @Get('mcp/health')
  @ApiOperation({ summary: 'Check MCP client health and connection status' })
  @ApiResponse({ status: 200, description: 'MCP health check completed' })
  async mcpHealth() {
    try {
      // Wait a moment for service initialization if needed
      if (!this.mcpClientService) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (!this.mcpClientService) {
        return {
          status: 'error',
          timestamp: new Date().toISOString(),
          error: 'McpClientService is not available',
          mcp: {
            connected: false,
            toolsCount: 0,
            availableTools: [] as string[],
            error: 'Service not initialized',
          },
        };
      }

      const mcpHealth = await this.mcpClientService.healthCheck();
      const connectionStatus = this.mcpClientService.getConnectionStatus();

      return {
        status: mcpHealth.connected ? 'healthy' : 'disconnected',
        timestamp: new Date().toISOString(),
        mcp: {
          connected: mcpHealth.connected,
          toolsCount: mcpHealth.toolsCount,
          availableTools: mcpHealth.availableTools,
          hasClient: connectionStatus.hasClient,
          error: mcpHealth.error,
        },
        server: {
          name: 'SupplySense Supply Chain Server',
          capabilities: [
            'Supply Chain Agent (ask_supplyChainAgent)',
            'Supply Chain Workflow (run_supplyChainWorkflow)',
            'Supply Chain Status Tool',
          ],
        },
      };
    } catch (error) {
      this.logger.error('MCP health check error:', error);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        mcp: {
          connected: false,
          toolsCount: 0,
          availableTools: [] as string[],
          error: 'Failed to check MCP health',
        },
      };
    }
  }

  @Post('sessions')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CHAT_PERMISSIONS.MANAGE_CONVERSATIONS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new chat session' })
  @ApiResponse({ status: 201, description: 'Session created successfully', type: ChatSessionDto })
  async createSession(
    @Body() createSessionDto: CreateChatSessionDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.chatService.createSession(
      createSessionDto.title,
      user.id,
      createSessionDto.description
    );
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CHAT_PERMISSIONS.READ_MESSAGES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user chat sessions' })
  @ApiResponse({
    status: 200,
    description: 'Sessions retrieved successfully',
    type: [ChatSessionDto],
  })
  async getUserSessions(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    return this.chatService.getUserSessions(user.id, limit, offset);
  }

  @Get('sessions/:sessionId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CHAT_PERMISSIONS.READ_MESSAGES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific chat session' })
  @ApiResponse({ status: 200, description: 'Session retrieved successfully', type: ChatSessionDto })
  async getSession(@Param('sessionId') sessionId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.chatService.getSession(sessionId, user.id);
  }

  @Delete('sessions/:sessionId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CHAT_PERMISSIONS.MANAGE_CONVERSATIONS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a chat session' })
  @ApiResponse({ status: 200, description: 'Session deleted successfully' })
  async deleteSession(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.chatService.deleteSession(sessionId, user.id);
  }

  @Get('sessions/:sessionId/messages')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CHAT_PERMISSIONS.READ_MESSAGES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get messages from a chat session' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  async getSessionMessages(
    @Param('sessionId') sessionId: string,
    @CurrentUser() _user: AuthenticatedUser,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    return this.chatService.getSessionMessages(sessionId, limit, offset);
  }

  @Post('query')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CHAT_PERMISSIONS.SEND_MESSAGE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a message to the AI assistant' })
  @ApiResponse({ status: 200, description: 'AI response generated successfully' })
  async sendMessage(
    @Body() queryDto: ChatQueryDto,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response
  ) {
    const result = await this.chatService.processUserMessage(
      queryDto.sessionId,
      queryDto.query,
      user.id,
      {
        userRole: user.roles[0] || 'USER', // Use first role or default
        branchId: user.branchIds[0] || '', // Use first branch or empty
        userPermissions: user.permissions, // Use actual permissions
      }
    );
    return res.status(HttpStatus.OK).json(result);
  }

  @Post('messages')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CHAT_PERMISSIONS.SEND_MESSAGE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a message in a chat session' })
  @ApiResponse({ status: 200, description: 'Message sent successfully' })
  async sendChatMessage(
    @Body() sendMessageDto: SendMessageDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.chatService.processUserMessage(
      sendMessageDto.sessionId,
      sendMessageDto.content,
      user.id,
      {
        userRole: user.roles[0] || 'USER', // Use first role or default
        branchId: user.branchIds[0] || '', // Use first branch or empty
        userPermissions: user.permissions, // Use actual permissions
      }
    );
  }

  @Post('mcp/test')
  @RequirePermissions(CHAT_PERMISSIONS.SEND_MESSAGE)
  @ApiOperation({ summary: 'Test MCP integration without authentication' })
  @ApiResponse({ status: 200, description: 'MCP test completed' })
  async testMcp(@Body() testDto: { query: string }) {
    return this.chatService.testMcpIntegration(testDto.query);
  }

  @Post('mcp/test-workflow')
  @RequirePermissions(CHAT_PERMISSIONS.SEND_MESSAGE)
  @ApiOperation({ summary: 'Test MCP workflow integration without authentication' })
  @ApiResponse({ status: 200, description: 'MCP workflow test completed' })
  async testMcpWorkflow(@Body() testDto: { workflowInput: Record<string, unknown> }) {
    return this.chatService.testMcpWorkflow(testDto.workflowInput);
  }
}
