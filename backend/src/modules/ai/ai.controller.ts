import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { OptimizeQuantitiesDto } from './dto/ai.dto';
import type { DemandForecastingService } from './services/demand-forecasting.service';
import type { PurchaseOptimizationService } from './services/purchase-optimization.service';
import type { QualityAnalysisService } from './services/quality-analysis.service';
import type { StockPredictionService } from './services/stock-prediction.service';
import type { WorkflowAutomationService } from './services/workflow-automation.service';

@ApiTags('ai')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(
    private demandForecastingService: DemandForecastingService,
    private purchaseOptimizationService: PurchaseOptimizationService,
    private qualityAnalysisService: QualityAnalysisService,
    private stockPredictionService: StockPredictionService,
    private workflowAutomationService: WorkflowAutomationService
  ) {}

  // Demand Forecasting Endpoints
  @Get('demand-forecast')
  @ApiOperation({ summary: 'Generate demand forecast for items' })
  @ApiResponse({
    status: 200,
    description: 'Demand forecast generated successfully',
  })
  async getDemandForecast(
    @Query('branchId') branchId?: string,
    @Query('itemId') itemId?: string,
    @Query('daysAhead') daysAhead?: number
  ) {
    return this.demandForecastingService.generateDemandForecast(branchId, itemId, daysAhead);
  }

  @Get('auto-purchase-requests/:branchId')
  @ApiOperation({
    summary: 'Generate automatic purchase request recommendations',
  })
  @ApiResponse({
    status: 200,
    description: 'Auto PR recommendations generated successfully',
  })
  async getAutoPurchaseRequests(@Param('branchId') branchId: string) {
    return this.demandForecastingService.generateAutomaticPurchaseRequests(branchId);
  }

  // Purchase Optimization Endpoints
  @Post('recommend-supplier')
  @ApiOperation({ summary: 'Get supplier recommendations for items' })
  @ApiResponse({
    status: 200,
    description: 'Supplier recommendations generated successfully',
  })
  async recommendSupplier(@Body() body: { itemIds: string[] }) {
    return this.purchaseOptimizationService.recommendOptimalSupplier(body.itemIds);
  }

  @Post('optimize-quantities')
  @ApiOperation({ summary: 'Optimize order quantities for PO items' })
  @ApiResponse({
    status: 200,
    description: 'Order quantities optimized successfully',
  })
  async optimizeQuantities(@Body() body: OptimizeQuantitiesDto) {
    return this.purchaseOptimizationService.optimizeOrderQuantities(body.poItems);
  }

  // Quality Analysis Endpoints
  @Get('quality-analysis')
  @ApiOperation({ summary: 'Analyze supplier quality performance' })
  @ApiResponse({
    status: 200,
    description: 'Quality analysis completed successfully',
  })
  async getQualityAnalysis(@Query('supplierId') supplierId?: string) {
    return this.qualityAnalysisService.analyzeSupplierQuality(supplierId);
  }

  @Get('anomaly-detection/:grId')
  @ApiOperation({ summary: 'Detect anomalies in goods receipt' })
  @ApiResponse({
    status: 200,
    description: 'Anomaly detection completed successfully',
  })
  async detectAnomalies(@Param('grId') grId: string) {
    return this.qualityAnalysisService.detectGoodsReceiptAnomalies(grId);
  }

  @Get('quality-report')
  @ApiOperation({ summary: 'Generate comprehensive quality report' })
  @ApiResponse({
    status: 200,
    description: 'Quality report generated successfully',
  })
  async getQualityReport(
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.qualityAnalysisService.generateQualityReport(branchId, start, end);
  }

  // Stock Prediction Endpoints
  @Get('stock-prediction/:branchId')
  @ApiOperation({ summary: 'Predict stock levels for branch' })
  @ApiResponse({
    status: 200,
    description: 'Stock predictions generated successfully',
  })
  async getStockPrediction(
    @Param('branchId') branchId: string,
    @Query('itemId') itemId?: string,
    @Query('daysAhead') daysAhead?: number
  ) {
    return this.stockPredictionService.predictStockLevels(branchId, itemId, daysAhead);
  }

  @Get('reorder-recommendations/:branchId')
  @ApiOperation({ summary: 'Generate reorder recommendations for branch' })
  @ApiResponse({
    status: 200,
    description: 'Reorder recommendations generated successfully',
  })
  async getReorderRecommendations(@Param('branchId') branchId: string) {
    return this.stockPredictionService.generateReorderRecommendations(branchId);
  }

  @Get('stock-report/:branchId')
  @ApiOperation({ summary: 'Generate comprehensive stock management report' })
  @ApiResponse({
    status: 200,
    description: 'Stock report generated successfully',
  })
  async getStockReport(@Param('branchId') branchId: string) {
    return this.stockPredictionService.generateStockReport(branchId);
  }

  // Workflow Automation Endpoints
  @Post('evaluate-pr-approval/:prId')
  @ApiOperation({ summary: 'Evaluate PR for auto-approval' })
  @ApiResponse({
    status: 200,
    description: 'PR evaluation completed successfully',
  })
  async evaluatePRApproval(@Param('prId') prId: string) {
    return this.workflowAutomationService.evaluatePRForAutoApproval(prId);
  }

  @Get('optimize-workflow/:workflowType')
  @ApiOperation({ summary: 'Analyze and optimize workflow' })
  @ApiResponse({
    status: 200,
    description: 'Workflow optimization completed successfully',
  })
  async optimizeWorkflow(@Param('workflowType') workflowType: 'PR' | 'PO' | 'GR') {
    return this.workflowAutomationService.optimizeWorkflow(workflowType);
  }

  @Post('smart-routing')
  @ApiOperation({ summary: 'Intelligently route document for approval' })
  @ApiResponse({
    status: 200,
    description: 'Smart routing completed successfully',
  })
  async smartRouting(@Body() body: { documentType: 'PR' | 'PO' | 'GR'; documentId: string }) {
    return this.workflowAutomationService.routeDocumentIntelligently(
      body.documentType,
      body.documentId
    );
  }

  // AI Insights Dashboard
  @Get('dashboard/:branchId')
  @ApiOperation({ summary: 'Get AI insights dashboard for branch' })
  @ApiResponse({
    status: 200,
    description: 'AI dashboard data retrieved successfully',
  })
  async getAIDashboard(@Param('branchId') branchId: string) {
    try {
      // Parallel execution of multiple AI analyses
      const [demandForecast, stockPredictions, qualityAnalysis, reorderRecommendations] =
        await Promise.all([
          this.demandForecastingService.generateDemandForecast(branchId, undefined, 30),
          this.stockPredictionService.predictStockLevels(branchId, undefined, 30),
          this.qualityAnalysisService.analyzeSupplierQuality(),
          this.stockPredictionService.generateReorderRecommendations(branchId),
        ]);

      // Summary metrics
      const summary = {
        totalItemsTracked: stockPredictions.length,
        highRiskItems: stockPredictions.filter((p) => p.stockoutRisk === 'high').length,
        itemsNeedingReorder: reorderRecommendations.length,
        averageQualityScore:
          qualityAnalysis.length > 0
            ? qualityAnalysis.reduce((sum, qa) => sum + qa.qualityScore, 0) / qualityAnalysis.length
            : 100,
        totalForecastedDemand: demandForecast.reduce((sum, df) => sum + df.predictedDemand, 0),
      };

      return {
        branchId,
        generatedAt: new Date(),
        summary,
        demandForecast: demandForecast.slice(0, 10), // Top 10 items
        stockPredictions: stockPredictions.slice(0, 10), // Top 10 risk items
        qualityAnalysis: qualityAnalysis.slice(0, 5), // Top 5 suppliers
        reorderRecommendations: reorderRecommendations.slice(0, 10), // Top 10 urgent items
        insights: [
          `${summary.highRiskItems} items at high risk of stockout`,
          `${summary.itemsNeedingReorder} items need immediate reordering`,
          `Average supplier quality score: ${summary.averageQualityScore.toFixed(1)}%`,
          `Total forecasted demand for next 30 days: ${summary.totalForecastedDemand} units`,
        ],
      };
    } catch (_error) {
      throw new Error('Failed to generate AI dashboard');
    }
  }

  // AI Health Check
  @Get('health')
  @ApiOperation({ summary: 'Check AI services health' })
  @ApiResponse({
    status: 200,
    description: 'AI services health check completed',
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
      },
      timestamp: new Date(),
      version: '1.0.0',
    };
  }
}
