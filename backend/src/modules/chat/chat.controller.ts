import { AuthenticatedUser, CurrentUser } from '@modules/auth/decorators/current-user.decorator';
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
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import {
  ChatQueryDto,
  ChatSessionDto,
  CreateChatSessionDto,
  CreateMessageDto,
  type RecordTokenUsageDto,
  UpdateSessionTitleDto,
} from './dto/chat.dto';
import type { PublicChatMessageDto } from './dto/public-chat.dto';
import { MultiWindowRateLimitGuard } from './guards/multi-window-rate-limiting.guard';
import { ChatService } from './services/chat.service';
import { PublicChatService } from './services/public-chat.service';

export const PUBLIC_COMPANY_ID = process.env.PUBLIC_COMPANY_ID || '';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    @Inject(ChatService) private readonly chatService: ChatService,
    @Inject(PublicChatService) private readonly publicChatService: PublicChatService
  ) {
    this.logger.log('ChatController constructor - explicit injection');
  }

  @Post('sessions')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  // @RequirePermissions(CHAT_PERMISSIONS.MANAGE_CONVERSATIONS)
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
      createSessionDto.dbConnectionId,
      createSessionDto.description
    );
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  // @RequirePermissions(CHAT_PERMISSIONS.READ_MESSAGES)
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
  // @RequirePermissions(CHAT_PERMISSIONS.READ_MESSAGES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific chat session' })
  @ApiResponse({ status: 200, description: 'Session retrieved successfully', type: ChatSessionDto })
  async getSession(@Param('sessionId') sessionId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.chatService.getSession(sessionId, user.id);
  }

  @Delete('sessions/:sessionId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  // @RequirePermissions(CHAT_PERMISSIONS.MANAGE_CONVERSATIONS)
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
  // @RequirePermissions(CHAT_PERMISSIONS.READ_MESSAGES)
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

  @Post('sessions/:sessionId/messages')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new message in a session' })
  @ApiResponse({ status: 201, description: 'Message created successfully' })
  async createMessage(
    @Param('sessionId') sessionId: string,
    @Body() createMessageDto: CreateMessageDto
  ) {
    return this.chatService.createMessage(
      sessionId,
      createMessageDto.content,
      createMessageDto.type,
      createMessageDto.structuredData
    );
  }

  @Post('sessions/:sessionId/title')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update session title' })
  @ApiResponse({ status: 200, description: 'Title updated successfully' })
  async updateSessionTitle(
    @Param('sessionId') sessionId: string,
    @Body() body: UpdateSessionTitleDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.chatService.updateSessionTitleIfNeeded(
      sessionId,
      user.id,
      body.message,
      body.summary
    );
  }

  @Post('query')
  @UseGuards(JwtAuthGuard, PermissionsGuard, MultiWindowRateLimitGuard)
  // Removed: @Throttle({ query: { ttl: 60000, limit: 5 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a message to the AI assistant' })
  @ApiResponse({ status: 200, description: 'AI response generated successfully' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async sendMessage(
    @Body() queryDto: ChatQueryDto,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response
  ) {
    const result = await this.chatService.processUserMessage({
      companyId: user.companyId,
      sessionId: queryDto.sessionId,
      message: queryDto.query,
      userId: user.id,
      userContext: {
        userPermissions: user.permissions, // Use actual permissions
        ...queryDto.context, // Include the context from the payload
      },
      dbConnectionId: queryDto.dbConnectionId,
    });
    return res.status(HttpStatus.OK).json(result);
  }

  /**
   * Handle chat streaming endpoint
   * Streams the response from the Mastra agent token by token
   */
  @Post('stream')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  async chat(
    @Body() body: ChatQueryDto,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
    @Req() req: Request
  ): Promise<void> {
    try {
      this.logger.log('Received message: ' + body.query);

      // Better streaming headers
      res.setHeader('Content-Type', 'text/event-stream'); // SSE standard
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*'); // Adjust for prod

      res.status(HttpStatus.OK);

      const token = req.headers['authorization']; // Get token from request

      const textStream = await this.chatService.streamChat({
        companyId: user.companyId,
        sessionId: body.sessionId,
        message: body.query,
        userId: user.id,
        userContext: {
          userPermissions: user.permissions, // Use actual permissions
          ...body.context, // Include the context from the payload
        },
        dbConnectionId: body.dbConnectionId,
        authorizationToken: token,
      });

      textStream.pipe(res);
    } catch (error) {
      this.logger.error('Error processing chat request:', error);
      // Only send error response if headers haven't been sent yet
      if (!res.headersSent && !res.writableEnded) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
      } else {
        // If headers are sent, we can't send a JSON response.
        // We might want to end the response if it's not ended.
        if (!res.writableEnded) {
          res.end();
        }
      }
    }
  }

  @Post('public/message')
  @ApiOperation({ summary: 'Send a public chat message (no authentication required)' })
  @ApiResponse({ status: 200, description: 'Message processed successfully' })
  async sendPublicMessage(@Body() publicMessageDto: PublicChatMessageDto, @Res() res: Response) {
    try {
      const response = await this.publicChatService.processPublicMessage(publicMessageDto.query);

      return res.status(HttpStatus.OK).json({
        success: true,
        data: response,
      });
    } catch (error) {
      this.logger.error('Error in public chat:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to process message',
      });
    }
  }

  @Post('record-token-usage')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record token usage for a chat interaction' })
  @ApiResponse({ status: 201, description: 'Token usage recorded successfully' })
  async recordTokenUsage(@Body() recordTokenDto: RecordTokenUsageDto) {
    await this.chatService.recordTokenUsage(recordTokenDto);
    return { success: true, message: 'Token usage recorded successfully' };
  }
}
