import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T = unknown> {
  @ApiProperty({
    description: 'Request success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'HTTP status code',
    example: 200,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Response message',
    example: 'Request completed successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Response data',
    required: false,
  })
  data?: T;

  @ApiProperty({
    description: 'Additional metadata',
    required: false,
    example: {
      timestamp: '2025-06-19T10:00:00.000Z',
      path: '/api/suppliers',
      version: '1.0',
    },
  })
  metadata?: {
    timestamp: string;
    path: string;
    version?: string;
    correlationId?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export class ApiErrorResponseDto {
  @ApiProperty({
    description: 'Request success status',
    default: false,
    example: false,
  })
  success: boolean;

  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message',
    example: 'Validation failed',
  })
  message: string;
  @ApiProperty({
    description: 'Error code',
    required: false,
    example: 'VALIDATION_ERROR',
  })
  error?: string;

  @ApiProperty({
    description: 'Validation errors or additional error details',
    required: false,
    example: {
      field: 'email',
      constraints: ['email must be a valid email'],
    },
  })
  details?: Record<string, unknown> | string[];

  @ApiProperty({
    description: 'Error metadata',
    example: {
      timestamp: '2025-06-19T10:00:00.000Z',
      path: '/api/suppliers',
      correlationId: 'abc-123-def',
    },
  })
  metadata: {
    timestamp: string;
    path: string;
    correlationId?: string;
  };
}

export class PaginatedResponseDto<T = unknown> extends ApiResponseDto<T[]> {
  @ApiProperty({
    description: 'Pagination metadata',
    example: {
      timestamp: '2025-06-19T10:00:00.000Z',
      path: '/api/suppliers',
      version: '1.0',
      pagination: {
        page: 1,
        limit: 10,
        total: 50,
        pages: 5,
      },
    },
  })
  metadata: {
    timestamp: string;
    path: string;
    version?: string;
    correlationId?: string;
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}
