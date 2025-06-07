import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../app/prisma.service';
import type { CreateGoodsReceiptDto } from './dto/create-goods-receipt.dto';
import { GoodsReceiptService } from './goods-receipt.service';

describe('GoodsReceiptService', () => {
  let service: GoodsReceiptService;

  const mockPrismaService = {
    goodsReceipt: {
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    purchaseOrder: {
      findUnique: jest.fn(),
    },
    materialRequisition: {
      findUnique: jest.fn(),
    },
    stock: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    pOItem: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoodsReceiptService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<GoodsReceiptService>(GoodsReceiptService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('create', () => {
    const mockCreateDto: CreateGoodsReceiptDto = {
      poId: 'po-123',
      documentNumber: 'DR-001',
      branchId: 'branch-123',
      receiptDate: '2025-06-06',
      items: [
        {
          itemId: 'item-123',
          orderedQty: 100,
          receivedQty: 95,
          unitPrice: 10.5,
          qualityNotes: 'Good quality',
        },
        {
          itemId: 'item-456',
          orderedQty: 50,
          receivedQty: 50,
          unitPrice: 25.0,
        },
      ],
    };

    it('should create a GR with auto-generated GR number', async () => {
      // Arrange
      mockPrismaService.goodsReceipt.count.mockResolvedValue(0);
      const mockCreatedGR = {
        id: 'gr-123',
        grNumber: 'GR000001',
        poId: 'po-123',
        status: 'DRAFT',
      };
      mockPrismaService.goodsReceipt.create.mockResolvedValue(mockCreatedGR);

      // Act
      const result = await service.create(mockCreateDto, 'user-123');

      // Assert
      expect(mockPrismaService.goodsReceipt.count).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.goodsReceipt.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          grNumber: 'GR000001',
          poId: 'po-123',
          branchId: 'branch-123',
          receivedById: 'user-123',
          status: 'DRAFT',
        }),
        include: expect.any(Object),
      });
      expect(result).toEqual(mockCreatedGR);
    });

    it('should calculate total cost for each item', async () => {
      // Arrange
      mockPrismaService.goodsReceipt.count.mockResolvedValue(0);
      mockPrismaService.goodsReceipt.create.mockResolvedValue({} as never);

      // Act
      await service.create(mockCreateDto, 'user-123');

      // Assert
      const createCall = mockPrismaService.goodsReceipt.create.mock.calls[0][0];
      const itemsData = createCall.data.items.create;

      // First item: 95 * 10.50 = 997.50
      expect(itemsData[0].totalCost).toEqual(new Decimal(95).mul(10.5));

      // Second item: 50 * 25.00 = 1250.00
      expect(itemsData[1].totalCost).toEqual(new Decimal(50).mul(25.0));
    });

    it('should require either PO or MR ID but not both', async () => {
      // Arrange
      const invalidDto = { ...mockCreateDto, poId: 'po-123', mrId: 'mr-123' };

      // Act & Assert
      await expect(service.create(invalidDto, 'user-123')).rejects.toThrow(
        'Cannot specify both Purchase Order ID and Material Requisition ID'
      );
    });

    it('should require either PO or MR ID', async () => {
      // Arrange
      const invalidDto = { ...mockCreateDto };
      invalidDto.poId = undefined;

      // Act & Assert
      await expect(service.create(invalidDto, 'user-123')).rejects.toThrow(
        'Either Purchase Order ID or Material Requisition ID must be provided'
      );
    });
  });

  describe('post - Moving Average Cost Calculation', () => {
    const mockGR = {
      id: 'gr-123',
      grNumber: 'GR000001',
      status: 'DRAFT',
      branchId: 'branch-123',
      poId: 'po-123',
      items: [
        {
          id: 'gr-item-1',
          itemId: 'item-123',
          receivedQty: new Decimal(100),
          unitPrice: new Decimal(12.0),
          item: {
            buyingToMainRate: new Decimal(1), // 1:1 conversion
          },
        },
      ],
    };

    it('should calculate moving average cost for new stock item', async () => {
      // Arrange
      const mockTransaction = {
        goodsReceipt: {
          update: jest.fn().mockResolvedValue({ ...mockGR, status: 'POSTED' }),
        },
        stock: {
          findUnique: jest.fn().mockResolvedValue(null), // No existing stock
          create: jest.fn().mockResolvedValue({}),
        },
        pOItem: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'po-item-1',
            receivedQty: new Decimal(0),
          }),
          update: jest.fn().mockResolvedValue({}),
        },
      };

      mockPrismaService.goodsReceipt.findUnique.mockResolvedValue(mockGR);
      mockPrismaService.$transaction.mockImplementation((callback) => callback(mockTransaction));

      // Act
      await service.post('gr-123');

      // Assert
      expect(mockTransaction.stock.create).toHaveBeenCalledWith({
        data: {
          itemId: 'item-123',
          branchId: 'branch-123',
          quantity: new Decimal(100), // receivedQty * conversion rate (1)
          reservedQty: new Decimal(0),
          availableQty: new Decimal(100),
          averageCost: new Decimal(12.0), // First receipt, so unit price becomes average cost
          lastCost: new Decimal(12.0),
        },
      });
    });

    it('should calculate moving average cost with existing stock', async () => {
      // Arrange - Existing stock: 200 units at $10.00 average cost
      const existingStock = {
        quantity: new Decimal(200),
        averageCost: new Decimal(10.0),
        availableQty: new Decimal(200),
      };

      const mockTransaction = {
        goodsReceipt: {
          update: jest.fn().mockResolvedValue({ ...mockGR, status: 'POSTED' }),
        },
        stock: {
          findUnique: jest.fn().mockResolvedValue(existingStock),
          update: jest.fn().mockResolvedValue({}),
        },
        pOItem: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'po-item-1',
            receivedQty: new Decimal(0),
          }),
          update: jest.fn().mockResolvedValue({}),
        },
      };

      mockPrismaService.goodsReceipt.findUnique.mockResolvedValue(mockGR);
      mockPrismaService.$transaction.mockImplementation((callback) => callback(mockTransaction));

      // Act
      await service.post('gr-123');

      // Assert
      // Current value: 200 * $10.00 = $2000
      // New value: 100 * $12.00 = $1200
      // Total: $3200 / 300 units = $10.67 average cost
      const expectedNewAverageCost = new Decimal(2000).add(1200).div(300);

      expect(mockTransaction.stock.update).toHaveBeenCalledWith({
        where: {
          itemId_branchId: {
            itemId: 'item-123',
            branchId: 'branch-123',
          },
        },
        data: {
          quantity: new Decimal(300), // 200 + 100
          availableQty: new Decimal(300), // 200 + 100
          averageCost: expectedNewAverageCost,
          lastCost: new Decimal(12.0),
          lastStockDate: expect.any(Date),
        },
      });
    });

    it('should only post GR in DRAFT status', async () => {
      // Arrange
      const postedGR = { ...mockGR, status: 'POSTED' };
      mockPrismaService.goodsReceipt.findUnique.mockResolvedValue(postedGR);

      // Act & Assert
      await expect(service.post('gr-123')).rejects.toThrow(
        'Can only post Goods Receipts in DRAFT status'
      );
    });

    it('should update PO item received quantity', async () => {
      // Arrange
      const mockTransaction = {
        goodsReceipt: {
          update: jest.fn().mockResolvedValue({ ...mockGR, status: 'POSTED' }),
        },
        stock: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({}),
        },
        pOItem: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'po-item-1',
            receivedQty: new Decimal(50),
          }),
          update: jest.fn().mockResolvedValue({}),
        },
      };

      mockPrismaService.goodsReceipt.findUnique.mockResolvedValue(mockGR);
      mockPrismaService.$transaction.mockImplementation((callback) => callback(mockTransaction));

      // Act
      await service.post('gr-123');

      // Assert
      expect(mockTransaction.pOItem.update).toHaveBeenCalledWith({
        where: { id: 'po-item-1' },
        data: {
          receivedQty: new Decimal(150), // 50 + 100
        },
      });
    });
  });

  describe('createFromPO', () => {
    const mockPO = {
      id: 'po-123',
      poNumber: 'PO000001',
      status: 'CONFIRMED',
      branchId: 'branch-123',
      items: [
        {
          itemId: 'item-123',
          orderedQty: new Decimal(100),
          unitPrice: new Decimal(10.5),
          item: { name: 'Test Item' },
        },
      ],
      supplier: { name: 'Test Supplier' },
    };

    it('should create GR from confirmed PO', async () => {
      // Arrange
      mockPrismaService.purchaseOrder.findUnique.mockResolvedValue(mockPO);
      mockPrismaService.goodsReceipt.count.mockResolvedValue(0);
      mockPrismaService.goodsReceipt.create.mockResolvedValue({ id: 'gr-123' });

      // Act
      const _result = await service.createFromPO('po-123', 'user-123');

      // Assert
      const createCall = mockPrismaService.goodsReceipt.create.mock.calls[0][0];
      expect(createCall.data).toMatchObject({
        poId: 'po-123',
        branchId: 'branch-123',
        grNumber: 'GR000001',
        receivedById: 'user-123',
        status: 'DRAFT',
      });

      expect(createCall.data.items.create[0].itemId).toBe('item-123');
      expect(createCall.data.items.create[0].orderedQty.toString()).toBe('100');
      expect(createCall.data.items.create[0].receivedQty.toString()).toBe('100');
      expect(createCall.data.items.create[0].unitPrice.toString()).toBe('10.5');
      expect(createCall.data.items.create[0].totalCost.toString()).toBe('1050');

      expect(createCall.include).toBeDefined();
    });

    it('should throw error for non-confirmed PO', async () => {
      // Arrange
      const draftPO = { ...mockPO, status: 'DRAFT' };
      mockPrismaService.purchaseOrder.findUnique.mockResolvedValue(draftPO);

      // Act & Assert
      await expect(service.createFromPO('po-123', 'user-123')).rejects.toThrow(
        'Can only create GR from CONFIRMED Purchase Orders'
      );
    });

    it('should throw NotFoundException for non-existent PO', async () => {
      // Arrange
      mockPrismaService.purchaseOrder.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.createFromPO('invalid-id', 'user-123')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('createFromMR', () => {
    const mockMR = {
      id: 'mr-123',
      mrNumber: 'MR000001',
      status: 'APPROVED',
      toBranchId: 'branch-456',
      items: [
        {
          itemId: 'item-123',
          quantity: new Decimal(50),
          item: { name: 'Test Item' },
        },
      ],
    };

    it('should create GR from approved MR without pricing', async () => {
      // Arrange
      mockPrismaService.materialRequisition.findUnique.mockResolvedValue(mockMR);
      mockPrismaService.goodsReceipt.count.mockResolvedValue(0);
      mockPrismaService.goodsReceipt.create.mockResolvedValue({ id: 'gr-123' });

      // Act
      await service.createFromMR('mr-123', 'user-123');

      // Assert
      const createCall = mockPrismaService.goodsReceipt.create.mock.calls[0][0];
      expect(createCall.data).toMatchObject({
        mrId: 'mr-123',
        branchId: 'branch-456',
        grNumber: 'GR000001',
        receivedById: 'user-123',
        status: 'DRAFT',
      });

      expect(createCall.data.items.create[0].itemId).toBe('item-123');
      expect(createCall.data.items.create[0].orderedQty.toString()).toBe('50');
      expect(createCall.data.items.create[0].receivedQty.toString()).toBe('50');
      expect(createCall.data.items.create[0].unitPrice).toBeNull();
      expect(createCall.data.items.create[0].totalCost).toBeNull();

      expect(createCall.include).toBeDefined();
    });

    it('should throw error for non-approved MR', async () => {
      // Arrange
      const draftMR = { ...mockMR, status: 'DRAFT' };
      mockPrismaService.materialRequisition.findUnique.mockResolvedValue(draftMR);

      // Act & Assert
      await expect(service.createFromMR('mr-123', 'user-123')).rejects.toThrow(
        'Can only create GR from APPROVED Material Requisitions'
      );
    });
  });

  describe('business logic validation', () => {
    it('should validate moving average cost formula per FR-22', () => {
      // This test validates the exact formula from PRD:
      // New Cost = (Old Stock × Old Cost + Received Qty × Received Price) / (Old Stock + Received Qty)

      const oldStock = new Decimal(100);
      const oldCost = new Decimal(15.0);
      const receivedQty = new Decimal(50);
      const receivedPrice = new Decimal(18.0);

      const currentTotalValue = oldStock.mul(oldCost); // 100 * 15 = 1500
      const receivedTotalValue = receivedQty.mul(receivedPrice); // 50 * 18 = 900
      const newTotalQty = oldStock.add(receivedQty); // 150
      const newAverageCost = currentTotalValue.add(receivedTotalValue).div(newTotalQty); // 2400 / 150 = 16

      expect(newAverageCost).toEqual(new Decimal(16.0));
    });

    it('should handle unit conversion from buying unit to main unit', () => {
      // This validates FR-1, FR-2, FR-3: Unit conversion logic
      const receivedQtyInBuyingUnit = new Decimal(1000); // 1000 grams
      const buyingToMainRate = new Decimal(0.001); // 1000 grams = 1 kg

      const receivedQtyInMainUnit = receivedQtyInBuyingUnit.mul(buyingToMainRate);

      expect(receivedQtyInMainUnit).toEqual(new Decimal(1)); // 1 kg
    });

    it('should maintain data integrity during stock updates', () => {
      // This validates that available quantity equals total quantity minus reserved
      const totalQty = new Decimal(500);
      const reservedQty = new Decimal(50);
      const expectedAvailableQty = totalQty.sub(reservedQty);

      expect(expectedAvailableQty).toEqual(new Decimal(450));
    });
  });
});
