import * as dotenv from 'dotenv';

dotenv.config();

import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';

import { PrismaService } from '@supplysense/prisma';
import type { ApiLogs } from '@supplysense/prisma-client';

interface RateLimitWindow {
  windowMs: number;
  maxRequests: number;
  name: string;
  requestCount: number;
  lastRequestTime: Date | null;
}

// Default rate limits (used if environment variables are not set)
const DEFAULT_RATE_LIMITS: RateLimitWindow[] = [
  { name: 'minute', windowMs: 60 * 1000, maxRequests: 5, requestCount: 0, lastRequestTime: null },
  {
    name: 'hour',
    windowMs: 60 * 60 * 1000,
    maxRequests: 30,
    requestCount: 0,
    lastRequestTime: null,
  },
  {
    name: 'day',
    windowMs: 24 * 60 * 60 * 1000,
    maxRequests: 200,
    requestCount: 0,
    lastRequestTime: null,
  },
];

interface RateLimitEnvConfig {
  name: string;
  window: string;
  maxRequests: string;
}

// Parse rate limits from environment variables
function getRateLimits(): RateLimitWindow[] {
  try {
    const envLimits = process.env.RATE_LIMIT_CONFIG;
    if (!envLimits) return DEFAULT_RATE_LIMITS;

    const limits = JSON.parse(envLimits) as RateLimitEnvConfig[];
    return limits.map((limit) => ({
      name: limit.name,
      windowMs: parseTimeString(limit.window),
      maxRequests: parseInt(limit.maxRequests, 10),
      requestCount: 0,
      lastRequestTime: null as Date | null,
    }));
  } catch (error) {
    console.error('Error parsing RATE_LIMIT_CONFIG, using default limits', error);
    return DEFAULT_RATE_LIMITS;
  }
}

// Helper to convert time strings (e.g., '1h', '30m') to milliseconds
function parseTimeString(timeStr: string): number {
  const value = parseInt(timeStr, 10);
  if (timeStr.endsWith('s')) return value * 1000;
  if (timeStr.endsWith('m')) return value * 60 * 1000;
  if (timeStr.endsWith('h')) return value * 60 * 60 * 1000;
  if (timeStr.endsWith('d')) return value * 24 * 60 * 60 * 1000;
  return parseInt(timeStr, 10); // Default to milliseconds if no unit specified
}

@Injectable()
export class MultiWindowRateLimitGuard implements CanActivate {
  private rateLimits: RateLimitWindow[];
  private logger = new Logger(MultiWindowRateLimitGuard.name);

  constructor(
    @Inject(PrismaService)
    private prisma: PrismaService
  ) {
    this.rateLimits = getRateLimits();
    console.log('Rate limits configured:', this.rateLimits);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user?.id) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }

    const now = new Date();
    const companyId = user.companyId;

    // Try to get existing rate limit config from the database
    let apiLog = await this.prisma.apiLogs.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    // If no existing config or it's too old, create a new one
    if (!apiLog || this.isConfigExpired(apiLog, now)) {
      const rateLimitConfig = this.rateLimits.map((limit) => ({
        name: limit.name,
        windowMs: limit.windowMs,
        maxRequests: limit.maxRequests,
        requestCount: 0,
        lastRequestTime: null as Date | null,
      }));

      this.logger.log('Creating new rate limit config:', rateLimitConfig);

      apiLog = await this.prisma.apiLogs.create({
        data: {
          method: req.method,
          url: req.url,
          companyId,
          rateLimitConfig: JSON.stringify(rateLimitConfig),
        },
      });
    }

    const rateLimitConfig = JSON.parse(apiLog.rateLimitConfig as string) as RateLimitWindow[];

    // Update request counts and check limits
    const updatedLimits = this.updateRequestCounts(rateLimitConfig, now);

    // Check if any limit is exceeded
    for (const limit of updatedLimits) {
      if (limit.requestCount > limit.maxRequests) {
        const resetTime = limit.lastRequestTime
          ? new Date(limit.lastRequestTime.getTime() + limit.windowMs)
          : new Date(now.getTime() + limit.windowMs);

        throw new HttpException(
          {
            message: `${limit.name} rate limit exceeded`,
            limit: limit.maxRequests,
            window: limit.name,
            retryAfter: resetTime.toISOString(),
            currentUsage: limit.requestCount,
          },
          HttpStatus.TOO_MANY_REQUESTS
        );
      }
    }

    // Update the database with new request counts
    await this.prisma.apiLogs.update({
      where: { id: apiLog.id },
      data: {
        rateLimitConfig: JSON.stringify(updatedLimits),
        method: req.method,
        url: req.url,
      },
    });

    return true;
  }

  private isConfigExpired(apiLog: ApiLogs, currentTime: Date): boolean {
    const rateLimitConfig = JSON.parse(apiLog.rateLimitConfig as string) as RateLimitWindow[];

    if (!rateLimitConfig || !Array.isArray(rateLimitConfig)) {
      return true;
    }

    // Check if any rate limit window has passed since the last request
    return rateLimitConfig.some((limit: RateLimitWindow) => {
      if (!limit.lastRequestTime) return false;
      const lastRequestTime = new Date(limit.lastRequestTime);
      return currentTime.getTime() - lastRequestTime.getTime() > limit.windowMs;
    });
  }

  private updateRequestCounts(limits: RateLimitWindow[], currentTime: Date): RateLimitWindow[] {
    return limits.map((limit) => {
      // If this is the first request or window has passed, reset the counter
      if (
        !limit.lastRequestTime ||
        currentTime.getTime() - new Date(limit.lastRequestTime).getTime() > limit.windowMs
      ) {
        return {
          ...limit,
          requestCount: 1,
          lastRequestTime: currentTime,
        };
      }

      // Otherwise, increment the counter
      return {
        ...limit,
        requestCount: limit.requestCount + 1,
        lastRequestTime: currentTime,
      };
    });
  }
}
