import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Message } from '@prisma/client';
import type { JsonValue } from '@prisma/client/runtime/library';
import { PrismaService } from '@supplysense/prisma';

type MessageType = 'user' | 'assistant' | 'system' | 'error';

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    // Validate Prisma service is properly injected during construction
    if (!this.prisma) {
      this.logger.error('PrismaService was not properly injected in constructor');
      throw new Error('PrismaService dependency injection failed');
    }
  }
  async createMessage(
    sessionId: string,
    content: string,
    type: MessageType,
    metadata?: Record<string, unknown>
  ): Promise<Message> {
    try {
      // Validate input parameters
      if (!sessionId || typeof sessionId !== 'string') {
        throw new Error('Invalid sessionId provided');
      }
      if (!content || typeof content !== 'string') {
        throw new Error('Invalid content provided');
      }
      if (!type || !['user', 'assistant', 'system', 'error'].includes(type)) {
        throw new Error('Invalid message type provided');
      }

      // Check if Prisma service is available
      if (!this.prisma) {
        this.logger.error('Prisma service is not available');
        throw new Error('Database service is not available');
      }

      // Validate session exists first
      const sessionExists = await this.prisma.session.findFirst({
        where: {
          id: sessionId,
          isActive: true,
        },
        select: { id: true },
      });

      if (!sessionExists) {
        this.logger.error(`Session validation failed: Session ${sessionId} not found or inactive`);
        throw new Error(`Session ${sessionId} not found or inactive`);
      }

      // Create message in database
      const dbMessage = await this.prisma.message.create({
        data: {
          content,
          type,
          metadata: metadata ? (metadata as Record<string, never>) : null,
          sessionId,
        },
        select: {
          id: true,
          content: true,
          type: true,
          metadata: true,
          createdAt: true,
          sessionId: true,
          // Do NOT include session relationship
        },
      });

      // Validate the created message
      if (!dbMessage || !dbMessage.id || !dbMessage.content) {
        throw new Error('Failed to create valid message in database');
      }

      // Convert to proper Message type
      const messageResult: Message = {
        id: dbMessage.id,
        content: dbMessage.content,
        type: dbMessage.type as MessageType,
        metadata: dbMessage.metadata as JsonValue,
        createdAt: dbMessage.createdAt,
        sessionId: dbMessage.sessionId,
      };

      this.logger.log(`Message created: ${messageResult.id} in session ${sessionId}`);

      return messageResult;
    } catch (error) {
      this.logger.error('Failed to create message:', error);
      this.logger.error('Session ID:', sessionId);
      this.logger.error('Message content length:', content?.length || 0);
      this.logger.error('Prisma service available:', !!this.prisma);
      this.logger.error('Error stack:', error.stack);
      throw new Error('Failed to create message');
    }
  }

  async getSessionMessages(
    sessionId: string,
    limit: string | number = 50,
    offset: string | number = 0
  ): Promise<Message[]> {
    try {
      // Ensure limit and offset are integers
      const limitInt = typeof limit === 'string' ? Number.parseInt(limit, 10) : limit;
      const offsetInt = typeof offset === 'string' ? Number.parseInt(offset, 10) : offset;

      // Validate converted values
      if (Number.isNaN(limitInt) || Number.isNaN(offsetInt) || limitInt < 0 || offsetInt < 0) {
        throw new Error('Invalid limit or offset parameters');
      }

      this.logger.log(
        `Fetching messages for session ${sessionId}, limit: ${limitInt}, offset: ${offsetInt}`
      );

      // Validate input parameters
      if (!sessionId || typeof sessionId !== 'string') {
        throw new Error('Invalid sessionId provided');
      }

      // Check if Prisma service is available
      if (!this.prisma) {
        this.logger.error('Prisma service is not available');
        throw new Error('Database service is not available');
      }

      // Validate session exists first
      const sessionExists = await this.prisma.session.findFirst({
        where: {
          id: sessionId,
          isActive: true,
        },
        select: { id: true },
      });

      if (!sessionExists) {
        this.logger.error(
          `Session validation failed in getSessionMessages: Session ${sessionId} not found or inactive`
        );
        return [];
      }

      // Fetch messages from database
      const dbMessages = await this.prisma.message.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
        skip: offsetInt,
        take: limitInt,
        select: {
          id: true,
          content: true,
          type: true,
          metadata: true,
          createdAt: true,
          sessionId: true,
          // Do NOT include session relationship
        },
      });

      // Convert all database results to proper Message types before returning
      const convertedMessages = dbMessages.map(
        (msg): Message => ({
          id: msg.id,
          content: msg.content,
          type: msg.type as MessageType,
          metadata: msg.metadata as JsonValue,
          createdAt: msg.createdAt,
          sessionId: msg.sessionId,
        })
      );

      return convertedMessages;
    } catch (error) {
      this.logger.error('Failed to fetch session messages:', error);
      this.logger.error('Session ID:', sessionId);
      this.logger.error('Prisma service available:', !!this.prisma);
      this.logger.error('Error stack:', error.stack);
      throw new Error('Failed to fetch messages');
    }
  }
  async updateMessage(
    messageId: string,
    updates: Partial<Pick<Message, 'content' | 'metadata'>>
  ): Promise<Message> {
    try {
      this.logger.log(`Updating message ${messageId}`);

      // Check if Prisma service is available
      if (!this.prisma) {
        this.logger.error('Prisma service is not available');
        throw new Error('Database service is not available');
      }

      // Update in database
      const dbMessage = await this.prisma.message.update({
        where: { id: messageId },
        data: {
          content: updates.content,
          metadata: updates.metadata ? (updates.metadata as Record<string, never>) : undefined,
        },
        select: {
          id: true,
          content: true,
          type: true,
          metadata: true,
          createdAt: true,
          sessionId: true,
          // Do NOT include session relationship
        },
      });

      // Convert to proper Message type
      const message: Message = {
        id: dbMessage.id,
        sessionId: dbMessage.sessionId,
        content: dbMessage.content,
        type: dbMessage.type as MessageType,
        metadata: dbMessage.metadata as unknown as JsonValue,
        createdAt: dbMessage.createdAt,
      };

      this.logger.log(`Message ${messageId} updated successfully`);
      return message;
    } catch (error) {
      this.logger.error('Failed to update message:', error);
      this.logger.error('Prisma service available:', !!this.prisma);
      throw error;
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      this.logger.log(`Deleting message ${messageId}`);

      // Check if Prisma service is available
      if (!this.prisma) {
        this.logger.error('Prisma service is not available');
        throw new Error('Database service is not available');
      }

      // Delete from database
      await this.prisma.message.delete({
        where: { id: messageId },
      });

      this.logger.log(`Message ${messageId} deleted successfully`);
    } catch (error) {
      this.logger.error('Failed to delete message:', error);
      this.logger.error('Prisma service available:', !!this.prisma);
      throw new Error('Failed to delete message');
    }
  }
  async searchMessages(
    sessionId: string,
    query: string,
    limit: string | number = 20
  ): Promise<Message[]> {
    try {
      // Ensure limit is an integer
      const limitInt = typeof limit === 'string' ? Number.parseInt(limit, 10) : limit;

      // Validate converted value
      if (Number.isNaN(limitInt) || limitInt < 0) {
        throw new Error('Invalid limit parameter');
      }

      this.logger.log(`Searching messages in session ${sessionId} with query: ${query}`);

      // Check if Prisma service is available
      if (!this.prisma) {
        this.logger.error('Prisma service is not available');
        throw new Error('Database service is not available');
      }

      // Search in database
      const searchResults = await this.prisma.message.findMany({
        where: {
          sessionId,
          content: {
            contains: query,
            mode: 'insensitive',
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limitInt,
        select: {
          id: true,
          content: true,
          type: true,
          metadata: true,
          createdAt: true,
          sessionId: true,
          // Do NOT include session relationship
        },
      });

      // Convert search results to proper Message types
      const convertedResults = searchResults.map(
        (msg): Message => ({
          id: msg.id,
          content: msg.content,
          type: msg.type as MessageType,
          metadata: msg.metadata as JsonValue,
          createdAt: msg.createdAt,
          sessionId: msg.sessionId,
        })
      );

      return convertedResults;
    } catch (error) {
      this.logger.error('Failed to search messages:', error);
      this.logger.error('Prisma service available:', !!this.prisma);
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
