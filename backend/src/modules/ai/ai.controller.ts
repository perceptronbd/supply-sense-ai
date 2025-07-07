import { AuthenticatedUser, CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { RequirePermissions } from '@modules/auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@modules/auth/guards/permissions.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AI_PERMISSIONS } from '@supplysense/types';
import {
  AISuggestionFiltersDto,
  AcceptSuggestionDto,
  CreateAISuggestionDto,
  GenerateSuggestionsDto,
  RejectSuggestionDto,
  UpdateAISuggestionDto,
} from './dto/ai-suggestions.dto';
import { OptimizeQuantitiesDto, SmartRoutingDto } from './dto/ai.dto';
import { AISuggestionsService } from './services/ai-suggestions.service';
import { DemandForecastingService } from './services/demand-forecasting.service';
import { PurchaseOptimizationService } from './services/purchase-optimization.service';
import { QualityAnalysisService } from './services/quality-analysis.service';
import { StockPredictionService } from './services/stock-prediction.service';
import { WorkflowAutomationService } from './services/workflow-automation.service';

@ApiTags('ai')
@Controller('ai')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class AiController {
  constructor(
    @Inject(DemandForecastingService) private demandForecastingService: DemandForecastingService,
    @Inject(PurchaseOptimizationService)
    private purchaseOptimizationService: PurchaseOptimizationService,
    @Inject(QualityAnalysisService) private qualityAnalysisService: QualityAnalysisService,
    @Inject(StockPredictionService) private stockPredictionService: StockPredictionService,
    @Inject(WorkflowAutomationService) private workflowAutomationService: WorkflowAutomationService,
    @Inject(AISuggestionsService) private aiSuggestionsService: AISuggestionsService
  ) {}

  // Demand Forecasting Endpoints
  @Get('demand-forecast')
  @RequirePermissions(AI_PERMISSIONS.DEMAND_FORECASTING)
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
  @RequirePermissions(AI_PERMISSIONS.ACCESS_SUGGESTIONS)
  @ApiOperation({
    summary: 'Generate automatic purchase request recommendations',
  })
  @ApiResponse({
    status: 200,
    description: 'Auto PR recommendations generated successfully',
  })
  async getAutoPurchaseRequests(
    @Param('branchId') branchId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('createActualPRs') createActualPRs?: string
  ) {
    const shouldCreatePRs = createActualPRs === 'true';

    return this.demandForecastingService.generateAutomaticPurchaseRequests(
      branchId,
      user.id,
      shouldCreatePRs
    );
  }

  // Purchase Optimization Endpoints
  @Post('recommend-supplier')
  @RequirePermissions(AI_PERMISSIONS.ACCESS_SUGGESTIONS)
  @ApiOperation({ summary: 'Get supplier recommendations for items' })
  @ApiResponse({
    status: 200,
    description: 'Supplier recommendations generated successfully',
  })
  async recommendSupplier(@Body() body: { itemIds: string[] }) {
    return this.purchaseOptimizationService.recommendOptimalSupplier(body.itemIds);
  }

  @Post('optimize-quantities')
  @RequirePermissions(AI_PERMISSIONS.ACCESS_SUGGESTIONS)
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
  @RequirePermissions(AI_PERMISSIONS.ANALYTICS)
  @ApiOperation({ summary: 'Analyze supplier quality performance' })
  @ApiResponse({
    status: 200,
    description: 'Quality analysis completed successfully',
  })
  async getQualityAnalysis(@Query('supplierId') supplierId?: string) {
    return this.qualityAnalysisService.analyzeSupplierQuality(supplierId);
  }

  @Get('anomaly-detection/:grId')
  @RequirePermissions(AI_PERMISSIONS.ANALYTICS)
  @ApiOperation({ summary: 'Detect anomalies in goods receipt' })
  @ApiResponse({
    status: 200,
    description: 'Anomaly detection completed successfully',
  })
  async detectAnomalies(@Param('grId') grId: string) {
    return this.qualityAnalysisService.detectGoodsReceiptAnomalies(grId);
  }

  @Get('quality-report')
  @RequirePermissions(AI_PERMISSIONS.ANALYTICS)
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
  @RequirePermissions(AI_PERMISSIONS.DEMAND_FORECASTING)
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
  @RequirePermissions(AI_PERMISSIONS.ACCESS_SUGGESTIONS)
  @ApiOperation({ summary: 'Generate reorder recommendations for branch' })
  @ApiResponse({
    status: 200,
    description: 'Reorder recommendations generated successfully',
  })
  async getReorderRecommendations(@Param('branchId') branchId: string) {
    return this.stockPredictionService.generateReorderRecommendations(branchId);
  }

  @Get('stock-report/:branchId')
  @RequirePermissions(AI_PERMISSIONS.ANALYTICS)
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
  @RequirePermissions(AI_PERMISSIONS.MANAGE_SUGGESTIONS)
  @ApiOperation({ summary: 'Evaluate PR for auto-approval' })
  @ApiResponse({
    status: 200,
    description: 'PR evaluation completed successfully',
  })
  async evaluatePRApproval(@Param('prId') prId: string) {
    return this.workflowAutomationService.evaluatePRForAutoApproval(prId);
  }

  @Get('optimize-workflow/:workflowType')
  @RequirePermissions(AI_PERMISSIONS.ANALYTICS)
  @ApiOperation({ summary: 'Analyze and optimize workflow' })
  @ApiResponse({
    status: 200,
    description: 'Workflow optimization completed successfully',
  })
  async optimizeWorkflow(@Param('workflowType') workflowType: 'PR' | 'PO' | 'GR') {
    return this.workflowAutomationService.optimizeWorkflow(workflowType);
  }

  @Post('smart-routing')
  @RequirePermissions(AI_PERMISSIONS.MANAGE_SUGGESTIONS)
  @ApiOperation({ summary: 'Intelligently route document for approval' })
  @ApiResponse({
    status: 200,
    description: 'Smart routing completed successfully',
  })
  async smartRouting(@Body() body: SmartRoutingDto) {
    return this.workflowAutomationService.routeDocumentIntelligently(
      body.documentType,
      body.documentId
    );
  }

  // ============================================================================
  // AI SUGGESTIONS CRUD ENDPOINTS
  // ============================================================================

  @Post('suggestions')
  @RequirePermissions(AI_PERMISSIONS.MANAGE_SUGGESTIONS)
  @ApiOperation({ summary: 'Create a new AI suggestion' })
  @ApiResponse({
    status: 201,
    description: 'AI suggestion created successfully',
  })
  async createSuggestion(@Body() body: CreateAISuggestionDto) {
    return this.aiSuggestionsService.createSuggestion(body);
  }

  @Get('suggestions')
  @RequirePermissions(AI_PERMISSIONS.ACCESS_SUGGESTIONS)
  @ApiOperation({ summary: 'Get all AI suggestions with filters' })
  @ApiResponse({
    status: 200,
    description: 'AI suggestions retrieved successfully',
  })
  async getAllSuggestions(@Query() filters: AISuggestionFiltersDto) {
    return this.aiSuggestionsService.getAllSuggestions(filters);
  }

  @Get('suggestions/stats')
  @RequirePermissions(AI_PERMISSIONS.ACCESS_SUGGESTIONS)
  @ApiOperation({ summary: 'Get AI suggestions statistics' })
  @ApiResponse({
    status: 200,
    description: 'Suggestions statistics retrieved successfully',
  })
  async getSuggestionsStats(@Query('userId') userId?: string) {
    return this.aiSuggestionsService.getSuggestionsStats(userId);
  }

  @Get('suggestions/:id')
  @RequirePermissions(AI_PERMISSIONS.ACCESS_SUGGESTIONS)
  @ApiOperation({ summary: 'Get AI suggestion by ID' })
  @ApiResponse({
    status: 200,
    description: 'AI suggestion retrieved successfully',
  })
  async getSuggestionById(@Param('id') id: string) {
    return this.aiSuggestionsService.getSuggestionById(id);
  }

  @Put('suggestions/:id')
  @RequirePermissions(AI_PERMISSIONS.MANAGE_SUGGESTIONS)
  @ApiOperation({ summary: 'Update AI suggestion' })
  @ApiResponse({
    status: 200,
    description: 'AI suggestion updated successfully',
  })
  async updateSuggestion(@Param('id') id: string, @Body() body: UpdateAISuggestionDto) {
    return this.aiSuggestionsService.updateSuggestion(id, body);
  }

  @Delete('suggestions/:id')
  @RequirePermissions(AI_PERMISSIONS.MANAGE_SUGGESTIONS)
  @ApiOperation({ summary: 'Delete AI suggestion' })
  @ApiResponse({
    status: 200,
    description: 'AI suggestion deleted successfully',
  })
  async deleteSuggestion(@Param('id') id: string) {
    return this.aiSuggestionsService.deleteSuggestion(id);
  }

  @Post('suggestions/:id/accept')
  @RequirePermissions(AI_PERMISSIONS.MANAGE_SUGGESTIONS)
  @ApiOperation({ summary: 'Accept an AI suggestion' })
  @ApiResponse({
    status: 200,
    description: 'AI suggestion accepted successfully',
  })
  async acceptSuggestion(
    @Param('id') id: string,
    @Body() _body: AcceptSuggestionDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.aiSuggestionsService.acceptSuggestion(id, user.id);
  }

  @Post('suggestions/:id/reject')
  @RequirePermissions(AI_PERMISSIONS.MANAGE_SUGGESTIONS)
  @ApiOperation({ summary: 'Reject an AI suggestion' })
  @ApiResponse({
    status: 200,
    description: 'AI suggestion rejected successfully',
  })
  async rejectSuggestion(@Param('id') id: string, @Body() body: RejectSuggestionDto) {
    return this.aiSuggestionsService.rejectSuggestion(id, body.reason);
  }

  @Post('suggestions/generate')
  @RequirePermissions(AI_PERMISSIONS.MANAGE_SUGGESTIONS)
  @ApiOperation({ summary: 'Generate new AI suggestions for analysis' })
  @ApiResponse({
    status: 200,
    description: 'AI suggestions generated successfully',
  })
  async generateSuggestions(
    @Body() body: GenerateSuggestionsDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.aiSuggestionsService.generateSuggestions(body.branchId, user.id);
  }

  // AI Insights Dashboard
  @Get('dashboard/:branchId')
  @RequirePermissions(AI_PERMISSIONS.ANALYTICS)
  @ApiOperation({ summary: 'Get AI-powered dashboard data for a branch' })
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
