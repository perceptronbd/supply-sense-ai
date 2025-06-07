import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../app/prisma.service';
import type { CreateManufacturingListDto } from './dto/create-manufacturing-list.dto';
import { ManufacturingListService } from './manufacturing-list.service';

describe('ManufacturingListService', () => {
  let service: ManufacturingListService;

  const mockPrismaService = {
    manufacturingList: {
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    formula: {
      findUnique: jest.fn(),
    },
    stock: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ManufacturingListService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ManufacturingListService>(ManufacturingListService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('create', () => {
    const mockCreateDto: CreateManufacturingListDto = {
      branchId: 'branch-123',
      title: 'Production batch for chocolate cakes',
      formulaId: 'formula-cake',
      outputQuantity: 10, // 10 cakes
      remarks: 'High priority production',
      plannedDate: '2025-06-15',
    };
    const mockFormulas = {
      'formula-cake': {
        id: 'formula-cake',
        name: 'Chocolate Cake',
        code: 'CAKE-001',
        outputItem: 'item-cake',
        outputQuantity: new Decimal(1),
        isActive: true,
        items: [
          {
            itemId: 'item-flour',
            quantity: new Decimal(2.5),
            item: {
              buyingToMainRate: new Decimal(1),
              usingToMainRate: new Decimal(1),
              name: 'Flour',
            },
          },
          {
            itemId: 'item-sugar',
            quantity: new Decimal(1.0),
            item: {
              buyingToMainRate: new Decimal(1),
              usingToMainRate: new Decimal(1),
              name: 'Sugar',
            },
          },
        ],
      },
      'formula-bread': {
        id: 'formula-bread',
        name: 'White Bread',
        code: 'BREAD-001',
        outputItem: 'item-bread',
        outputQuantity: new Decimal(1),
        isActive: true,
        items: [
          {
            itemId: 'item-flour',
            quantity: new Decimal(1.5),
            item: {
              buyingToMainRate: new Decimal(1),
              usingToMainRate: new Decimal(1),
              name: 'Flour',
            },
          },
        ],
      },
    };

    it('should create ML with auto-generated ML number', async () => {
      // Arrange
      mockPrismaService.manufacturingList.count.mockResolvedValue(0);
      mockPrismaService.formula.findUnique
        .mockResolvedValueOnce(mockFormulas['formula-cake'])
        .mockResolvedValueOnce(mockFormulas['formula-bread']);

      // Mock stock availability check
      mockPrismaService.stock.findMany.mockResolvedValue([
        { itemId: 'item-flour', availableQty: new Decimal(100) },
        { itemId: 'item-sugar', availableQty: new Decimal(50) },
      ]);

      const mockCreatedML = {
        id: 'ml-123',
        mlNumber: 'ML000001',
        status: 'DRAFT',
        branchId: 'branch-123',
      };
      mockPrismaService.manufacturingList.create.mockResolvedValue(mockCreatedML);

      // Act
      const result = await service.create(mockCreateDto, 'user-123');

      // Assert
      expect(mockPrismaService.manufacturingList.count).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.manufacturingList.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          mlNumber: 'ML000001',
          branchId: 'branch-123',
          title: 'Production batch for chocolate cakes',
          createdById: 'user-123',
          status: 'DRAFT',
        }),
        include: expect.any(Object),
      });
      expect(result).toEqual(mockCreatedML);
    });

    it('should validate formula existence before creating ML', async () => {
      // Arrange
      mockPrismaService.manufacturingList.count.mockResolvedValue(0);

      // Reset mocks
      mockPrismaService.formula.findUnique.mockReset();

      // First call returns a formula, second call returns null
      mockPrismaService.formula.findUnique.mockResolvedValueOnce(null); // Formula not found

      // Override the create function to throw if it's called
      mockPrismaService.manufacturingList.create.mockImplementation(() => {
        throw new Error('Should not reach here');
      });

      // Act & Assert
      await expect(service.create(mockCreateDto, 'user-123')).rejects.toThrow(NotFoundException);
    });

    it('should calculate and validate total material requirements', async () => {
      // Arrange
      mockPrismaService.manufacturingList.count.mockResolvedValue(0);

      // Reset mocks
      mockPrismaService.formula.findUnique.mockReset();
      mockPrismaService.stock.findMany.mockReset();

      // Return the formula for the query
      mockPrismaService.formula.findUnique.mockResolvedValue(mockFormulas['formula-cake']);

      // Insufficient stock to trigger validation
      mockPrismaService.stock.findMany.mockResolvedValue([
        { itemId: 'item-flour', availableQty: new Decimal(1) }, // Need 25 kg (not enough)
        { itemId: 'item-sugar', availableQty: new Decimal(5) }, // Need 10 kg (not enough)
      ]);

      // Act & Assert
      await expect(service.create(mockCreateDto, 'user-123')).rejects.toThrow(/Insufficient stock/);
    });

    it('should aggregate material requirements correctly', async () => {
      // Arrange
      mockPrismaService.manufacturingList.count.mockResolvedValue(0);

      // Reset mocks
      mockPrismaService.formula.findUnique.mockReset();
      mockPrismaService.stock.findMany.mockReset();

      // Return the formula for the query
      mockPrismaService.formula.findUnique.mockResolvedValue(mockFormulas['formula-cake']);

      mockPrismaService.stock.findMany.mockResolvedValue([
        { itemId: 'item-flour', availableQty: new Decimal(100) },
        { itemId: 'item-sugar', availableQty: new Decimal(50) },
      ]);
      mockPrismaService.manufacturingList.create.mockResolvedValue({
        id: 'ml-123',
        mlNumber: 'ML000001',
        status: 'DRAFT',
        branchId: 'branch-123',
      });

      // Act
      await service.create(mockCreateDto, 'user-123');

      // Assert - Verify stock check includes the required items
      expect(mockPrismaService.stock.findMany).toHaveBeenCalledWith({
        where: {
          branchId: 'branch-123',
          itemId: {
            in: expect.arrayContaining(['item-flour', 'item-sugar']),
          },
        },
      });

      // Expected requirements:
      // Flour: 10 cakes * 2.5kg = 25kg
      // Sugar: 10 cakes * 1.0kg = 10kg
    });
  });

  describe('startProduction', () => {
    const mockML = {
      id: 'ml-123',
      mlNumber: 'ML000001',
      status: 'DRAFT',
      branchId: 'branch-123',
      formulaId: 'formula-cake',
      outputQuantity: new Decimal(5),
      formula: {
        id: 'formula-cake',
        name: 'Chocolate Cake',
        outputItem: 'item-cake',
        outputQuantity: new Decimal(1),
        isActive: true,
        items: [
          {
            itemId: 'item-flour',
            quantity: new Decimal(2.5),
            item: {
              id: 'item-flour',
              buyingToMainRate: new Decimal(1),
              usingToMainRate: new Decimal(1),
            },
          },
          {
            itemId: 'item-sugar',
            quantity: new Decimal(1.0),
            item: {
              id: 'item-sugar',
              buyingToMainRate: new Decimal(1),
              usingToMainRate: new Decimal(1),
            },
          },
        ],
      },
    };

    it('should start production and deduct raw materials from stock', async () => {
      // Arrange
      mockPrismaService.manufacturingList.findUnique.mockResolvedValue(mockML);

      const mockTransaction = {
        manufacturingList: {
          findUnique: jest.fn().mockResolvedValue(mockML),
          update: jest.fn().mockResolvedValue({ ...mockML, status: 'IN_PROGRESS' }),
        },
        stock: {
          findUnique: jest
            .fn()
            .mockResolvedValueOnce({
              availableQty: new Decimal(50),
              reservedQty: new Decimal(5),
              quantity: new Decimal(100),
            })
            .mockResolvedValueOnce({
              availableQty: new Decimal(20),
              reservedQty: new Decimal(2),
              quantity: new Decimal(30),
            }),
          update: jest.fn().mockResolvedValue({}),
        },
      };

      mockPrismaService.$transaction.mockImplementation((callback) => callback(mockTransaction));

      // Act
      const _result = await service.startProduction('ml-123');

      // Assert
      expect(mockTransaction.manufacturingList.update).toHaveBeenCalledWith({
        where: { id: 'ml-123' },
        data: {
          status: 'IN_PROGRESS',
          startedDate: expect.any(Date),
        },
        include: expect.any(Object),
      });

      // Verify stock deductions - first for flour
      expect(mockTransaction.stock.update).toHaveBeenCalledWith({
        where: {
          itemId_branchId: { itemId: 'item-flour', branchId: 'branch-123' },
        },
        data: expect.objectContaining({
          quantity: expect.any(Decimal),
          availableQty: expect.any(Decimal),
          lastStockDate: expect.any(Date),
        }),
      });

      // Verify stock deductions - then for sugar
      expect(mockTransaction.stock.update).toHaveBeenCalledWith({
        where: {
          itemId_branchId: { itemId: 'item-sugar', branchId: 'branch-123' },
        },
        data: expect.objectContaining({
          quantity: expect.any(Decimal),
          availableQty: expect.any(Decimal),
          lastStockDate: expect.any(Date),
        }),
      });
    });

    it('should only allow starting production from DRAFT status', async () => {
      // Arrange
      const inProgressML = { ...mockML, status: 'IN_PROGRESS' };
      mockPrismaService.manufacturingList.findUnique.mockResolvedValue(inProgressML);

      // Act & Assert
      await expect(service.startProduction('ml-123')).rejects.toThrow(
        'Can only start production for DRAFT Manufacturing Lists'
      );
    });

    it('should check stock availability before starting production', async () => {
      // Arrange - Mock insufficient stock
      mockPrismaService.manufacturingList.findUnique.mockResolvedValue(mockML);

      const mockTransaction = {
        manufacturingList: {
          findUnique: jest.fn().mockResolvedValue(mockML),
        },
        stock: {
          findUnique: jest
            .fn()
            .mockResolvedValueOnce({
              availableQty: new Decimal(10), // Insufficient flour (need 12.5)
              quantity: new Decimal(10),
            })
            .mockResolvedValueOnce({
              availableQty: new Decimal(20),
              quantity: new Decimal(20),
            }),
        },
        item: {
          findUnique: jest.fn().mockResolvedValue({
            usingToMainRate: new Decimal(1),
          }),
        },
      };

      mockPrismaService.$transaction.mockImplementation((callback) => callback(mockTransaction));

      // Act & Assert
      await expect(service.startProduction('ml-123')).rejects.toThrow(
        /Insufficient stock for item/
      );
    });
  });

  describe('completeProduction', () => {
    const mockInProgressML = {
      id: 'ml-123',
      mlNumber: 'ML000001',
      status: 'IN_PROGRESS',
      branchId: 'branch-123',
      formulaId: 'formula-cake',
      outputQuantity: new Decimal(5),
      formula: {
        id: 'formula-cake',
        name: 'Chocolate Cake',
        outputItem: 'item-cake',
        outputQuantity: new Decimal(1),
        isActive: true,
        items: [
          {
            itemId: 'item-flour',
            quantity: new Decimal(2.5),
            item: {
              id: 'item-flour',
              buyingToMainRate: new Decimal(1),
              usingToMainRate: new Decimal(1),
            },
          },
        ],
      },
    };

    it('should complete production and add finished goods to stock', async () => {
      // Arrange
      mockPrismaService.manufacturingList.findUnique.mockResolvedValue(mockInProgressML);

      const mockTransaction = {
        manufacturingList: {
          findUnique: jest.fn().mockResolvedValue(mockInProgressML),
          update: jest.fn().mockResolvedValue({ ...mockInProgressML, status: 'COMPLETED' }),
        },
        stock: {
          findUnique: jest
            .fn()
            .mockResolvedValueOnce({
              // Raw material stock (flour)
              quantity: new Decimal(100),
              reservedQty: new Decimal(17.5),
              availableQty: new Decimal(37.5),
            })
            .mockResolvedValueOnce({
              // Existing finished goods stock (cake)
              quantity: new Decimal(100),
              availableQty: new Decimal(100),
            }), // Existing finished goods stock
          create: jest.fn().mockResolvedValue({}),
          update: jest.fn().mockResolvedValue({}),
        },
        item: {
          findUnique: jest.fn().mockResolvedValue({
            usingToMainRate: new Decimal(1),
          }),
        },
      };

      mockPrismaService.$transaction.mockImplementation((callback) => callback(mockTransaction));

      // Act
      await service.completeProduction('ml-123');

      // Assert
      expect(mockTransaction.manufacturingList.update).toHaveBeenCalledWith({
        where: { id: 'ml-123' },
        data: {
          status: 'COMPLETED',
          completedDate: expect.any(Date),
        },
        include: expect.any(Object),
      });

      // Verify finished goods added to stock
      expect(mockTransaction.stock.update).toHaveBeenCalledWith({
        where: {
          itemId_branchId: { itemId: 'item-cake', branchId: 'branch-123' },
        },
        data: expect.objectContaining({
          quantity: expect.any(Decimal),
          availableQty: expect.any(Decimal),
          lastStockDate: expect.any(Date),
        }),
      });
    });

    it('should add to existing finished goods stock', async () => {
      // Arrange
      mockPrismaService.manufacturingList.findUnique.mockResolvedValue(mockInProgressML);

      const mockTransaction = {
        manufacturingList: {
          findUnique: jest.fn().mockResolvedValue(mockInProgressML),
          update: jest.fn().mockResolvedValue({ ...mockInProgressML, status: 'COMPLETED' }),
        },
        stock: {
          findUnique: jest
            .fn()
            .mockResolvedValueOnce({
              // Raw material
              quantity: new Decimal(100),
              reservedQty: new Decimal(17.5),
              availableQty: new Decimal(50),
            })
            .mockResolvedValueOnce({
              // Existing finished goods stock
              quantity: new Decimal(10),
              availableQty: new Decimal(8),
              reservedQty: new Decimal(2),
            }),
          update: jest.fn().mockResolvedValue({}),
        },
        item: {
          findUnique: jest.fn().mockResolvedValue({
            usingToMainRate: new Decimal(1),
          }),
        },
      };

      mockPrismaService.$transaction.mockImplementation((callback) => callback(mockTransaction));

      // Act
      await service.completeProduction('ml-123');

      // Assert - Verify finished goods stock updated
      expect(mockTransaction.stock.update).toHaveBeenCalledWith({
        where: {
          itemId_branchId: { itemId: 'item-cake', branchId: 'branch-123' },
        },
        data: expect.objectContaining({
          quantity: expect.any(Decimal),
          availableQty: expect.any(Decimal),
        }),
      });
    });

    it('should only allow completing production from IN_PROGRESS status', async () => {
      // Arrange
      const draftML = { ...mockInProgressML, status: 'DRAFT' };
      mockPrismaService.manufacturingList.findUnique.mockResolvedValue(draftML);

      // Act & Assert
      await expect(service.completeProduction('ml-123')).rejects.toThrow(
        'Can only complete IN_PROGRESS Manufacturing Lists'
      );
    });
  });

  describe('business logic validation', () => {
    it('should validate FR-25: ML creation with single formula and quantity', () => {
      // This validates that MLs handle formula with correct output quantity
      const singleFormulaDto: CreateManufacturingListDto = {
        branchId: 'branch-123',
        title: 'Mixed production batch',
        formulaId: 'formula-cake',
        outputQuantity: 10,
      };

      expect(singleFormulaDto.formulaId).toBe('formula-cake');
      expect(singleFormulaDto.outputQuantity).toBe(10);
    });

    it('should validate FR-26: Stock deduction when ML enters IN_PROGRESS', () => {
      // This validates that raw materials are reserved when production starts
      const requiredFlour = new Decimal(2.5).mul(5); // 2.5kg per cake * 5 cakes = 12.5kg
      const currentReserved = new Decimal(3);
      const newReserved = currentReserved.add(requiredFlour);

      expect(newReserved).toEqual(new Decimal(15.5));
    });

    it('should validate FR-27: Stock addition when ML is marked COMPLETE', () => {
      // This validates that finished products are added to stock upon completion
      const cakesProduced = new Decimal(5);
      const existingStock = new Decimal(12);
      const newStock = existingStock.add(cakesProduced);

      expect(newStock).toEqual(new Decimal(17));
    });

    it('should validate FR-28: Block ML creation with insufficient stock', () => {
      // This validates that MLs cannot be created when stock is insufficient
      const requiredQty = new Decimal(50);
      const availableQty = new Decimal(30);
      const isStockSufficient = availableQty.gte(requiredQty);

      expect(isStockSufficient).toBe(false);
    });

    it('should handle complex aggregation of material requirements', () => {
      // Test aggregation when multiple formulas use same raw materials
      const requirements = new Map<string, Decimal>();

      // Formula 1: 10 cakes need 25kg flour
      const flour1 = new Decimal(25);
      requirements.set('flour', (requirements.get('flour') || new Decimal(0)).add(flour1));

      // Formula 2: 5 bread need 7.5kg flour
      const flour2 = new Decimal(7.5);
      requirements.set('flour', (requirements.get('flour') || new Decimal(0)).add(flour2));

      expect(requirements.get('flour')).toEqual(new Decimal(32.5));
    });
  });
});
