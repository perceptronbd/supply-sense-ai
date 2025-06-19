import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponseDto } from '../dto/api-response.dto';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'INTERNAL_ERROR';
    let details: Record<string, unknown> | string[] | undefined = undefined;
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = (responseObj.message as string) || exception.message;
        error =
          (responseObj.error as string) ||
          exception.constructor.name.replace('Exception', '').toUpperCase();
        details = responseObj.details as Record<string, unknown> | string[];

        // Handle validation errors specifically
        if (Array.isArray(responseObj.message)) {
          message = (responseObj.message as string[]).join(', ');
          details = responseObj.message as string[];
        }
      } else {
        message = exceptionResponse as string;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = 'INTERNAL_ERROR';

      // Log the full stack trace for debugging
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
        'GlobalExceptionFilter'
      );
    }

    // Generate correlation ID for tracking
    const correlationId =
      (request.headers['x-correlation-id'] as string) ||
      `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const errorResponse: ApiErrorResponseDto = {
      success: false,
      statusCode: status,
      message: Array.isArray(message) ? message.join(', ') : message,
      error,
      details,
      metadata: {
        timestamp: new Date().toISOString(),
        path: request.url,
        correlationId,
      },
    };

    // Log error details for monitoring
    this.logger.error(`HTTP ${status} Error: ${errorResponse.message}`, {
      correlationId,
      path: request.url,
      method: request.method,
      error: errorResponse.error,
      details: errorResponse.details,
    });

    response.status(status).json(errorResponse);
  }
}
