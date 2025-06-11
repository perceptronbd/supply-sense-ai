import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthenticatedUser, CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatQueryDto, ChatSessionDto, CreateChatSessionDto, SendMessageDto } from './dto/chat.dto';
import { ChatService } from './services/chat.service';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}
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
  @Post('sessions')
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific chat session' })
  @ApiResponse({ status: 200, description: 'Session retrieved successfully', type: ChatSessionDto })
  async getSession(@Param('sessionId') sessionId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.chatService.getSession(sessionId, user.id);
  }

  @Delete('sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
        userRole: user.role,
        branchId: user.branchId,
        userPermissions: [], // TODO: Implement user permissions system
      }
    );
    return res.status(HttpStatus.OK).json(result);
  }

  @Post('messages')
  @UseGuards(JwtAuthGuard)
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
        userRole: user.role,
        branchId: user.branchId,
        userPermissions: [], // TODO: Implement user permissions system
      }
    );
  }
}
