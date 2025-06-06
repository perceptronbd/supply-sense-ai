import { Controller, Get, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import * as jwt from 'jsonwebtoken';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Get application information',
    description:
      'Returns basic information about the Supply Chain AI Management API',
  })
  @ApiResponse({
    status: 200,
    description: 'Application information retrieved successfully',
    example: { message: 'Hello API' },
  })
  getData() {
    return this.appService.getData();
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
  debugToken(@Req() request: any) {
    const token = request.headers.authorization?.split(' ')[1];
    let decoded = null;

    try {
      // Just decode without verification
      decoded = jwt.decode(token);
    } catch (error) {
      return { error: 'Failed to decode token' };
    }

    return {
      headers: request.headers,
      token,
      decoded,
    };
  }
}
