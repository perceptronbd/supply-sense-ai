import { randomUUID } from 'node:crypto';
import { PrismaService } from '@app/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { ChatSession } from '../interfaces/chat.interface';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly sessions = new Map<string, ChatSession>();

  constructor(private prisma: PrismaService) {}
  async createSession(title: string, userId: string, description?: string): Promise<ChatSession> {
    try {
      const session: ChatSession = {
        id: this.generateSessionId(),
        title,
        description,
        userId,
        lastActivityAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store in memory for now
      this.sessions.set(session.id, session);

      this.logger.log(`Chat session created: ${session.id} for user ${userId}`);

      return session;
    } catch (error) {
      this.logger.error('Failed to create chat session:', error);
      throw new Error('Failed to create chat session');
    }
  }
  async getSession(sessionId: string, userId: string): Promise<ChatSession | null> {
    try {
      this.logger.log(`Fetching session ${sessionId} for user ${userId}`);
      const session = this.sessions.get(sessionId);

      // Check if session exists and belongs to the user
      if (session && session.userId === userId) {
        return session;
      }

      return null;
    } catch (error) {
      this.logger.error('Failed to fetch session:', error);
      throw new Error('Failed to fetch session');
    }
  }
  async getUserSessions(userId: string, limit = 20, offset = 0): Promise<ChatSession[]> {
    try {
      this.logger.log(`Fetching sessions for user ${userId}, limit: ${limit}, offset: ${offset}`);

      // Filter sessions by userId and apply pagination
      const userSessions = Array.from(this.sessions.values())
        .filter((session) => session.userId === userId)
        .sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime()) // Sort by last activity desc
        .slice(offset, offset + limit);

      return userSessions;
    } catch (error) {
      this.logger.error('Failed to fetch user sessions:', error);
      throw new Error('Failed to fetch sessions');
    }
  }
  async updateSession(
    sessionId: string,
    userId: string,
    _updates: Partial<Pick<ChatSession, 'title' | 'description'>>
  ): Promise<ChatSession> {
    try {
      this.logger.log(`Updating session ${sessionId} for user ${userId}`);
      // Implement session update logic
      throw new Error('Session update not yet implemented');
    } catch (error) {
      this.logger.error('Failed to update session:', error);
      throw error;
    }
  }
  async deleteSession(sessionId: string, userId: string): Promise<void> {
    try {
      this.logger.log(`Deleting session ${sessionId} for user ${userId}`);
      const session = this.sessions.get(sessionId);

      // Check if session exists and belongs to the user
      if (session && session.userId === userId) {
        this.sessions.delete(sessionId);
      }
    } catch (error) {
      this.logger.error('Failed to delete session:', error);
      throw new Error('Failed to delete session');
    }
  }
  async updateLastActivity(sessionId: string): Promise<void> {
    try {
      this.logger.log(`Updating last activity for session ${sessionId}`);
      const session = this.sessions.get(sessionId);
      if (session) {
        session.lastActivityAt = new Date();
        session.updatedAt = new Date();
      }
    } catch (error) {
      this.logger.error('Failed to update last activity:', error);
      // Don't throw here as this is not critical
    }
  }
  private generateSessionId(): string {
    return randomUUID();
  }
}
