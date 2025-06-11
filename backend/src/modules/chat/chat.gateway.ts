import { Logger, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketUser } from './interfaces/chat.interface';
import { ChatService } from './services/chat.service';

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private connectedUsers = new Map<string, SocketUser>();

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Extract JWT token from query or headers
      const token = this.extractToken(client);

      if (!token) {
        this.logger.warn('Client attempted to connect without valid token');
        client.disconnect();
        return;
      }

      // Verify and decode the JWT token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const user: SocketUser = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        branchId: payload.branchId,
      };

      // Store user info
      this.connectedUsers.set(client.id, user);

      // Join user to their personal room for notifications
      client.join(`user_${user.id}`);

      this.logger.log(`User ${user.email} connected with socket ${client.id}`);

      // Send connection confirmation
      client.emit('connected', {
        message: 'Connected to chat service',
        userId: user.id,
      });
    } catch (error) {
      this.logger.error('Failed to authenticate websocket connection:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = this.connectedUsers.get(client.id);
    if (user) {
      this.logger.log(`User ${user.email} disconnected`);
      this.connectedUsers.delete(client.id);
    }
  }

  @SubscribeMessage('join_session')
  async handleJoinSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string }
  ) {
    try {
      const user = this.connectedUsers.get(client.id);
      if (!user) {
        client.emit('error', { message: 'User not authenticated' });
        return;
      }

      // Verify user has access to this session
      const session = await this.chatService.getSession(data.sessionId, user.id);
      if (!session) {
        client.emit('error', { message: 'Session not found or access denied' });
        return;
      }

      // Join the session room
      client.join(`session_${data.sessionId}`);

      this.logger.log(`User ${user.email} joined session ${data.sessionId}`);

      client.emit('session_joined', { sessionId: data.sessionId });
    } catch (error) {
      this.logger.error('Failed to join session:', error);
      client.emit('error', { message: 'Failed to join session' });
    }
  }

  @SubscribeMessage('leave_session')
  async handleLeaveSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string }
  ) {
    try {
      client.leave(`session_${data.sessionId}`);

      const user = this.connectedUsers.get(client.id);
      this.logger.log(`User ${user?.email} left session ${data.sessionId}`);

      client.emit('session_left', { sessionId: data.sessionId });
    } catch (error) {
      this.logger.error('Failed to leave session:', error);
    }
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      sessionId: string;
      message: string;
      type?: 'user' | 'system';
    }
  ) {
    try {
      const user = this.connectedUsers.get(client.id);
      if (!user) {
        client.emit('error', { message: 'User not authenticated' });
        return;
      }

      // Emit typing indicator to other users in the session
      client.to(`session_${data.sessionId}`).emit('user_typing', {
        userId: user.id,
        isTyping: false,
      });

      // Show AI thinking indicator
      this.server.to(`session_${data.sessionId}`).emit('ai_thinking', {
        sessionId: data.sessionId,
        isThinking: true,
      });

      // Process the message with the chat service
      const response = await this.chatService.processUserMessage(
        data.sessionId,
        data.message,
        user.id,
        {
          userRole: user.role,
          branchId: user.branchId,
          userPermissions: [], // You might want to fetch these from user data
        }
      );

      // Stop thinking indicator
      this.server.to(`session_${data.sessionId}`).emit('ai_thinking', {
        sessionId: data.sessionId,
        isThinking: false,
      });

      // Emit the user message first
      this.server.to(`session_${data.sessionId}`).emit('new_message', {
        sessionId: data.sessionId,
        message: {
          id: `msg_${Date.now()}`,
          content: data.message,
          type: 'user',
          userId: user.id,
          timestamp: new Date(),
        },
      });

      // Then emit the AI response
      this.server.to(`session_${data.sessionId}`).emit('new_message', {
        sessionId: data.sessionId,
        message: {
          id: `msg_${Date.now() + 1}`,
          content: response.message,
          type: 'assistant',
          contentType: response.type,
          data: response.data,
          suggestions: response.suggestions,
          metadata: response.metadata,
          userId: 'assistant',
          timestamp: new Date(),
        },
      });

      // Send confirmation to sender
      client.emit('message_sent', {
        sessionId: data.sessionId,
        success: true,
      });
    } catch (error) {
      this.logger.error('Failed to process message:', error);

      // Stop thinking indicator on error
      this.server.to(`session_${data.sessionId}`).emit('ai_thinking', {
        sessionId: data.sessionId,
        isThinking: false,
      });

      client.emit('error', {
        message: 'Failed to process your message. Please try again.',
        sessionId: data.sessionId,
      });
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      sessionId: string;
      isTyping: boolean;
    }
  ) {
    try {
      const user = this.connectedUsers.get(client.id);
      if (!user) return;

      // Broadcast typing status to other users in the session
      client.to(`session_${data.sessionId}`).emit('user_typing', {
        userId: user.id,
        userName: user.email.split('@')[0], // Simple name extraction
        isTyping: data.isTyping,
      });
    } catch (error) {
      this.logger.error('Failed to handle typing indicator:', error);
    }
  }

  private extractToken(client: Socket): string | null {
    // Try to get token from query parameters
    const tokenFromQuery = client.handshake.query.token as string;
    if (tokenFromQuery) {
      return tokenFromQuery;
    } // Try to get token from authorization header
    const authHeader = client.handshake.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }
  // Method to send notifications to specific users
  async sendNotificationToUser(userId: string, notification: Record<string, unknown>) {
    this.server.to(`user_${userId}`).emit('notification', notification);
  }

  // Method to broadcast to all connected users
  async broadcastToAll(event: string, data: Record<string, unknown>) {
    this.server.emit(event, data);
  }
}
