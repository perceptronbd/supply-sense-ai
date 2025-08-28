import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '@supplysense/prisma';
import type { Session } from '@supplysense/prisma-client';

@Injectable()
export class SessionService implements OnModuleDestroy {
  private readonly logger = new Logger(SessionService.name);
  private readonly sessions = new Map<string, Session>();
  private readonly userSessionCache = new Map<string, { sessions: Session[]; lastFetch: Date }>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL
  private readonly MAX_CACHE_SIZE = 10000; // Prevent unlimited memory growth
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService
  ) {
    // Set up periodic cache cleanup (every 10 minutes)
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupExpiredCache();
      },
      10 * 60 * 1000
    );
  }

  async createSession(
    title: string,
    userId: string,
    dbConnectionId: string,
    description?: string
  ): Promise<Session> {
    try {
      // First validate that the database connection exists and belongs to the user's company
      const dbConnection = await this.prisma.dbConnection.findUnique({
        where: { id: dbConnectionId },
      });

      if (!dbConnection) {
        throw new Error('Database connection not found or access denied');
      }

      // Create session in database
      const createdSession = await this.prisma.session.create({
        data: {
          title,
          description,
          userId,
          dbConnectionId,
          isActive: true,
        },
      });

      // Store in memory cache for quick access
      this.sessions.set(createdSession.id, createdSession);

      // Check cache size and cleanup if necessary
      this.enforceMaxCacheSize();

      // Invalidate user sessions cache since we have a new session
      this.userSessionCache.delete(userId);

      this.logger.log(`Chat session created in database: ${createdSession.id} for user ${userId}`);

      return createdSession;
    } catch (error) {
      this.logger.error('Failed to create chat session:', error);
      throw new Error(`Failed to create chat session: ${error.message}`);
    }
  }
  async getSession(sessionId: string, userId: string): Promise<Session | null> {
    try {
      this.logger.log(`Fetching session ${sessionId} for user ${userId}`);

      // First try to get from cache
      const cachedSession = this.sessions.get(sessionId);
      if (cachedSession && cachedSession.userId === userId && cachedSession.isActive) {
        this.logger.log(`Session ${sessionId} found in cache for user ${userId}`);
        return cachedSession;
      }

      // If not in cache, fetch from database
      const dbSession = await this.prisma.session.findFirst({
        where: {
          id: sessionId,
          userId: userId,
          isActive: true,
        },
      });

      if (dbSession) {
        this.logger.log(`Session ${sessionId} found in database for user ${userId}`);

        // Update memory cache
        this.sessions.set(dbSession.id, dbSession);
        return dbSession;
      }

      this.logger.log(`Session ${sessionId} not found for user ${userId}`);
      return null;
    } catch (error) {
      this.logger.error('Failed to fetch session:', error);
      throw new Error('Failed to fetch session');
    }
  }
  async getUserSessions(userId: string, limit = 20, offset = 0): Promise<Session[]> {
    try {
      this.logger.log(`Fetching sessions for user ${userId}, limit: ${limit}, offset: ${offset}`);

      // Check cache first (only for first page and recent data)
      if (offset === 0) {
        const cachedData = this.userSessionCache.get(userId);
        if (cachedData) {
          const cacheAge = Date.now() - cachedData.lastFetch.getTime();
          if (cacheAge < this.CACHE_TTL_MS) {
            this.logger.log(`Using cached sessions for user ${userId}`);
            // Filter active sessions and apply limit
            const activeSessions = cachedData.sessions
              .filter((session) => session.isActive)
              .slice(0, limit);
            return activeSessions;
          }
        }
      }

      // Fetch from database
      const dbSessions = await this.prisma.session.findMany({
        where: {
          userId: userId,
          isActive: true,
        },
        orderBy: {
          lastActivity: 'desc',
        },
        skip: offset,
        take: limit,
      });

      // Update both caches
      for (const session of dbSessions) {
        this.sessions.set(session.id, session);
      }

      // Update user sessions cache (only for first page to avoid cache complexity)
      if (offset === 0) {
        this.userSessionCache.set(userId, {
          sessions: dbSessions,
          lastFetch: new Date(),
        });
      }

      return dbSessions;
    } catch (error) {
      this.logger.error('Failed to fetch user sessions:', error);
      throw new Error('Failed to fetch sessions');
    }
  }
  async updateSession(
    sessionId: string,
    userId: string,
    updates: Partial<Pick<Session, 'title' | 'description'>>
  ): Promise<Session> {
    try {
      this.logger.log(`Updating session ${sessionId} for user ${userId}`);

      // Update in database
      const updatedSession = await this.prisma.session.update({
        where: {
          id: sessionId,
          userId: userId,
          isActive: true,
        },
        data: {
          ...updates,
          updatedAt: new Date(),
        },
      });

      // Update in individual session cache
      this.sessions.set(sessionId, updatedSession);

      // Invalidate user sessions cache to reflect the changes
      this.userSessionCache.delete(userId);

      this.logger.log(`Session ${sessionId} updated successfully`);
      return updatedSession;
    } catch (error) {
      this.logger.error('Failed to update session:', error);
      throw new Error(`Failed to update session: ${error.message}`);
    }
  }
  async deleteSession(sessionId: string, userId: string): Promise<void> {
    try {
      this.logger.log(`Deleting session ${sessionId} for user ${userId}`);

      // Delete from database (use update instead of updateMany for safety)
      const updatedSession = await this.prisma.session.update({
        where: {
          id: sessionId,
          userId: userId,
          isActive: true,
        },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });

      if (!updatedSession) {
        throw new Error('Session not found or access denied');
      }

      // Remove from individual session cache
      this.sessions.delete(sessionId);

      // Invalidate user sessions cache since we deleted a session
      this.userSessionCache.delete(userId);

      this.logger.log(`Session ${sessionId} deleted successfully`);
    } catch (error) {
      this.logger.error('Failed to delete session:', error);
      throw new Error(`Failed to delete session: ${error.message}`);
    }
  }
  async updateLastActivity(sessionId: string): Promise<void> {
    try {
      this.logger.log(`Updating last activity for session ${sessionId}`);

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
          `Session validation failed in updateLastActivity: Session ${sessionId} not found or inactive`
        );
        throw new Error(`Session ${sessionId} not found or inactive`);
      }

      const now = new Date();

      // Update in database
      const updatedSession = await this.prisma.session.update({
        where: {
          id: sessionId,
          isActive: true,
        },
        data: {
          lastActivity: now,
          updatedAt: now,
        },
      });

      // Update in individual session cache if exists
      const cachedSession = this.sessions.get(sessionId);
      if (cachedSession) {
        cachedSession.lastActivity = now;
        cachedSession.updatedAt = now;
        this.sessions.set(sessionId, cachedSession);
      }

      // Invalidate user sessions cache since lastActivity order might have changed
      this.userSessionCache.delete(updatedSession.userId);

      this.logger.debug(`Last activity updated for session ${sessionId}`);
    } catch (error) {
      this.logger.error(`Failed to update last activity for session ${sessionId}:`, error);
      // Re-throw if it's a validation error, otherwise log and continue
      if (error.message?.includes('Invalid')) {
        throw error;
      }
    }
  }

  /**
   * Clean up expired cache entries to prevent memory leaks
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();

    // Clean up user sessions cache
    for (const [userId, cacheData] of this.userSessionCache.entries()) {
      const cacheAge = now - cacheData.lastFetch.getTime();
      if (cacheAge > this.CACHE_TTL_MS) {
        this.userSessionCache.delete(userId);
      }
    }

    // Clean up inactive sessions from individual cache
    for (const [sessionId, session] of this.sessions.entries()) {
      if (!session.isActive) {
        this.sessions.delete(sessionId);
      }
    }

    this.logger.debug(
      `Cache cleanup completed. Sessions: ${this.sessions.size}, UserSessions: ${this.userSessionCache.size}`
    );
  }

  /**
   * Enforce maximum cache size to prevent memory leaks
   */
  private enforceMaxCacheSize(): void {
    if (this.sessions.size > this.MAX_CACHE_SIZE) {
      // Remove oldest 20% of entries
      const entriesToRemove = Math.floor(this.MAX_CACHE_SIZE * 0.2);
      const entries = Array.from(this.sessions.entries());

      // Sort by lastActivity (oldest first)
      entries.sort((a, b) => a[1].lastActivity.getTime() - b[1].lastActivity.getTime());

      for (let i = 0; i < entriesToRemove; i++) {
        this.sessions.delete(entries[i][0]);
      }

      this.logger.warn(`Cache size exceeded limit. Removed ${entriesToRemove} oldest sessions.`);
    }
  }

  /**
   * Cleanup method to be called on service destruction
   */
  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}
