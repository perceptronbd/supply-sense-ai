import { Test, type TestingModule } from '@nestjs/testing';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../../app/prisma.service';
import { GeminiService } from './gemini.service';
import { PurchaseOptimizationService } from './purchase-optimization.service';

describe('PurchaseOptimizationService', () => {
  let service: PurchaseOptimizationService;
  let _prismaService: PrismaService;
  let _geminiService: GeminiService;
  const mockPrismaService = {
    supplier: {
      findMany: jest.fn(),
    },
    goodsReceipt: {
      findMany: jest.fn(),
    },
    purchaseOrder: {
      findMany: jest.fn(),
    },
    stock: {
      findUnique: jest.fn(),
    },
    pRItem: {
      findMany: jest.fn(),
    },
    item: {
      findMany: jest.fn(),
    },
    gRItem: {
      findMany: jest.fn(),
    },
  };
  const mockGeminiService = {
    generateText: jest.fn(),
    isAvailable: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseOptimizationService,
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

    service = module.get<PurchaseOptimizationService>(PurchaseOptimizationService);
    _prismaService = module.get<PrismaService>(PrismaService);
    _geminiService = module.get<GeminiService>(GeminiService);

    // Set default mock return values to prevent undefined errors
    mockPrismaService.supplier.findMany.mockResolvedValue([]);
    mockPrismaService.goodsReceipt.findMany.mockResolvedValue([]);
    mockPrismaService.purchaseOrder.findMany.mockResolvedValue([]);
    mockPrismaService.stock.findUnique.mockResolvedValue(null);
    mockPrismaService.pRItem.findMany.mockResolvedValue([]);
    mockPrismaService.item.findMany.mockResolvedValue([]);
    mockPrismaService.gRItem.findMany.mockResolvedValue([]);
    mockGeminiService.generateText.mockResolvedValue('{"analysis": "test"}');
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('recommendOptimalSupplier', () => {
    it('should recommend optimal supplier based on multiple criteria', async () => {
      // Mock proper supplier data structure with nested relations
      const mockSupplierData = [
        {
          id: 'supplier1',
          name: 'Supplier A',
          rating: 4.5,
          purchaseOrders: [
            {
              id: 'po1',
              status: 'CONFIRMED',
              createdAt: new Date('2024-01-01'),
              deliveryDate: new Date('2024-01-05'),
              totalAmount: new Decimal(1000),
              items: [
                {
                  itemId: 'item1',
                  quantity: 100,
                  unitPrice: new Decimal(10),
                  item: { name: 'Test Item' },
                },
              ],
              goodsReceipts: [
                {
                  id: 'gr1',
                  status: 'POSTED',
                  receiptDate: new Date('2024-01-04'),
                  items: [
                    {
                      itemId: 'item1',
                      quantityReceived: 100,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];

      mockPrismaService.supplier.findMany.mockResolvedValue(mockSupplierData);
      mockGeminiService.generateText.mockResolvedValue(
        JSON.stringify({
          score: 92,
          recommendations: ['Fast delivery', 'High quality'],
          reasoning: 'Highly recommended for urgent orders',
        })
      );

      const result = await service.recommendOptimalSupplier(['item1']);

      expect(result).toHaveLength(1);
      expect(result[0].score).toBeDefined();
      expect(result[0].recommendations).toBeDefined();
    });

    it('should handle no suppliers available', async () => {
      mockPrismaService.supplier.findMany.mockResolvedValue([]);
      mockPrismaService.goodsReceipt.findMany.mockResolvedValue([]);

      const result = await service.recommendOptimalSupplier(['item1']);

      expect(result).toHaveLength(0);
    });
  });
  describe('optimizeOrderQuantities', () => {
    it('should optimize order quantities for PO items', async () => {
      const mockPOItems = [
        {
          itemId: 'item1',
          item: { name: 'Test Item 1' },
          estimatedPrice: new Decimal('100.00'),
          quantity: 10,
        },
      ];

      mockGeminiService.generateText.mockResolvedValue(
        JSON.stringify({
          optimalQuantity: 15,
          savings: 12.5,
          reasoning: 'Bulk discount threshold reached',
        })
      );
      const result = await service.optimizeOrderQuantities(mockPOItems);

      expect(result).toHaveLength(1);
      expect(result[0].optimizedOrderQty).toBeDefined();
      expect(result[0].potentialSavings).toBeDefined();
    });

    it('should handle empty PO items array', async () => {
      const result = await service.optimizeOrderQuantities([]);
      expect(result).toHaveLength(0);
    });
  });
  describe('optimizeOrder', () => {
    it('should optimize order for given items and branch', async () => {
      const mockPRItems = [
        {
          id: 'pr-item-1',
          itemId: 'item1',
          estimatedPrice: new Decimal('100.00'),
          quantity: 10,
          purchaseRequest: {
            id: 'pr-1',
            title: 'Test PR',
            status: 'APPROVED',
            branchId: 'branch1',
          },
          item: { name: 'Test Item 1' },
        },
      ];
      mockPrismaService.pRItem.findMany.mockResolvedValue(mockPRItems);

      mockGeminiService.generateText.mockResolvedValue(
        JSON.stringify({
          optimalQuantity: 15,
          savings: 12.5,
          reasoning: 'Bulk discount available',
        })
      );
      const result = await service.optimizeOrder(['item1'], 'branch1');

      expect(result.optimizations).toBeDefined();
      expect(result.totalSavings).toBeGreaterThanOrEqual(0);
      expect(result.budgetCompliant).toBeDefined();
    });
  });
});
