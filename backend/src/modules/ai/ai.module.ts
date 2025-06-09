import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../../app/prisma.service';
import { PurchaseRequestModule } from '../purchase-request/purchase-request.module';
import { AiController } from './ai.controller';
import { AISuggestionsService } from './services/ai-suggestions.service';
import { DemandForecastingService } from './services/demand-forecasting.service';
import { GeminiService } from './services/gemini.service';
import { McpConfigService } from './services/mcp-config.service';
import { McpServerService } from './services/mcp-server.service';
import { PurchaseOptimizationService } from './services/purchase-optimization.service';
import { QualityAnalysisService } from './services/quality-analysis.service';
import { StockPredictionService } from './services/stock-prediction.service';
import { WorkflowAutomationService } from './services/workflow-automation.service';

@Module({
  imports: [ConfigModule, PurchaseRequestModule],
  controllers: [AiController],
  providers: [
    GeminiService,
    McpServerService,
    McpConfigService,
    DemandForecastingService,
    PurchaseOptimizationService,
    QualityAnalysisService,
    StockPredictionService,
    WorkflowAutomationService,
    AISuggestionsService,
    PrismaService,
  ],
  exports: [
    GeminiService,
    McpServerService,
    DemandForecastingService,
    PurchaseOptimizationService,
    QualityAnalysisService,
    StockPredictionService,
    WorkflowAutomationService,
    AISuggestionsService,
  ],
})
export class AiModule {}
