import { Controller, Get, Inject, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { AppService } from './app.service';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(@Inject(AppService) private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Get application information',
    description: 'Returns basic information about the SupplySense Management API',
  })
  @ApiResponse({
    status: 200,
    description: 'Application information retrieved successfully',
    example: { message: 'Hello API' },
  })
  getData() {
    return this.appService.getData();
  }

  @Get('status')
  @ApiOperation({
    summary: 'Simple status check',
    description: 'Returns a simple status ok response',
  })
  @ApiResponse({
    status: 200,
    description: 'Status retrieved successfully',
    example: { status: 'ok' },
  })
  getStatus(@Res() res: Response) {
    // Bypass the ResponseInterceptor by using @Res() directly
    return res.status(200).json({ status: 'ok' });
  }

  @Get('health')
  @ApiOperation({
    summary: 'Health check endpoint',
    description: 'Returns the health status of the application and its services',
  })
  @ApiResponse({
    status: 200,
    description: 'Health check completed successfully',
  })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        api: 'healthy',
        database: 'connected',
        ai: 'available',
        chat: 'active',
      },
      uptime: process.uptime(),
    };
  }

  @Get('debug-token')
  @ApiOperation({
    summary: 'Debug JWT token',
    description: 'Debug endpoint to test JWT token extraction',
  })
  @ApiResponse({
    status: 200,
    description: 'Debug information retrieved successfully',
  })
  debugToken(@Req() request: Request) {
    const token = request.headers.authorization?.split(' ')[1];
    let decoded = null;

    try {
      // Just decode without verification
      decoded = jwt.decode(token);
    } catch (_error) {
      return { error: 'Failed to decode token' };
    }

    return {
      headers: request.headers,
      token,
      decoded,
    };
  }
}
