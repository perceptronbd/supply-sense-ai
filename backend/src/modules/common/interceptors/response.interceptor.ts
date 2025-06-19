import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto, PaginatedResponseDto } from '../dto/api-response.dto';

// Define proper types for paginated responses
interface PaginatedData {
  data?: unknown[];
  items?: unknown[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    pages?: number;
  };
  page?: number;
  limit?: number;
  total?: number;
  pages?: number;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponseDto<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponseDto<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        // Check if the response is already wrapped (to avoid double wrapping)
        if (data && typeof data === 'object' && 'success' in data && 'statusCode' in data) {
          return data;
        }

        // Generate correlation ID for tracking
        const correlationId =
          (request.headers['x-correlation-id'] as string) ||
          `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const baseResponse = {
          success: true,
          statusCode: response.statusCode,
          message: this.getSuccessMessage(request.method, response.statusCode),
          data,
          metadata: {
            timestamp: new Date().toISOString(),
            path: request.url,
            version: '1.0',
            correlationId,
          },
        }; // Check if this is a paginated response
        if (this.isPaginatedResponse(data)) {
          const paginatedData = data as PaginatedData;
          const paginatedResponse: PaginatedResponseDto<T> = {
            ...baseResponse,
            data: (paginatedData.data || paginatedData.items || []) as T[],
            metadata: {
              ...baseResponse.metadata,
              pagination: {
                page: paginatedData.meta?.page || paginatedData.page || 1,
                limit: paginatedData.meta?.limit || paginatedData.limit || 10,
                total: paginatedData.meta?.total || paginatedData.total || 0,
                pages: paginatedData.meta?.pages || paginatedData.pages || 1,
              },
            },
          };
          return paginatedResponse as ApiResponseDto<T>;
        }

        return baseResponse;
      })
    );
  }

  private getSuccessMessage(method: string, statusCode: number): string {
    switch (method.toUpperCase()) {
      case 'POST':
        return statusCode === 201
          ? 'Resource created successfully'
          : 'Request completed successfully';
      case 'PUT':
        return 'Resource updated successfully';
      case 'PATCH':
        return 'Resource partially updated successfully';
      case 'DELETE':
        return 'Resource deleted successfully';
      case 'GET':
        return 'Data retrieved successfully';
      default:
        return 'Request completed successfully';
    }
  }
  private isPaginatedResponse(data: unknown): data is PaginatedData {
    if (!data || typeof data !== 'object') {
      return false;
    }

    const obj = data as Record<string, unknown>;

    // Check for common pagination patterns
    return (
      // Pattern 1: { data: [...], meta: { page, limit, total, pages } }
      ('data' in obj && Array.isArray(obj.data) && 'meta' in obj) ||
      // Pattern 2: { items: [...], page, limit, total, pages }
      ('items' in obj && Array.isArray(obj.items) && ('page' in obj || 'limit' in obj)) ||
      // Pattern 3: { data: [...], page, limit, total, pages }
      ('data' in obj && Array.isArray(obj.data) && ('page' in obj || 'limit' in obj))
    );
  }
}
