import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Response } from 'express';

@Injectable()
export class CorsService implements OnModuleInit {
  private readonly logger = new Logger(CorsService.name);
  private allowedOrigins: Set<string> = new Set();

  onModuleInit() {
    this.initializeAllowedOrigins();
  }

  /**
   * Initialize allowed origins from environment variable
   */
  private initializeAllowedOrigins(): void {
    const frontendUrls = (process.env.FRONTEND_URLS ?? '').trim();

    if (!frontendUrls) {
      this.logger.warn('FRONTEND_URLS environment variable is not set or empty');
      return;
    }

    const urls = frontendUrls
      .split(',')
      .map((url) => url.trim())
      .filter(Boolean) // Remove empty strings
      .map((url) => this.normalizeOrigin(url))
      .filter((url) => {
        if (!this.isValidOrigin(url)) {
          this.logger.error(`Invalid origin in FRONTEND_URLS: ${url}`);
          return false;
        }
        return true;
      });

    this.allowedOrigins = new Set(urls);

    this.logger.log(
      `Initialized CORS allowed origins: ${Array.from(this.allowedOrigins).join(', ')}`
    );
  }

  /**
   * Normalize an origin URL to its canonical form
   */
  private normalizeOrigin(origin: string): string {
    try {
      // Use URL constructor to parse and normalize
      const url = new URL(origin);

      // Ensure protocol is http or https
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error(`Unsupported protocol: ${url.protocol}`);
      }

      // Remove trailing slash from pathname if present
      let normalized = `${url.protocol}//${url.host}${url.pathname}`;
      if (normalized.endsWith('/')) {
        normalized = normalized.slice(0, -1);
      }

      return normalized;
    } catch (error) {
      this.logger.error(`Failed to normalize origin "${origin}": ${error.message}`);
      return origin; // Return as-is if normalization fails
    }
  }

  /**
   * Validate that an origin is a properly formatted URL
   */
  private isValidOrigin(origin: string): boolean {
    try {
      const url = new URL(origin);
      return ['http:', 'https:'].includes(url.protocol) && url.host.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Check if an origin is allowed
   */
  isOriginAllowed(origin: string | undefined): boolean {
    if (!origin) return false;

    const normalizedOrigin = this.normalizeOrigin(origin);
    return this.allowedOrigins.has(normalizedOrigin);
  }

  /**
   * Get the allowed origin for CORS headers (specific origin or undefined)
   */
  getAllowedOrigin(origin: string | undefined): string | undefined {
    return this.isOriginAllowed(origin) ? this.normalizeOrigin(origin) : undefined;
  }

  /**
   * Get all allowed origins (for logging/debugging)
   */
  getAllowedOrigins(): string[] {
    return Array.from(this.allowedOrigins);
  }

  /**
   * Handle CORS headers for a response
   */
  setCorsHeaders(res: Response, origin: string | undefined): void {
    const allowedOrigin = this.getAllowedOrigin(origin);

    if (allowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    }

    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  /**
   * Handle OPTIONS preflight request
   */
  handleOptionsPreflight(
    res: Response,
    origin: string | undefined,
    methods: string[] = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  ): void {
    this.setCorsHeaders(res, origin);
    res.setHeader('Access-Control-Allow-Methods', methods.join(', '));
    res.status(204).end();
  }
}
