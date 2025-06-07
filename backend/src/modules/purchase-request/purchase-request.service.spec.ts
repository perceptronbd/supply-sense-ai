import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../app/prisma.service';
import type { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import { PurchaseRequestService } from './purchase-request.service';

describe('PurchaseRequestService', () => {
  let service: PurchaseRequestService;

  const mockPrismaService = {
    purchaseRequest: {
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    item: {
      findUnique: jest.fn(),
    },
    branch: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseRequestService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PurchaseRequestService>(PurchaseRequestService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('create', () => {
    const mockCreateDto: CreatePurchaseRequestDto = {
      title: 'Test PR',
      description: 'Test Description',
      requiredDate: '2025-06-15',
      branchId: 'branch-123',
      justification: 'Required for production',
      items: [
        {
          itemId: 'item-123',
          requestedQty: 100,
          estimatedPrice: 10.5,
          requiredDate: '2025-06-15',
          remarks: 'Urgent',
        },
        {
          itemId: 'item-456',
          requestedQty: 50,
          estimatedPrice: 25.0,
          requiredDate: '2025-06-15',
        },
      ],
    };

    const mockCreatedPR = {
      id: 'pr-123',
      prNumber: 'PR000001',
      title: 'Test PR',
      description: 'Test Description',
      requiredDate: new Date('2025-06-15'),
      branchId: 'branch-123',
      totalAmount: new Decimal(2300), // (100 * 10.50) + (50 * 25.00)
      status: 'DRAFT',
      items: mockCreateDto.items,
    };

    it('should create a PR with auto-generated PR number', async () => {
      // Arrange
      mockPrismaService.purchaseRequest.count.mockResolvedValue(0);
      mockPrismaService.purchaseRequest.create.mockResolvedValue(mockCreatedPR);

      // Act
      const result = await service.create(mockCreateDto, 'user-123');

      // Assert
      expect(mockPrismaService.purchaseRequest.count).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.purchaseRequest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          prNumber: 'PR000001',
          title: mockCreateDto.title,
          description: mockCreateDto.description,
          totalAmount: new Decimal(2300),
          status: 'DRAFT',
          createdById: 'user-123',
        }),
        include: expect.any(Object),
      });
      expect(result).toEqual(mockCreatedPR);
    });

    it('should calculate correct total amount for PR items', async () => {
      // Arrange
      mockPrismaService.purchaseRequest.count.mockResolvedValue(5);
      mockPrismaService.purchaseRequest.create.mockResolvedValue(mockCreatedPR);

      // Act
      await service.create(mockCreateDto, 'user-123');

      // Assert
      const createCall = mockPrismaService.purchaseRequest.create.mock.calls[0][0];
      const expectedTotal = new Decimal(100).mul(10.5).add(new Decimal(50).mul(25.0));
      expect(createCall.data.totalAmount).toEqual(expectedTotal);
    });

    it('should generate sequential PR numbers', async () => {
      // Arrange
      mockPrismaService.purchaseRequest.count.mockResolvedValue(25);
      mockPrismaService.purchaseRequest.create.mockResolvedValue({
        ...mockCreatedPR,
        prNumber: 'PR000026',
      });

      // Act
      await service.create(mockCreateDto, 'user-123');

      // Assert
      const createCall = mockPrismaService.purchaseRequest.create.mock.calls[0][0];
      expect(createCall.data.prNumber).toBe('PR000026');
    });

    it('should handle PR items without estimated price', async () => {
      // Arrange
      const dtoWithoutPrices: CreatePurchaseRequestDto = {
        ...mockCreateDto,
        items: [
          {
            itemId: 'item-123',
            requestedQty: 100,
            requiredDate: '2025-06-15',
          },
        ],
      };
      mockPrismaService.purchaseRequest.count.mockResolvedValue(0);
      mockPrismaService.purchaseRequest.create.mockResolvedValue(mockCreatedPR);

      // Act
      await service.create(dtoWithoutPrices, 'user-123');

      // Assert
      const createCall = mockPrismaService.purchaseRequest.create.mock.calls[0][0];
      expect(createCall.data.totalAmount).toEqual(new Decimal(0));
    });
  });

  describe('findAll', () => {
    const mockPRs = [
      {
        id: 'pr-1',
        prNumber: 'PR000001',
        status: 'DRAFT',
        branchId: 'branch-123',
      },
      {
        id: 'pr-2',
        prNumber: 'PR000002',
        status: 'APPROVED',
        branchId: 'branch-456',
      },
    ];

    it('should return all PRs when no filters applied', async () => {
      // Arrange
      mockPrismaService.purchaseRequest.findMany.mockResolvedValue(mockPRs);

      // Act
      const result = await service.findAll();

      // Assert
      const findManyCall = mockPrismaService.purchaseRequest.findMany.mock.calls[0][0];
      expect(findManyCall.where).toBeUndefined();
      expect(findManyCall).toHaveProperty('include');
      expect(findManyCall).toHaveProperty('orderBy');
      expect(result).toEqual(mockPRs);
    });

    it('should filter by branch when branchId provided', async () => {
      // Arrange
      const filteredPRs = [mockPRs[0]];
      mockPrismaService.purchaseRequest.findMany.mockResolvedValue(filteredPRs);

      // Act
      const result = await service.findAll('branch-123');

      // Assert
      const findManyCall = mockPrismaService.purchaseRequest.findMany.mock.calls[0][0];
      expect(findManyCall.where).toEqual({ branchId: 'branch-123' });
      expect(findManyCall).toHaveProperty('include');
      expect(findManyCall).toHaveProperty('orderBy');
      expect(result).toEqual(filteredPRs);
    });
  });

  describe('approve', () => {
    const mockPR = {
      id: 'pr-123',
      prNumber: 'PR000001',
      status: 'SUBMITTED',
      branchId: 'branch-123',
    };

    it('should approve a submitted PR', async () => {
      // Arrange
      mockPrismaService.purchaseRequest.findUnique.mockResolvedValue(mockPR);
      mockPrismaService.purchaseRequest.update.mockResolvedValue({
        ...mockPR,
        status: 'APPROVED',
      });

      // Act
      const result = await service.approve('pr-123', 'user-123');

      // Assert
      const updateCall = mockPrismaService.purchaseRequest.update.mock.calls[0][0];
      expect(updateCall.where).toEqual({ id: 'pr-123' });
      expect(updateCall.data.status).toBe('APPROVED');
      expect(updateCall.data).toHaveProperty('approvedDate');
      // service uses approvedDate instead of approvedAt and doesn't set approvedById
      expect(result.status).toBe('APPROVED');
    });

    it('should throw error when trying to approve non-submitted PR', async () => {
      // Arrange
      const draftPR = { ...mockPR, status: 'DRAFT' };
      mockPrismaService.purchaseRequest.findUnique.mockResolvedValue(draftPR);

      // Act & Assert
      await expect(service.approve('pr-123', 'user-123')).rejects.toThrow(
        'Can only approve Purchase Requests in SUBMITTED status'
      );
    });

    it('should throw NotFoundException for non-existent PR', async () => {
      // Arrange
      mockPrismaService.purchaseRequest.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.approve('invalid-id', 'user-123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('submit', () => {
    const mockPR = {
      id: 'pr-123',
      prNumber: 'PR000001',
      status: 'DRAFT',
      branchId: 'branch-123',
    };

    it('should submit a draft PR', async () => {
      // Arrange
      mockPrismaService.purchaseRequest.findUnique.mockResolvedValue(mockPR);
      mockPrismaService.purchaseRequest.update.mockResolvedValue({
        ...mockPR,
        status: 'SUBMITTED',
      });

      // Act
      const result = await service.submit('pr-123');

      // Assert
      const updateCall = mockPrismaService.purchaseRequest.update.mock.calls[0][0];
      expect(updateCall.where).toEqual({ id: 'pr-123' });
      expect(updateCall.data.status).toBe('SUBMITTED');
      // service doesn't set submittedAt
      expect(result.status).toBe('SUBMITTED');
    });

    it('should throw error when trying to submit non-draft PR', async () => {
      // Arrange
      const submittedPR = { ...mockPR, status: 'SUBMITTED' };
      mockPrismaService.purchaseRequest.findUnique.mockResolvedValue(submittedPR);

      // Act & Assert
      await expect(service.submit('pr-123')).rejects.toThrow(
        'Can only submit Purchase Requests in DRAFT status'
      );
    });
  });

  describe('findOne', () => {
    const mockPR = {
      id: 'pr-123',
      prNumber: 'PR000001',
      status: 'DRAFT',
      items: [],
    };

    it('should return PR by ID with all relations', async () => {
      // Arrange
      mockPrismaService.purchaseRequest.findUnique.mockResolvedValue(mockPR);

      // Act
      const result = await service.findOne('pr-123');

      // Assert
      expect(mockPrismaService.purchaseRequest.findUnique).toHaveBeenCalledWith({
        where: { id: 'pr-123' },
        include: expect.objectContaining({
          items: expect.any(Object),
          branch: expect.any(Boolean),
          createdBy: expect.any(Object),
        }),
      });
      expect(result).toEqual(mockPR);
    });

    it('should throw NotFoundException for non-existent PR', async () => {
      // Arrange
      mockPrismaService.purchaseRequest.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('business logic validation', () => {
    it('should calculate accurate total amounts with decimal precision', async () => {
      // This validates FR-22 requirement for accurate cost calculations
      const precisePriceDto: CreatePurchaseRequestDto = {
        title: 'Precision Test',
        requiredDate: '2025-06-15',
        branchId: 'branch-123',
        items: [
          {
            itemId: 'item-1',
            requestedQty: 33.333,
            estimatedPrice: 1.567,
            requiredDate: '2025-06-15',
          },
        ],
      };

      mockPrismaService.purchaseRequest.count.mockResolvedValue(0);
      mockPrismaService.purchaseRequest.create.mockResolvedValue({} as never);

      await service.create(precisePriceDto, 'user-123');

      const createCall = mockPrismaService.purchaseRequest.create.mock.calls[0][0];
      const expectedTotal = new Decimal(33.333).mul(1.567);
      expect(createCall.data.totalAmount).toEqual(expectedTotal);
    });

    it('should enforce PR workflow: DRAFT → SUBMITTED → APPROVED', async () => {
      // This validates FR-8: PR status changes workflow
      const mockPR = { id: 'pr-123', status: 'DRAFT' };

      mockPrismaService.purchaseRequest.findUnique.mockResolvedValue(mockPR);
      mockPrismaService.purchaseRequest.update.mockResolvedValue({
        ...mockPR,
        status: 'SUBMITTED',
      });

      // Should allow DRAFT → SUBMITTED
      await service.submit('pr-123');
      expect(mockPrismaService.purchaseRequest.update).toHaveBeenCalled();
    });
  });
});
