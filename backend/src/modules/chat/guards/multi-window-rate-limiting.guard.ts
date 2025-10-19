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

/**
 * Describes a single fixed window limiter.
 *
 * The guard tracks multiple windows (e.g., minute/hour/day) simultaneously
 * by persisting an array of these objects. Each window counts requests
 * separately and resets when its duration elapses.
 */
interface RateLimitWindow {
  /** Duration of the window in milliseconds. */
  windowMs: number;
  /** Maximum allowed requests within the window. */
  maxRequests: number;
  /** Human-friendly window name (e.g., 'minute', 'hour', 'day'). */
  name: string;
  /** Number of requests observed in the current active window. */
  requestCount: number;
  /**
   * Timestamp marking the start of the active counting window.
   * Stored as Date or ISO string for serialization; null until first request.
   */
  windowStartTime: Date | string | null;
}

// Default rate limits (used if environment variables are not set)
// These values represent conservative limits suitable for development.
// Production deployments should prefer configuration via RATE_LIMIT_CONFIG.
const DEFAULT_RATE_LIMITS: RateLimitWindow[] = [
  { name: 'minute', windowMs: 60 * 1000, maxRequests: 5, requestCount: 0, windowStartTime: null },
  {
    name: 'hour',
    windowMs: 60 * 60 * 1000,
    maxRequests: 30,
    requestCount: 0,
    windowStartTime: null,
  },
  {
    name: 'day',
    windowMs: 24 * 60 * 60 * 1000,
    maxRequests: 200,
    requestCount: 0,
    windowStartTime: null,
  },
];

/**
 * Shape of a single RATE_LIMIT_CONFIG entry prior to normalization.
 * Example JSON: [{ "name": "minute", "window": "1m", "maxRequests": 5 }]
 */
interface RateLimitEnvConfig {
  name: string;
  /** Human-friendly window (e.g., '30s', '1m', '2h', '1d'). */
  window: string;
  /** Can be a string in env JSON; will be coerced to number. */
  maxRequests: number | string;
}

// Parse rate limits from environment variables
/**
 * Loads multi-window rate limits from the optional env var RATE_LIMIT_CONFIG.
 * Falls back to DEFAULT_RATE_LIMITS if unset or invalid.
 */
function getRateLimits(): RateLimitWindow[] {
  try {
    const envLimits = process.env.RATE_LIMIT_CONFIG;
    // If not configured, use defaults
    if (!envLimits) return DEFAULT_RATE_LIMITS;

    // Parse and normalize each window entry
    const limits = JSON.parse(envLimits) as RateLimitEnvConfig[];
    return limits.map((limit) => ({
      name: limit.name,
      windowMs: parseTimeString(limit.window),
      maxRequests:
        typeof limit.maxRequests === 'string'
          ? parseInt(limit.maxRequests, 10)
          : Number(limit.maxRequests),
      requestCount: 0,
      windowStartTime: null as Date | null,
    }));
  } catch (error) {
    // Defensive: if malformed JSON or coercion fails, keep service usable with defaults
    console.error('Error parsing RATE_LIMIT_CONFIG, using default limits', error);
    return DEFAULT_RATE_LIMITS;
  }
}

// Helper to convert time strings (e.g., '1h', '30m') to milliseconds
/**
 * Converts a compact time string into milliseconds.
 * Supports units: s (seconds), m (minutes), h (hours), d (days).
 * If no unit is present, treats the value as milliseconds.
 */
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
  /** In-memory baseline config used to seed DB state (one-time per company). */
  private rateLimits: RateLimitWindow[];
  private logger = new Logger(MultiWindowRateLimitGuard.name);

  constructor(
    @Inject(PrismaService)
    private prisma: PrismaService
  ) {
    // Load environment-driven windows (or defaults). This is used to initialize
    // per-company persisted config; ongoing state comes from the DB.
    this.rateLimits = getRateLimits();
    console.log('Rate limits configured:', this.rateLimits);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Extract request and user context from NestJS execution context
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    // Authorization guard: ensure authenticated user exists
    if (!user?.id) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }

    const now = new Date();
    const companyId = user.companyId;

    // Load the most recent persisted rate limit state for this company.
    // We only seed from defaults if no prior record exists.
    let apiLog = await this.prisma.apiLogs.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    // Seed initial state exactly once per company; thereafter we always read+update.
    // Important: Do NOT reinitialize on window expiry — we need continuity of counts.
    if (!apiLog) {
      const rateLimitConfig = this.rateLimits.map((limit) => ({
        name: limit.name,
        windowMs: limit.windowMs,
        maxRequests: limit.maxRequests,
        requestCount: 0,
        windowStartTime: null as Date | null,
      }));

      this.logger.log('Initializing rate limit config for company:', companyId);

      apiLog = await this.prisma.apiLogs.create({
        data: {
          method: req.method,
          url: req.url,
          companyId,
          rateLimitConfig: JSON.stringify(rateLimitConfig),
        },
      });
    }

    // Hydrate current state. Also normalize legacy shapes defensively.
    const rawConfig = JSON.parse(apiLog.rateLimitConfig as string) as RateLimitWindow[];
    const rateLimitConfig: RateLimitWindow[] = rawConfig.map((l) => ({
      name: l.name,
      windowMs: l.windowMs,
      maxRequests: l.maxRequests,
      requestCount: typeof l.requestCount === 'number' ? l.requestCount : 0,
      windowStartTime: l.windowStartTime ?? null,
    }));

    // Increment counters for this request within each active window.
    const updatedLimits = this.updateRequestCounts(rateLimitConfig, now);

    // Validate each window; if any window exceeds its allowed capacity, reject request.
    for (const limit of updatedLimits) {
      if (limit.requestCount > limit.maxRequests) {
        const start = limit.windowStartTime ? new Date(limit.windowStartTime as string) : null;
        // Compute when the current window resets; if no start, assume window starts now.
        const resetTime = start
          ? new Date(start.getTime() + limit.windowMs)
          : new Date(now.getTime() + limit.windowMs);

        const remainingMs = Math.max(0, resetTime.getTime() - now.getTime());
        const remainingSec = Math.ceil(remainingMs / 1000);
        // Provide structured payload including retry hint for clients to back off.
        throw new HttpException(
          {
            message: `Rate limit exceeded for ${limit.name}. Please wait ~${remainingSec}s before sending more messages.`,
            code: 'RATE_LIMIT_EXCEEDED',
            window: limit.name,
            limit: limit.maxRequests,
            currentUsage: limit.requestCount,
            windowMs: limit.windowMs,
            retryAfter: resetTime.toISOString(),
          },
          HttpStatus.TOO_MANY_REQUESTS
        );
      }
    }

    // Persist the updated counters for continuity across requests.
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

  /**
   * Increments request counters across all windows and resets windows as needed.
   *
   * For each window:
   * - If no active window or it has expired, start a new window and set count=1.
   * - Otherwise, increment the in-window count.
   */
  private updateRequestCounts(limits: RateLimitWindow[], currentTime: Date): RateLimitWindow[] {
    return limits.map((limit) => {
      const start = limit.windowStartTime ? new Date(limit.windowStartTime as string) : null;
      // If first request or window has passed, start a new window at currentTime
      if (!start || currentTime.getTime() - start.getTime() >= limit.windowMs) {
        return {
          ...limit,
          requestCount: 1,
          windowStartTime: currentTime,
        };
      }

      // Otherwise, increment the counter within the same window
      return {
        ...limit,
        requestCount: limit.requestCount + 1,
        windowStartTime: start,
      };
    });
  }
}
