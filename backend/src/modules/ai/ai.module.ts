import { PrismaService } from '@app/prisma.service';
import { AuthModule } from '@modules/auth/auth.module';
import { PurchaseRequestModule } from '@modules/purchase-request/purchase-request.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './ai.controller';
import { AISuggestionsService } from './services/ai-suggestions.service';
import { DemandForecastingService } from './services/demand-forecasting.service';
import { GeminiService } from './services/gemini.service';
import { PurchaseOptimizationService } from './services/purchase-optimization.service';
import { QualityAnalysisService } from './services/quality-analysis.service';
import { StockPredictionService } from './services/stock-prediction.service';
import { WorkflowAutomationService } from './services/workflow-automation.service';

@Module({
  imports: [ConfigModule, AuthModule, PurchaseRequestModule],
  controllers: [AiController],
  providers: [
    GeminiService,
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
    DemandForecastingService,
    PurchaseOptimizationService,
    QualityAnalysisService,
    StockPredictionService,
    WorkflowAutomationService,
    AISuggestionsService,
  ],
})
export class AiModule {}
