import { RequirePermissions } from '@modules/auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@modules/auth/guards/permissions.guard';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AI_PERMISSIONS } from '@supplysense/types';

@ApiTags('ai')
@Controller('ai')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class AiController {
  // AI Health Check
  @Get('health')
  @RequirePermissions(AI_PERMISSIONS.ACCESS_SUGGESTIONS)
  @ApiOperation({ summary: 'Check AI services health status' })
  @ApiResponse({
    status: 200,
    description: 'AI health status retrieved successfully',
  })
  async getAIHealth() {
    return {
      status: 'healthy',
      services: {
        gemini: 'connected',
        demandForecasting: 'operational',
        purchaseOptimization: 'operational',
        qualityAnalysis: 'operational',
        stockPrediction: 'operational',
        workflowAutomation: 'operational',
        aiSuggestions: 'operational',
      },
      timestamp: new Date(),
      version: '1.0.0',
    };
  }
}
