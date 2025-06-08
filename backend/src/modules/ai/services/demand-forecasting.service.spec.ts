import { Test, TestingModule } from "@nestjs/testing";
import { Decimal } from "@prisma/client/runtime/library";
import { PrismaService } from "../../../app/prisma.service";
import { GeminiService } from "./gemini.service";
import { DemandForecastingService } from "./demand-forecasting.service";

describe("DemandForecastingService", () => {
  let service: DemandForecastingService;
  let prismaService: PrismaService;
  let geminiService: GeminiService;
  const mockPrismaService = {
    goodsReceipt: {
      findMany: jest.fn(),
    },
    stock: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    gRItem: {
      findMany: jest.fn(),
    },
    pRItem: {
      findMany: jest.fn(),
    },
  };
  const mockGeminiService = {
    generateText: jest.fn(),
    isAvailable: jest.fn().mockReturnValue(true),
    analyzeSupplyChainData: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DemandForecastingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: GeminiService,
          useValue: mockGeminiService,
        },
      ],
    }).compile();

    service = module.get<DemandForecastingService>(DemandForecastingService);
    prismaService = module.get<PrismaService>(PrismaService);
    geminiService = module.get<GeminiService>(GeminiService);
  });
  beforeEach(() => {
    jest.clearAllMocks();

    // Set default mock return values to prevent undefined errors
    mockPrismaService.goodsReceipt.findMany.mockResolvedValue([]);
    mockPrismaService.stock.findMany.mockResolvedValue([]);
    mockPrismaService.stock.findFirst.mockResolvedValue(null);
    mockPrismaService.gRItem.findMany.mockResolvedValue([]);
    mockPrismaService.pRItem.findMany.mockResolvedValue([]);
    mockGeminiService.generateText.mockResolvedValue(
      '{"analysis": "test", "forecasts": []}'
    );
    mockGeminiService.analyzeSupplyChainData.mockResolvedValue({
      analysis: "test",
    });
  });
  it("should be defined", () => {
    expect(service).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(geminiService).toBeDefined();
  });

  it("should have prisma service injected correctly", () => {
    // Check if the service has access to prisma
    expect((service as any).prisma).toBeDefined();
    expect((service as any).geminiService).toBeDefined();
  });
  describe("predictDemand", () => {
    it("should predict demand for a single item", async () => {
      // Mock PR history data with proper structure
      const mockPRHistory = [
        {
          itemId: "item1",
          quantity: new Decimal(100),
          estimatedPrice: new Decimal(10.0),
          purchaseRequest: {
            createdAt: new Date("2024-01-01"),
            status: "COMPLETED",
          },
        },
        {
          itemId: "item1",
          quantity: new Decimal(120),
          estimatedPrice: new Decimal(10.0),
          purchaseRequest: {
            createdAt: new Date("2024-01-15"),
            status: "COMPLETED",
          },
        },
      ];

      // Mock GR history data with proper structure
      const mockGRHistory = [
        {
          itemId: "item1",
          quantityReceived: 90,
          goodsReceipt: {
            createdAt: new Date("2024-01-20"),
            status: "RECEIVED",
          },
        },
      ];

      // Mock current stock data
      const mockStock = {
        itemId: "item1",
        branchId: "branch1",
        quantity: 50,
        reorderLevel: 20,
        item: {
          name: "Test Item",
          description: "Test item description",
        },
      };

      mockPrismaService.pRItem.findMany.mockResolvedValue(mockPRHistory);
      mockPrismaService.gRItem.findMany.mockResolvedValue(mockGRHistory);
      mockPrismaService.stock.findFirst.mockResolvedValue(mockStock);
      mockGeminiService.generateText.mockResolvedValue(
        JSON.stringify({
          itemId: "item1",
          predictedDemand: 110,
          confidence: 0.85,
          trend: "stable",
          seasonality: "none",
          recommendations: ["Maintain current stock levels"],
        })
      );
      const result = await service.predictDemand(
        "item1",
        "branch1",
        "monthly",
        3
      );
      expect(result).toEqual({
        itemId: "item1",
        branchId: "branch1",
        period: "monthly",
        predictedDemand: expect.any(Number),
        confidence: expect.any(Number),
        trend: expect.any(String),
        seasonalityFactor: expect.any(Number),
        riskFactors: expect.any(Array),
        recommendations: expect.any(Array),
      });
      expect(mockPrismaService.pRItem.findMany).toHaveBeenCalled();
      expect(mockPrismaService.gRItem.findMany).toHaveBeenCalled();
    });

    it("should handle missing historical data", async () => {
      mockPrismaService.pRItem.findMany.mockResolvedValue([]);
      mockPrismaService.gRItem.findMany.mockResolvedValue([]);
      mockPrismaService.stock.findFirst.mockResolvedValue(null);
      const result = await service.predictDemand(
        "item1",
        "branch1",
        "monthly",
        3
      );

      expect(result).toEqual({
        itemId: "item1",
        branchId: "branch1",
        period: "monthly",
        predictedDemand: 0,
        confidence: expect.any(Number),
        trend: expect.any(String),
        seasonalityFactor: expect.any(Number),
        riskFactors: expect.any(Array),
        recommendations: expect.any(Array),
      });
    });
    it("should handle Gemini service errors", async () => {
      const mockPRHistory = [
        {
          itemId: "item1",
          quantity: new Decimal(100),
          estimatedPrice: new Decimal(10.0),
          purchaseRequest: {
            createdAt: new Date("2024-01-01"),
            status: "COMPLETED",
          },
        },
      ];

      mockPrismaService.pRItem.findMany.mockResolvedValue(mockPRHistory);
      mockPrismaService.gRItem.findMany.mockResolvedValue([]);
      mockPrismaService.stock.findFirst.mockResolvedValue(null);
      mockGeminiService.generateText.mockRejectedValue(new Error("API Error"));
      const result = await service.predictDemand(
        "item1",
        "branch1",
        "monthly",
        3
      );

      expect(result.itemId).toBe("item1");
      expect(result.branchId).toBe("branch1");
      expect(result.period).toBe("monthly");
      expect(result.predictedDemand).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.trend).toBeDefined();
      expect(result.seasonalityFactor).toBeDefined();
      expect(result.riskFactors).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });
  });
  describe("generateAutomaticPR", () => {
    it("should generate automatic PR recommendations", async () => {
      const mockStocks = [
        {
          itemId: "item1",
          quantity: new Decimal(5), // Low stock (below threshold of 10)
          averageCost: new Decimal(10.0),
          item: { name: "Test Item 1", category: "Electronics" },
        },
        {
          itemId: "item2",
          quantity: new Decimal(8), // Low stock
          averageCost: new Decimal(25.0),
          item: { name: "Test Item 2", category: "Hardware" },
        },
      ]; // Mock the predictDemand calls that will be made by generateAutomaticPR
      const mockForecast = {
        itemId: "item1",
        branchId: "branch1",
        period: "monthly",
        predictedDemand: 25,
        confidence: 0.8,
        trend: "increasing" as const,
        seasonalityFactor: 1.0,
        riskFactors: [],
        recommendations: [],
      };

      mockPrismaService.stock.findMany.mockResolvedValue(mockStocks);

      // Mock predictDemand to return a forecast with good confidence
      jest.spyOn(service, "predictDemand").mockResolvedValue(mockForecast);

      const result = await service.generateAutomaticPR("branch1");

      expect(result.recommendations).toHaveLength(2); // Should have recommendations for both low stock items
      expect(result.recommendations[0].itemId).toBe("item1");
      expect(result.recommendations[0].urgency).toBe("high"); // quantity <= 5
      expect(result.recommendations[1].itemId).toBe("item2");
      expect(result.recommendations[1].urgency).toBe("medium"); // quantity > 5 but <= 10
      expect(result.totalEstimatedCost).toBeGreaterThan(0);
      expect(result.priorityOrder).toBeDefined();
    });
    it("should handle no items requiring reorder", async () => {
      const mockStocks = [
        {
          itemId: "item1",
          quantity: new Decimal(50), // High stock (above threshold)
          averageCost: new Decimal(15.0),
          item: { name: "Test Item 1", category: "Electronics" },
        },
      ];

      mockPrismaService.stock.findMany.mockResolvedValue(mockStocks);
      const result = await service.generateAutomaticPR("branch1");

      expect(result.recommendations).toHaveLength(0);
      expect(result.totalEstimatedCost).toBe(0);
    });
  });
  describe("analyzeTrends", () => {
    it("should analyze consumption trends", async () => {
      const mockGRHistory = [
        {
          itemId: "item1",
          quantityReceived: 100,
          goodsReceipt: {
            createdAt: new Date("2024-01-01"),
            status: "RECEIVED",
          },
        },
        {
          itemId: "item1",
          quantityReceived: 120,
          goodsReceipt: {
            createdAt: new Date("2024-01-15"),
            status: "RECEIVED",
          },
        },
        {
          itemId: "item2",
          quantityReceived: 80,
          goodsReceipt: {
            createdAt: new Date("2024-01-01"),
            status: "RECEIVED",
          },
        },
      ];

      mockPrismaService.gRItem.findMany.mockResolvedValue(mockGRHistory);
      mockGeminiService.generateText.mockResolvedValue(
        JSON.stringify({
          overallTrend: "increasing",
          topGrowingItems: [{ itemId: "item1", growthRate: 20 }],
          seasonalPatterns: [{ month: "January", pattern: "high" }],
          insights: ["Demand increasing for electronic items"],
        })
      );
      const result = await service.analyzeTrends(30);

      expect(result.overallTrend).toBeDefined();
      expect(result.topGrowingItems).toBeDefined();
      expect(result.insights).toBeDefined();
    });

    it("should handle insufficient data for trend analysis", async () => {
      mockPrismaService.gRItem.findMany.mockResolvedValue([]);

      const result = await service.analyzeTrends(30);

      expect(result.overallTrend).toBe("insufficient_data");
      expect(result.topGrowingItems).toHaveLength(0);
    });
  });
});
