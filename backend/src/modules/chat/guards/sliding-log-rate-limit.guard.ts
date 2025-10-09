import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

/**
 * The time window for rate limiting in milliseconds.
 * Requests older than this window are ignored.
 */
const WINDOW_SIZE = 60 * 1000; // 1 minute in ms

/**
 * The maximum number of allowed requests per user within the time window.
 */
const MAX_REQUESTS = 5;

/**
 * In-memory store mapping user IDs to arrays of request timestamps.
 * Each timestamp represents a request made by the user.
 */
const requestLogs: Record<string, number[]> = {};

/**
 * A NestJS guard implementing a sliding log window rate limiting algorithm.
 *
 * For each authenticated user, this guard tracks the timestamps of their requests.
 * When a new request arrives:
 * - It removes timestamps older than the configured window (WINDOW_SIZE).
 * - If the number of requests in the window exceeds MAX_REQUESTS, it throws a 429 error.
 * - Otherwise, it allows the request and logs the current timestamp.
 *
 * This guard should be used on routes where you want to enforce per-user rate limiting.
 */
@Injectable()
export class SlidingLogRateLimitGuard implements CanActivate {
  /**
   * Checks if the incoming request should be allowed based on the user's request history.
   * @param context The execution context containing the request and user information.
   * @throws HttpException with status 429 if the user exceeds the rate limit.
   * @returns true if the request is allowed.
   */
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user?.id) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }

    const now = Date.now();
    const logs = requestLogs[user.id] || [];
    // Remove timestamps outside the window
    const recentLogs = logs.filter((ts) => now - ts < WINDOW_SIZE);

    if (recentLogs.length >= MAX_REQUESTS) {
      throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    // Add current timestamp and update log
    recentLogs.push(now);
    requestLogs[user.id] = recentLogs;
    return true;
  }
}
