import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@supplysense/prisma-client';
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
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = this.handlePrismaError(exception);
      status = prismaError.status;
      message = prismaError.message;
      error = prismaError.error;

      // Log Prisma errors for debugging
      this.logger.error(
        `Prisma error ${exception.code}: ${exception.message}`,
        exception.stack,
        'GlobalExceptionFilter'
      );
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

  /**
   * Get user-friendly error message for unique constraint violations
   */
  private getUniqueConstraintErrorMessage(target: unknown): string {
    if (!Array.isArray(target)) {
      return 'A record with this data already exists';
    }

    // Company-specific unique constraints
    if (target.includes('taxId')) {
      return 'A company with this tax ID already exists';
    }
    if (target.includes('contactEmail')) {
      return 'A company with this email is already registered';
    }

    // User-specific unique constraints
    if (target.includes('email')) {
      return 'A user with this email already exists';
    }
    if (target.includes('username')) {
      return 'This username is already taken';
    }

    // Branch-specific unique constraints
    if (target.includes('companyId') && target.includes('code')) {
      return 'A branch with this code already exists in your company';
    }
    if (target.includes('code')) {
      return 'This code is already in use';
    }

    // Item-specific unique constraints
    if (target.includes('companyId') && target.includes('sku')) {
      return 'An item with this SKU already exists in your company';
    }
    if (target.includes('sku')) {
      return 'This SKU is already in use';
    }

    // Supplier-specific unique constraints
    if (target.includes('companyId') && target.includes('name')) {
      return 'A supplier with this name already exists in your company';
    }
    if (target.includes('name')) {
      return 'A record with this name already exists';
    }

    return 'A record with this data already exists';
  }

  /**
   * Handle Prisma errors and return appropriate HTTP status and message
   */
  private handlePrismaError(exception: Prisma.PrismaClientKnownRequestError): {
    status: number;
    message: string;
    error: string;
  } {
    if (exception.code === 'P2002') {
      // Unique constraint violation
      return {
        status: HttpStatus.CONFLICT,
        message: this.getUniqueConstraintErrorMessage(exception.meta?.target),
        error: 'CONFLICT',
      };
    }

    if (exception.code === 'P2025') {
      // Record not found
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'Record not found',
        error: 'NOT_FOUND',
      };
    }

    if (exception.code === 'P2003') {
      // Foreign key constraint failed
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Invalid reference to related record',
        error: 'BAD_REQUEST',
      };
    }

    // Other Prisma errors
    return {
      status: HttpStatus.BAD_REQUEST,
      message: 'Database operation failed',
      error: 'DATABASE_ERROR',
    };
  }
}
