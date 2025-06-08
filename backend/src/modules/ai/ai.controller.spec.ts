import { Test, type TestingModule } from '@nestjs/testing';
import { AiController } from './ai.controller';
import {
  type DemandForecast,
  DemandForecastingService,
} from './services/demand-forecasting.service';
import {
  PurchaseOptimizationService,
  type SupplierRecommendation,
} from './services/purchase-optimization.service';
import { QualityAnalysisService } from './services/quality-analysis.service';
import { StockPredictionService } from './services/stock-prediction.service';
import { WorkflowAutomationService } from './services/workflow-automation.service';

describe('AiController', () => {
  let controller: AiController;
  let demandForecastingService: jest.Mocked<DemandForecastingService>;
  let purchaseOptimizationService: jest.Mocked<PurchaseOptimizationService>;
  let _qualityAnalysisService: jest.Mocked<QualityAnalysisService>;
  let _stockPredictionService: jest.Mocked<StockPredictionService>;
  let _workflowAutomationService: jest.Mocked<WorkflowAutomationService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        {
          provide: DemandForecastingService,
          useValue: {
            generateDemandForecast: jest.fn(),
            generateAutomaticPurchaseRequests: jest.fn(),
          },
        },
        {
          provide: PurchaseOptimizationService,
          useValue: {
            recommendOptimalSupplier: jest.fn(),
            optimizeOrderQuantities: jest.fn(),
          },
        },
        {
          provide: QualityAnalysisService,
          useValue: {
            analyzeSupplierQuality: jest.fn(),
            analyzeItemQuality: jest.fn(),
            generateQualityReport: jest.fn(),
          },
        },
        {
          provide: StockPredictionService,
          useValue: {
            predictStockLevels: jest.fn(),
            identifyStockoutRisks: jest.fn(),
            calculateOptimalReorderPoints: jest.fn(),
          },
        },
        {
          provide: WorkflowAutomationService,
          useValue: {
            autoApproveDocuments: jest.fn(),
            generateIntelligentPR: jest.fn(),
            suggestWorkflowOptimizations: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AiController>(AiController);
    demandForecastingService = module.get(DemandForecastingService);
    purchaseOptimizationService = module.get(PurchaseOptimizationService);
    _qualityAnalysisService = module.get(QualityAnalysisService);
    _stockPredictionService = module.get(StockPredictionService);
    _workflowAutomationService = module.get(WorkflowAutomationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  describe('getDemandForecast', () => {
    it('should return demand forecast', async () => {
      const mockResult: DemandForecast[] = [
        {
          itemId: '1',
          branchId: 'branch1',
          period: 'monthly',
          predictedDemand: 100,
          confidence: 0.85,
          trend: 'increasing',
          seasonalityFactor: 1.2,
          riskFactors: ['Supply shortage risk'],
          recommendations: ['Increase safety stock'],
        },
      ];
      demandForecastingService.generateDemandForecast.mockResolvedValue(mockResult);

      const result = await controller.getDemandForecast('branch1', 'item1', 30);

      expect(demandForecastingService.generateDemandForecast).toHaveBeenCalledWith(
        'branch1',
        'item1',
        30
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('getAutoPurchaseRequests', () => {
    it('should return auto purchase request recommendations', async () => {
      const mockResult = [{ itemId: '1', recommendedQty: 100 }];
      demandForecastingService.generateAutomaticPurchaseRequests.mockResolvedValue(mockResult);

      const result = await controller.getAutoPurchaseRequests('branch1');

      expect(demandForecastingService.generateAutomaticPurchaseRequests).toHaveBeenCalledWith(
        'branch1'
      );
      expect(result).toEqual(mockResult);
    });
  });
  describe('recommendSupplier', () => {
    it('should return supplier recommendations', async () => {
      const mockResult: SupplierRecommendation[] = [
        {
          supplierId: 'supplier1',
          supplierName: 'Premium Supplier Inc',
          score: 95,
          averagePrice: 25.5,
          deliveryPerformance: 98.5,
          qualityRating: 4.8,
          recommendations: ['Excellent supplier with consistent quality'],
        },
      ];
      purchaseOptimizationService.recommendOptimalSupplier.mockResolvedValue(mockResult);

      const result = await controller.recommendSupplier({ itemIds: ['item1'] });

      expect(purchaseOptimizationService.recommendOptimalSupplier).toHaveBeenCalledWith(['item1']);
      expect(result).toEqual(mockResult);
    });
  });
});
