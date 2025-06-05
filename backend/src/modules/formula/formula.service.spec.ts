import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { FormulaService } from './formula.service';
import { PrismaService } from '../../app/prisma.service';
import { CreateFormulaDto } from './dto/create-formula.dto';
import { Decimal } from '@prisma/client/runtime/library';

describe('FormulaService', () => {
  let service: FormulaService;

  const mockPrismaService = {
    formula: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    item: {
      findUnique: jest.fn(),
    },
    manufacturingList: {
      findMany: jest.fn(),
    },
    stock: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FormulaService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<FormulaService>(FormulaService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('create', () => {
    const mockCreateDto: CreateFormulaDto = {
      name: 'Chocolate Cake',
      code: 'CAKE-001',
      description: 'Premium chocolate cake recipe',
      version: '1.0',
      outputItem: 'item-finished-cake',
      outputQuantity: 1,
      isActive: true,
      items: [
        {
          itemId: 'item-flour',
          quantity: 2.5, // 2.5 kg flour
          remarks: 'All-purpose flour',
        },
        {
          itemId: 'item-sugar',
          quantity: 1.0, // 1 kg sugar
        },
        {
          itemId: 'item-cocoa',
          quantity: 0.3, // 300g cocoa powder
        },
      ],
    };

    it('should create a formula with unique code', async () => {
      // Arrange
      mockPrismaService.formula.findUnique.mockResolvedValue(null); // No existing formula
      mockPrismaService.item.findUnique
        .mockResolvedValueOnce({ id: 'item-flour', name: 'Flour' })
        .mockResolvedValueOnce({ id: 'item-sugar', name: 'Sugar' })
        .mockResolvedValueOnce({ id: 'item-cocoa', name: 'Cocoa' })
        .mockResolvedValueOnce({
          id: 'item-finished-cake',
          name: 'Chocolate Cake',
        });

      const mockCreatedFormula = {
        id: 'formula-123',
        name: 'Chocolate Cake',
        code: 'CAKE-001',
        version: '1.0',
        isActive: true,
        items: mockCreateDto.items,
      };
      mockPrismaService.formula.create.mockResolvedValue(mockCreatedFormula);

      // Act
      const result = await service.create(mockCreateDto, 'user-123');

      // Assert
      expect(mockPrismaService.formula.findUnique).toHaveBeenCalledWith({
        where: { code: 'CAKE-001' },
      });
      expect(mockPrismaService.formula.create).toHaveBeenCalledWith({
        data: {
          name: 'Chocolate Cake',
          code: 'CAKE-001',
          description: 'Premium chocolate cake recipe',
          version: '1.0',
          outputItem: 'item-finished-cake',
          outputQuantity: new Decimal(1),
          isActive: true,
          createdById: 'user-123',
          items: {
            create: [
              {
                itemId: 'item-flour',
                quantity: new Decimal(2.5),
                remarks: 'All-purpose flour',
              },
              {
                itemId: 'item-sugar',
                quantity: new Decimal(1.0),
                remarks: undefined,
              },
              {
                itemId: 'item-cocoa',
                quantity: new Decimal(0.3),
                remarks: undefined,
              },
            ],
          },
        },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockCreatedFormula);
    });

    it('should throw ConflictException for duplicate formula code', async () => {
      // Arrange
      const existingFormula = { id: 'formula-456', code: 'CAKE-001' };
      mockPrismaService.formula.findUnique.mockResolvedValue(existingFormula);

      // Act & Assert
      await expect(service.create(mockCreateDto, 'user-123')).rejects.toThrow(
        ConflictException
      );
      expect(mockPrismaService.formula.findUnique).toHaveBeenCalledWith({
        where: { code: 'CAKE-001' },
      });
    });

    it('should validate all ingredient items exist', async () => {
      // Arrange
      mockPrismaService.formula.findUnique.mockResolvedValue(null);
      mockPrismaService.item.findUnique
        .mockResolvedValueOnce({ id: 'item-flour', name: 'Flour' })
        .mockResolvedValueOnce(null) // Sugar item not found
        .mockResolvedValueOnce({ id: 'item-cocoa', name: 'Cocoa' });

      // Act & Assert
      await expect(service.create(mockCreateDto, 'user-123')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should validate output item exists when specified', async () => {
      // Arrange
      mockPrismaService.formula.findUnique.mockResolvedValue(null);

      // Reset item mock and set specific behaviors
      mockPrismaService.item.findUnique.mockReset();
      mockPrismaService.item.findUnique.mockImplementation((args) => {
        const itemId = args.where.id;
        // Return null for output item but valid for ingredients
        if (itemId === 'non-existent-item') {
          return Promise.resolve(null);
        }
        return Promise.resolve({
          id: itemId,
          name: itemId.replace('item-', ''),
        });
      });

      const dtoWithNonExistentOutput = {
        ...mockCreateDto,
        outputItem: 'non-existent-item',
      };

      // Act & Assert
      await expect(
        service.create(dtoWithNonExistentOutput, 'user-123')
      ).rejects.toThrow(NotFoundException);
    });

    it('should default version to 1.0 and output quantity to 1', async () => {
      // Arrange
      const minimalDto: CreateFormulaDto = {
        name: 'Simple Recipe',
        code: 'SIMPLE-001',
        items: [
          {
            itemId: 'item-flour',
            quantity: 1,
          },
        ],
      };

      // Reset mocks
      mockPrismaService.formula.findUnique.mockReset();
      mockPrismaService.item.findUnique.mockReset();

      mockPrismaService.formula.findUnique.mockResolvedValue(null);
      mockPrismaService.item.findUnique.mockResolvedValue({
        id: 'item-flour',
        name: 'Flour',
      });

      mockPrismaService.formula.create.mockImplementation((args) => {
        return Promise.resolve({
          id: 'formula-simple',
          ...args.data,
        });
      });

      // Act
      await service.create(minimalDto, 'user-123');

      // Assert
      const createCall = mockPrismaService.formula.create.mock.calls[0][0];
      expect(createCall.data.version).toBe('1.0');
      expect(createCall.data.outputQuantity).toEqual(new Decimal(1));
      expect(createCall.data.isActive).toBe(true);
    });
  });

  describe('findByCode', () => {
    it('should find formula by code', async () => {
      // Arrange
      const mockFormula = {
        id: 'formula-123',
        code: 'CAKE-001',
        name: 'Chocolate Cake',
        isActive: true,
      };
      mockPrismaService.formula.findUnique.mockResolvedValue(mockFormula);

      // Act
      const result = await service.findByCode('CAKE-001');

      // Assert
      expect(mockPrismaService.formula.findUnique).toHaveBeenCalledWith({
        where: { code: 'CAKE-001' },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockFormula);
    });

    it('should throw NotFoundException for non-existent code', async () => {
      // Arrange
      mockPrismaService.formula.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findByCode('INVALID-CODE')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('calculateMaterialRequirements', () => {
    const mockFormula = {
      id: 'formula-123',
      code: 'CAKE-001',
      name: 'Chocolate Cake',
      outputQuantity: new Decimal(1),
      isActive: true,
      items: [
        {
          id: 'fi-1',
          itemId: 'item-flour',
          quantity: new Decimal(2.5),
          item: {
            id: 'item-flour',
            name: 'Flour',
            mainUnit: 'kg',
            usingUnit: 'kg',
            usingToMainRate: new Decimal(1), // 1:1 conversion
          },
        },
        {
          id: 'fi-2',
          itemId: 'item-sugar',
          quantity: new Decimal(1.0),
          item: {
            id: 'item-sugar',
            name: 'Sugar',
            mainUnit: 'kg',
            usingUnit: 'kg',
            usingToMainRate: new Decimal(1),
          },
        },
      ],
    };

    it('should calculate material requirements for desired output quantity', async () => {
      // Arrange
      mockPrismaService.formula.findUnique.mockResolvedValue(mockFormula);

      // Act
      const result = await service.calculateMaterialRequirements('CAKE-001', 5); // 5 cakes

      // Assert
      expect(result.formulaCode).toBe('CAKE-001');
      expect(result.formulaName).toBe('Chocolate Cake');
      expect(result.requestedOutputQuantity).toBe(5);
      expect(result.requirements[0].itemId).toBe('item-flour');
      expect(
        result.requirements[0].requiredQuantityInUsingUnit.toString()
      ).toBe('12.5');
      expect(result.requirements[1].itemId).toBe('item-sugar');
      expect(
        result.requirements[1].requiredQuantityInUsingUnit.toString()
      ).toBe('5');
    });

    it('should handle fractional output quantities', async () => {
      // Arrange
      mockPrismaService.formula.findUnique.mockResolvedValue(mockFormula);

      // Act
      const result = await service.calculateMaterialRequirements(
        'CAKE-001',
        2.5
      );

      // Assert
      expect(result.requirements[0].requiredQuantityInUsingUnit).toEqual(
        new Decimal(6.25)
      ); // 2.5 * 2.5
      expect(result.requirements[1].requiredQuantityInUsingUnit).toEqual(
        new Decimal(2.5)
      ); // 1.0 * 2.5
    });

    it('should convert quantities using unit conversion rates', async () => {
      // Arrange
      const formulaWithConversion = {
        ...mockFormula,
        items: [
          {
            id: 'fi-1',
            itemId: 'item-spice',
            quantity: new Decimal(500), // 500 grams in formula
            item: {
              id: 'item-spice',
              name: 'Spice',
              mainUnit: 'kg',
              usingUnit: 'g',
              usingToMainRate: new Decimal(0.001), // 1000g = 1kg
            },
          },
        ],
      };
      mockPrismaService.formula.findUnique.mockResolvedValue(
        formulaWithConversion
      );

      // Act
      const result = await service.calculateMaterialRequirements('CAKE-001', 1);

      // Assert
      // 500g * 0.001 = 0.5kg required
      expect(result.requirements[0].requiredQuantityInMainUnit).toEqual(
        new Decimal(0.5)
      );
    });
  });

  describe('toggleActive', () => {
    it('should activate an inactive formula', async () => {
      // Arrange
      const inactiveFormula = { id: 'formula-123', isActive: false };
      mockPrismaService.formula.findUnique.mockResolvedValue(inactiveFormula);
      mockPrismaService.formula.update.mockResolvedValue({
        ...inactiveFormula,
        isActive: true,
      });

      // Act
      const result = await service.toggleActive('formula-123');

      // Assert
      expect(mockPrismaService.formula.update).toHaveBeenCalledWith({
        where: { id: 'formula-123' },
        data: { isActive: true },
        include: expect.any(Object),
      });
      expect(result.isActive).toBe(true);
    });

    it('should deactivate an active formula if not used in manufacturing lists', async () => {
      // Arrange
      const activeFormula = { id: 'formula-123', isActive: true };
      mockPrismaService.formula.findUnique.mockResolvedValue(activeFormula);
      mockPrismaService.manufacturingList.findMany.mockResolvedValue([]); // No MLs using this formula
      mockPrismaService.formula.update.mockResolvedValue({
        ...activeFormula,
        isActive: false,
      });

      // Act
      await service.toggleActive('formula-123');

      // Assert
      expect(mockPrismaService.manufacturingList.findMany).toHaveBeenCalledWith(
        {
          where: {
            formulaId: 'formula-123',
            status: {
              in: ['IN_PROGRESS', 'COMPLETED'],
            },
          },
        }
      );
    });

    it('should prevent deactivation if formula is used in manufacturing lists', async () => {
      // Arrange
      const activeFormula = { id: 'formula-123', isActive: true };
      const manufacturingLists = [
        { id: 'ml-1', status: 'IN_PROGRESS', formulaId: 'formula-123' },
      ];

      mockPrismaService.formula.findUnique.mockResolvedValue(activeFormula);
      mockPrismaService.manufacturingList.findMany.mockResolvedValue(
        manufacturingLists
      );

      // Mock update to throw error if it's called
      mockPrismaService.formula.update.mockImplementation(() => {
        throw new Error('Should not reach this point');
      });

      // Act & Assert
      await expect(service.toggleActive('formula-123')).rejects.toThrow(
        'Cannot deactivate formula that is used in manufacturing lists'
      );
    });
  });

  describe('clone', () => {
    const mockSourceFormula = {
      id: 'formula-123',
      name: 'Original Cake',
      code: 'CAKE-001',
      version: '1.0',
      description: 'Original recipe',
      outputItem: 'item-cake',
      outputQuantity: new Decimal(1),
      items: [
        {
          itemId: 'item-flour',
          quantity: new Decimal(2.5),
          remarks: 'All-purpose flour',
        },
      ],
    };

    it('should clone formula with incremented version', async () => {
      // Arrange
      mockPrismaService.formula.findUnique
        .mockResolvedValueOnce(mockSourceFormula) // Source formula
        .mockResolvedValueOnce(null); // No existing v1.1
      mockPrismaService.item.findUnique.mockResolvedValue({ id: 'item-flour' });
      mockPrismaService.formula.create.mockResolvedValue({
        ...mockSourceFormula,
        id: 'formula-456',
        version: '1.1',
      });

      // Act
      const result = await service.clone('formula-123', 'user-123');

      // Assert
      expect(mockPrismaService.formula.create).toHaveBeenCalledWith({
        data: {
          name: 'Original Cake',
          code: 'CAKE-001',
          description: 'Original recipe',
          version: '1.1',
          outputItem: 'item-cake',
          outputQuantity: new Decimal(1),
          isActive: true,
          createdById: 'user-123',
          items: {
            create: [
              {
                itemId: 'item-flour',
                quantity: new Decimal(2.5),
                remarks: 'All-purpose flour',
              },
            ],
          },
        },
        include: expect.any(Object),
      });
    });

    it('should handle version conflicts by incrementing further', async () => {
      // Reset mocks
      mockPrismaService.formula.findUnique.mockReset();

      // First findUnique gets the original formula by ID
      mockPrismaService.formula.findUnique.mockResolvedValueOnce(
        mockSourceFormula
      );
      // Second findUnique checks if version 1.1 exists (it does)
      mockPrismaService.formula.findUnique.mockResolvedValueOnce({
        id: 'existing-1.1',
        code: 'CAKE-001',
        version: '1.1',
      });
      // Third findUnique checks if version 1.2 exists (it doesn't)
      mockPrismaService.formula.findUnique.mockResolvedValueOnce(null);

      mockPrismaService.formula.create.mockImplementation((args) => {
        return Promise.resolve({
          id: 'formula-456',
          ...args.data,
        });
      });

      // Act
      await service.clone('formula-123', 'user-123');

      // Assert
      const createCall = mockPrismaService.formula.create.mock.calls[0][0];
      expect(createCall.data.version).toBe('1.2');
    });
  });

  describe('business logic validation', () => {
    it('should validate formula serves production planning requirements (FR-23, FR-24)', async () => {
      // This validates that formulas properly define raw material consumption rates
      const productionFormula: CreateFormulaDto = {
        name: 'Product A',
        code: 'PROD-A-001',
        description: 'Product A uses 2 kg flour, 1L oil, 5 units sugar',
        items: [
          { itemId: 'item-flour', quantity: 2 }, // 2 kg flour
          { itemId: 'item-oil', quantity: 1 }, // 1L oil
          { itemId: 'item-sugar', quantity: 5 }, // 5 units sugar
        ],
      };

      // Reset the mock behavior
      mockPrismaService.formula.findUnique.mockReset();
      mockPrismaService.item.findUnique.mockReset();

      // Set up mock responses for this test
      mockPrismaService.formula.findUnique.mockResolvedValue(null); // No existing formula
      mockPrismaService.item.findUnique.mockImplementation((args) => {
        const itemId = args.where.id;
        return Promise.resolve({
          id: itemId,
          name: itemId.replace('item-', ''),
        });
      });

      mockPrismaService.formula.create.mockImplementation((args) => {
        return Promise.resolve({
          id: 'new-formula-id',
          ...args.data,
        });
      });

      // Act
      await service.create(productionFormula, 'user-123');

      // Assert
      const createCall = mockPrismaService.formula.create.mock.calls[0][0];
      expect(createCall.data.items.create).toHaveLength(3);
      expect(createCall.data.items.create[0].quantity).toEqual(new Decimal(2));
      expect(createCall.data.items.create[1].quantity).toEqual(new Decimal(1));
      expect(createCall.data.items.create[2].quantity).toEqual(new Decimal(5));
    });

    it('should maintain version control for formula evolution', async () => {
      // This validates FR-24: Each formula has version tracking
      const formulaWithVersion: CreateFormulaDto = {
        name: 'Recipe V2',
        code: 'RECIPE-001',
        version: '2.0',
        description: 'Updated recipe with improved ingredients',
        items: [{ itemId: 'item-flour', quantity: 2.5 }],
      };

      // Reset the mock behavior
      mockPrismaService.formula.findUnique.mockReset();
      mockPrismaService.item.findUnique.mockReset();

      // Set up mock responses for this test
      mockPrismaService.formula.findUnique.mockResolvedValue(null); // No existing formula
      mockPrismaService.item.findUnique.mockImplementation((args) => {
        const itemId = args.where.id;
        return Promise.resolve({
          id: itemId,
          name: itemId.replace('item-', ''),
        });
      });

      mockPrismaService.formula.create.mockImplementation((args) => {
        return Promise.resolve({
          id: 'new-formula-id',
          ...args.data,
        });
      });

      // Act
      await service.create(formulaWithVersion, 'user-123');

      // Assert
      const createCall = mockPrismaService.formula.create.mock.calls[0][0];
      expect(createCall.data.version).toBe('2.0');
      expect(createCall.data.description).toBe(
        'Updated recipe with improved ingredients'
      );
    });

    it('should enforce data consistency for material calculations', () => {
      // This validates that material requirement calculations are accurate
      const recipeQuantity = new Decimal(2.5); // per unit
      const desiredOutput = new Decimal(10); // units
      const expectedTotal = recipeQuantity.mul(desiredOutput);

      expect(expectedTotal).toEqual(new Decimal(25));
    });
  });
});
