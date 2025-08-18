import { randomUUID } from 'node:crypto';
import { PrismaService } from '@app/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { ChatMessage } from '../interfaces/chat.interface';

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);
  private readonly messages = new Map<string, ChatMessage[]>();

  constructor(private prisma: PrismaService) {}
  async createMessage(
    sessionId: string,
    content: string,
    type: 'user' | 'assistant' | 'system' | 'error',
    userId: string,
    metadata?: Record<string, unknown>,
    parentMessageId?: string
  ): Promise<ChatMessage> {
    try {
      const message: ChatMessage = {
        id: this.generateId(),
        sessionId,
        content,
        type,
        contentType: this.determineContentType(content, metadata),
        metadata,
        parentMessageId,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }; // Store in memory - create session array if it doesn't exist
      if (!this.messages.has(sessionId)) {
        this.messages.set(sessionId, []);
      }
      const sessionMessages = this.messages.get(sessionId);
      if (sessionMessages) {
        sessionMessages.push(message);
      }

      this.logger.log(`Message created: ${message.id} in session ${sessionId}`);

      return message;
    } catch (error) {
      this.logger.error('Failed to create message:', error);
      throw new Error('Failed to create message');
    }
  }

  async getSessionMessages(sessionId: string, limit = 50, offset = 0): Promise<ChatMessage[]> {
    try {
      this.logger.log(
        `Fetching messages for session ${sessionId}, limit: ${limit}, offset: ${offset}`
      );

      const sessionMessages = this.messages.get(sessionId) || [];

      // Apply pagination and sort by creation time
      return sessionMessages
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .slice(offset, offset + limit);
    } catch (error) {
      this.logger.error('Failed to fetch session messages:', error);
      throw new Error('Failed to fetch messages');
    }
  }
  async updateMessage(
    messageId: string,
    _updates: Partial<Pick<ChatMessage, 'content' | 'metadata'>>
  ): Promise<ChatMessage> {
    try {
      this.logger.log(`Updating message ${messageId}`);
      // Implement message update logic
      throw new Error('Message update not yet implemented');
    } catch (error) {
      this.logger.error('Failed to update message:', error);
      throw error;
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      this.logger.log(`Deleting message ${messageId}`);
      // Implement message deletion logic
    } catch (error) {
      this.logger.error('Failed to delete message:', error);
      throw new Error('Failed to delete message');
    }
  }
  async searchMessages(_sessionId: string, _query: string, _limit = 20): Promise<ChatMessage[]> {
    try {
      this.logger.log(`Searching messages in session ${_sessionId} with query: ${_query}`);
      // Implement message search logic
      return [];
    } catch (error) {
      this.logger.error('Failed to search messages:', error);
      throw new Error('Failed to search messages');
    }
  }
  private generateId(): string {
    return randomUUID();
  }
  private determineContentType(
    content: string,
    metadata?: Record<string, unknown>
  ): 'text' | 'data' | 'chart' | 'table' {
    if (metadata?.type) {
      return metadata.type as 'text' | 'data' | 'chart' | 'table';
    }

    // Simple content type detection
    if (content.includes('```json') || content.includes('```sql')) {
      return 'data';
    }

    if (content.includes('chart') || content.includes('graph')) {
      return 'chart';
    }

    if (content.includes('|') && content.includes('---')) {
      return 'table';
    }

    return 'text';
  }
}
