import { randomUUID } from 'node:crypto';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import type { Message } from '@prisma/client';
import type { JsonValue } from '@prisma/client/runtime/library';
import { PrismaService } from '@supplysense/prisma';

type MessageType = 'user' | 'assistant' | 'system' | 'error';

interface CachedMessages {
  messages: Message[];
  lastFetch: Date;
  lastModified: Date;
}

@Injectable()
export class MessageService implements OnModuleDestroy {
  private readonly logger = new Logger(MessageService.name);
  private readonly messages = new Map<string, CachedMessages>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL
  private readonly MAX_CACHE_SIZE = 5000; // Maximum number of cached sessions
  private readonly MAX_MESSAGES_PER_SESSION = 1000; // Maximum messages per session in cache
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor(private readonly prisma: PrismaService) {
    // Set up periodic cache cleanup (every 10 minutes)
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupExpiredCache();
      },
      10 * 60 * 1000
    );
  }
  async createMessage(
    sessionId: string,
    content: string,
    type: MessageType,
    metadata?: Record<string, unknown>
  ): Promise<Message> {
    try {
      // Create message in database first
      const dbMessage = await this.prisma.message.create({
        data: {
          content,
          type,
          metadata: metadata ? (metadata as Record<string, never>) : null,
          sessionId,
        },
      });

      // Update cache - create session cache if it doesn't exist
      const now = new Date();
      if (!this.messages.has(sessionId)) {
        this.messages.set(sessionId, {
          messages: [],
          lastFetch: now,
          lastModified: now,
        });
      }

      const sessionCache = this.messages.get(sessionId);
      if (sessionCache) {
        sessionCache.messages.push(dbMessage);
        sessionCache.lastModified = now;

        // Enforce message limit per session to prevent memory issues
        if (sessionCache.messages.length > this.MAX_MESSAGES_PER_SESSION) {
          sessionCache.messages = sessionCache.messages.slice(-this.MAX_MESSAGES_PER_SESSION);
        }
      }

      // Check cache size and cleanup if necessary
      this.enforceMaxCacheSize();

      this.logger.log(`Message created: ${dbMessage.id} in session ${sessionId}`);

      return dbMessage;
    } catch (error) {
      this.logger.error('Failed to create message:', error);
      throw new Error('Failed to create message');
    }
  }

  async getSessionMessages(sessionId: string, limit = 50, offset = 0): Promise<Message[]> {
    try {
      this.logger.log(
        `Fetching messages for session ${sessionId}, limit: ${limit}, offset: ${offset}`
      );

      const now = Date.now();
      const sessionCache = this.messages.get(sessionId);

      // Check if cache is valid and recent
      const shouldUseCache =
        sessionCache && now - sessionCache.lastFetch.getTime() < this.CACHE_TTL_MS && offset === 0; // Only use cache for first page

      if (shouldUseCache && sessionCache) {
        this.logger.log(`Using cached messages for session ${sessionId}`);
        const sortedMessages = [...sessionCache.messages].sort(
          (a: Message, b: Message) => a.createdAt.getTime() - b.createdAt.getTime()
        );
        return sortedMessages.slice(offset, offset + limit);
      }

      // If not in cache or cache is stale, fetch from database
      const dbMessages = await this.prisma.message.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
        skip: offset,
        take: limit,
      });

      // Update cache only for first page to avoid cache complexity
      if (offset === 0) {
        const cacheData: CachedMessages = {
          messages: dbMessages,
          lastFetch: new Date(),
          lastModified: new Date(),
        };
        this.messages.set(sessionId, cacheData);
      }

      return dbMessages;
    } catch (error) {
      this.logger.error('Failed to fetch session messages:', error);
      throw new Error('Failed to fetch messages');
    }
  }
  async updateMessage(
    messageId: string,
    updates: Partial<Pick<Message, 'content' | 'metadata'>>
  ): Promise<Message> {
    try {
      this.logger.log(`Updating message ${messageId}`);

      // Update in database first
      const dbMessage = await this.prisma.message.update({
        where: { id: messageId },
        data: {
          content: updates.content,
          metadata: updates.metadata ? (updates.metadata as Record<string, never>) : undefined,
        },
      });

      // Update cache - find and update the message in all sessions
      for (const [sessionId, sessionCache] of this.messages.entries()) {
        const messageIndex = sessionCache.messages.findIndex((msg) => msg.id === messageId);
        if (messageIndex !== -1) {
          const updatedMessage: Message = {
            ...sessionCache.messages[messageIndex],
            content: dbMessage.content,
            metadata: dbMessage.metadata as unknown as JsonValue,
          };
          sessionCache.messages[messageIndex] = updatedMessage;
          sessionCache.lastModified = new Date();

          this.logger.log(`Message ${messageId} updated in session ${sessionId}`);
          return updatedMessage;
        }
      }

      // If not in cache, create from database result
      const message: Message = {
        id: dbMessage.id,
        sessionId: dbMessage.sessionId,
        content: dbMessage.content,
        type: dbMessage.type as MessageType,
        metadata: dbMessage.metadata as unknown as JsonValue,
        createdAt: dbMessage.createdAt,
      };

      return message;
    } catch (error) {
      this.logger.error('Failed to update message:', error);
      throw error;
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      this.logger.log(`Deleting message ${messageId}`);

      // Delete from database first
      await this.prisma.message.delete({
        where: { id: messageId },
      });

      // Remove from cache - find and remove the message from all sessions
      for (const [sessionId, sessionCache] of this.messages.entries()) {
        const messageIndex = sessionCache.messages.findIndex((msg) => msg.id === messageId);
        if (messageIndex !== -1) {
          sessionCache.messages.splice(messageIndex, 1);
          sessionCache.lastModified = new Date();
          this.logger.log(`Message ${messageId} deleted from session ${sessionId}`);
          break;
        }
      }
    } catch (error) {
      this.logger.error('Failed to delete message:', error);
      throw new Error('Failed to delete message');
    }
  }
  async searchMessages(sessionId: string, query: string, limit = 20): Promise<Message[]> {
    try {
      this.logger.log(`Searching messages in session ${sessionId} with query: ${query}`);

      // Search in database for more comprehensive results
      const searchResults = await this.prisma.message.findMany({
        where: {
          sessionId,
          content: {
            contains: query,
            mode: 'insensitive',
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return searchResults;
    } catch (error) {
      this.logger.error('Failed to search messages:', error);
      throw new Error('Failed to search messages');
    }
  }

  /**
   * Clear cache for a specific session or all sessions
   */
  clearCache(sessionId?: string): void {
    if (sessionId) {
      this.messages.delete(sessionId);
      this.logger.log(`Cache cleared for session ${sessionId}`);
    } else {
      this.messages.clear();
      this.logger.log('All message cache cleared');
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { totalSessions: number; totalMessages: number } {
    const totalSessions = this.messages.size;
    let totalMessages = 0;

    for (const sessionCache of this.messages.values()) {
      totalMessages += sessionCache.messages.length;
    }

    return { totalSessions, totalMessages };
  }

  /**
   * Clean up expired cache entries to prevent memory leaks
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();

    // Clean up expired cache entries
    for (const [sessionId, sessionCache] of this.messages.entries()) {
      const cacheAge = now - sessionCache.lastFetch.getTime();
      if (cacheAge > this.CACHE_TTL_MS) {
        this.messages.delete(sessionId);
        this.logger.debug(`Expired cache removed for session ${sessionId}`);
      }
    }

    this.logger.debug(`Cache cleanup completed. Active sessions: ${this.messages.size}`);
  }

  /**
   * Enforce maximum cache size to prevent memory leaks
   */
  private enforceMaxCacheSize(): void {
    if (this.messages.size > this.MAX_CACHE_SIZE) {
      // Remove oldest 20% of entries based on last fetch time
      const entriesToRemove = Math.floor(this.MAX_CACHE_SIZE * 0.2);
      const entries = Array.from(this.messages.entries());

      // Sort by lastFetch (oldest first)
      entries.sort((a, b) => a[1].lastFetch.getTime() - b[1].lastFetch.getTime());

      for (let i = 0; i < entriesToRemove; i++) {
        this.messages.delete(entries[i][0]);
      }

      this.logger.warn(
        `Cache size exceeded limit. Removed ${entriesToRemove} oldest session caches.`
      );
    }
  }

  /**
   * Cleanup method to be called on service destruction
   */
  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.logger.log('MessageService cleanup completed');
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
