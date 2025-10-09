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
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { UserThrottlerGuard } from '../auth/guards/user-throttler.guard';
import { ChatQueryDto, ChatSessionDto, CreateChatSessionDto, SendMessageDto } from './dto/chat.dto';
import { ChatService } from './services/chat.service';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(@Inject(ChatService) private readonly chatService: ChatService) {
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

  @Post('query')
  @UseGuards(JwtAuthGuard, PermissionsGuard, UserThrottlerGuard)
  @Throttle({ query: { ttl: 60000, limit: 5 } }) // 5 request per minute for this route
  // @RequirePermissions(CHAT_PERMISSIONS.SEND_MESSAGE)
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

  @Post('messages')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  // @RequirePermissions(CHAT_PERMISSIONS.SEND_MESSAGE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a message in a chat session' })
  @ApiResponse({ status: 200, description: 'Message sent successfully' })
  async sendChatMessage(
    @Body() sendMessageDto: SendMessageDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.chatService.processUserMessage({
      companyId: user.companyId,
      sessionId: sendMessageDto.sessionId,
      message: sendMessageDto.content,
      userId: user.id,
      userContext: {
        userPermissions: user.permissions, // Use actual permissions
      },
      dbConnectionId: '',
    });
  }
}
