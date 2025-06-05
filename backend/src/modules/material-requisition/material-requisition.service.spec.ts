import { Test, TestingModule } from '@nestjs/testing';
import { MaterialRequisitionService } from './material-requisition.service';
import { PrismaService } from '../../app/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import {
  CreateMaterialRequisitionDto,
  MRType,
} from './dto/create-material-requisition.dto';

// Mock data
const mockUser = {
  id: 'user-1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
};

const mockBranch = {
  id: 'branch-1',
  name: 'Main Branch',
  code: 'MAIN',
};

const mockToBranch = {
  id: 'branch-2',
  name: 'Secondary Branch',
  code: 'SEC',
};

const mockItem = {
  id: 'item-1',
  name: 'Raw Material A',
  code: 'RM001',
  transferToMainRate: new Decimal('1.0'),
};

const mockRequestForm = {
  id: 'rf-1',
  rfNumber: 'RF000001',
  status: 'APPROVED',
  fromBranchId: 'branch-1',
  toBranchId: 'branch-2',
  items: [
    {
      id: 'rf-item-1',
      itemId: 'item-1',
      requestedQty: new Decimal('100'),
      remarks: 'Urgent request',
      item: mockItem,
    },
  ],
  fromBranch: mockBranch,
  toBranch: mockToBranch,
};

const mockStock = {
  itemId: 'item-1',
  branchId: 'branch-1',
  quantity: new Decimal('500'),
  availableQty: new Decimal('450'),
  lastStockDate: new Date(),
};

describe('MaterialRequisitionService', () => {
  let service: MaterialRequisitionService;

  const mockPrismaService = {
    materialRequisition: {
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    requestForm: {
      findUnique: jest.fn(),
    },
    stock: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaterialRequisitionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MaterialRequisitionService>(
      MaterialRequisitionService
    );

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create transfer MR with sequential number generation', async () => {
      const createDto: CreateMaterialRequisitionDto = {
        title: 'Material Transfer Request',
        type: MRType.TRANSFER,
        fromBranchId: 'branch-1',
        toBranchId: 'branch-2',
        transferDate: '2025-06-10',
        items: [
          {
            itemId: 'item-1',
            quantity: 100,
            remarks: 'For production',
          },
        ],
        notes: 'Urgent transfer',
      };

      const expectedMR = {
        id: 'mr-1',
        mrNumber: 'MR000001',
        title: createDto.title,
        type: MRType.TRANSFER,
        fromBranchId: 'branch-1',
        toBranchId: 'branch-2',
        transferDate: new Date('2025-06-10'),
        status: 'DRAFT',
        items: [
          {
            id: 'mr-item-1',
            itemId: 'item-1',
            quantity: new Decimal('100'),
            remarks: 'For production',
            item: mockItem,
          },
        ],
        fromBranch: mockBranch,
        toBranch: mockToBranch,
        createdBy: mockUser,
      };

      mockPrismaService.materialRequisition.count.mockResolvedValue(0);
      mockPrismaService.materialRequisition.create.mockResolvedValue(
        expectedMR
      );

      const result = await service.create(createDto, 'user-1');

      expect(mockPrismaService.materialRequisition.count).toHaveBeenCalled();
      expect(mockPrismaService.materialRequisition.create).toHaveBeenCalledWith(
        {
          data: {
            mrNumber: 'MR000001',
            title: createDto.title,
            rfId: undefined,
            type: MRType.TRANSFER,
            fromBranchId: 'branch-1',
            toBranchId: 'branch-2',
            branchId: undefined,
            transferDate: new Date('2025-06-10'),
            createdById: 'user-1',
            notes: 'Urgent transfer',
            status: 'DRAFT',
            items: {
              create: [
                {
                  itemId: 'item-1',
                  quantity: new Decimal('100'),
                  wasteType: undefined,
                  remarks: 'For production',
                },
              ],
            },
          },
          include: expect.any(Object),
        }
      );
      expect(result).toEqual(expectedMR);
    });

    it('should create trim/waste MR with branch validation', async () => {
      const createDto: CreateMaterialRequisitionDto = {
        title: 'Waste Disposal',
        type: MRType.TRIM_WASTE,
        branchId: 'branch-1',
        items: [
          {
            itemId: 'item-1',
            quantity: 50,
            wasteType: 'TRIM',
            remarks: 'Production waste',
          },
        ],
      };

      const expectedMR = {
        id: 'mr-2',
        mrNumber: 'MR000002',
        title: createDto.title,
        type: MRType.TRIM_WASTE,
        branchId: 'branch-1',
        status: 'DRAFT',
        items: [
          {
            id: 'mr-item-2',
            itemId: 'item-1',
            quantity: new Decimal('50'),
            wasteType: 'TRIM',
            remarks: 'Production waste',
          },
        ],
      };

      mockPrismaService.materialRequisition.count.mockResolvedValue(1);
      mockPrismaService.materialRequisition.create.mockResolvedValue(
        expectedMR
      );

      const result = await service.create(createDto, 'user-1');

      expect(result.mrNumber).toBe('MR000002');
      expect(result.type).toBe(MRType.TRIM_WASTE);
      expect(result.branchId).toBe('branch-1');
    });

    it('should validate transfer MR requires both branches', async () => {
      const createDto: CreateMaterialRequisitionDto = {
        title: 'Invalid Transfer',
        type: MRType.TRANSFER,
        fromBranchId: 'branch-1',
        // Missing toBranchId
        items: [],
      };

      await expect(service.create(createDto, 'user-1')).rejects.toThrow(
        'Transfer MR requires both fromBranchId and toBranchId'
      );
    });

    it('should validate transfer MR cannot have same source and destination', async () => {
      const createDto: CreateMaterialRequisitionDto = {
        title: 'Invalid Same Branch Transfer',
        type: MRType.TRANSFER,
        fromBranchId: 'branch-1',
        toBranchId: 'branch-1', // Same as fromBranchId
        items: [],
      };

      await expect(service.create(createDto, 'user-1')).rejects.toThrow(
        'Transfer MR cannot have same source and destination branch'
      );
    });

    it('should validate trim/waste MR requires branchId', async () => {
      const createDto: CreateMaterialRequisitionDto = {
        title: 'Invalid Waste',
        type: MRType.TRIM_WASTE,
        // Missing branchId
        items: [],
      };

      await expect(service.create(createDto, 'user-1')).rejects.toThrow(
        'Trim/Waste MR requires branchId'
      );
    });
  });

  describe('findAll', () => {
    it('should find all MRs with branch filtering', async () => {
      const mockMRs = [
        { id: 'mr-1', mrNumber: 'MR000001', fromBranchId: 'branch-1' },
        { id: 'mr-2', mrNumber: 'MR000002', toBranchId: 'branch-1' },
        { id: 'mr-3', mrNumber: 'MR000003', branchId: 'branch-1' },
      ];

      mockPrismaService.materialRequisition.findMany.mockResolvedValue(mockMRs);

      const result = await service.findAll('branch-1');

      expect(
        mockPrismaService.materialRequisition.findMany
      ).toHaveBeenCalledWith({
        where: {
          OR: [
            { fromBranchId: 'branch-1' },
            { toBranchId: 'branch-1' },
            { branchId: 'branch-1' },
          ],
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockMRs);
    });

    it('should find all MRs with type filtering', async () => {
      const mockMRs = [
        { id: 'mr-1', mrNumber: 'MR000001', type: MRType.TRANSFER },
      ];

      mockPrismaService.materialRequisition.findMany.mockResolvedValue(mockMRs);

      await service.findAll(undefined, MRType.TRANSFER);

      expect(
        mockPrismaService.materialRequisition.findMany
      ).toHaveBeenCalledWith({
        where: { type: MRType.TRANSFER },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should find MR by ID', async () => {
      const mockMR = {
        id: 'mr-1',
        mrNumber: 'MR000001',
        items: [],
      };

      mockPrismaService.materialRequisition.findUnique.mockResolvedValue(
        mockMR
      );

      const result = await service.findOne('mr-1');

      expect(
        mockPrismaService.materialRequisition.findUnique
      ).toHaveBeenCalledWith({
        where: { id: 'mr-1' },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockMR);
    });

    it('should throw NotFoundException when MR not found', async () => {
      mockPrismaService.materialRequisition.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        new NotFoundException(
          'Material Requisition with ID non-existent not found'
        )
      );
    });
  });

  describe('approve', () => {
    it('should approve transfer MR without stock deduction', async () => {
      const mockMR = {
        id: 'mr-1',
        status: 'DRAFT',
        type: MRType.TRANSFER,
        fromBranchId: 'branch-1',
        items: [],
      };

      const approvedMR = { ...mockMR, status: 'APPROVED' };

      mockPrismaService.materialRequisition.findUnique.mockResolvedValue(
        mockMR
      );
      mockPrismaService.materialRequisition.update.mockResolvedValue(
        approvedMR
      );

      const result = await service.approve('mr-1', 'user-1');

      expect(mockPrismaService.materialRequisition.update).toHaveBeenCalledWith(
        {
          where: { id: 'mr-1' },
          data: { status: 'APPROVED' },
          include: expect.any(Object),
        }
      );
      expect(result.status).toBe('APPROVED');
    });

    it('should approve trim/waste MR with immediate stock deduction', async () => {
      const mockMR = {
        id: 'mr-1',
        status: 'DRAFT',
        type: MRType.TRIM_WASTE,
        branchId: 'branch-1',
        items: [
          {
            itemId: 'item-1',
            quantity: new Decimal('50'),
            item: mockItem,
          },
        ],
      };

      const approvedMR = { ...mockMR, status: 'APPROVED' };
      const mockTransaction = jest.fn().mockImplementation((callback) =>
        callback({
          materialRequisition: {
            update: jest.fn().mockResolvedValue(approvedMR),
          },
          stock: {
            findUnique: jest.fn().mockResolvedValue(mockStock),
            update: jest
              .fn()
              .mockResolvedValue({
                ...mockStock,
                quantity: new Decimal('450'),
              }),
          },
        })
      );

      mockPrismaService.materialRequisition.findUnique.mockResolvedValue(
        mockMR
      );
      mockPrismaService.$transaction.mockImplementation(mockTransaction);

      const result = await service.approve('mr-1', 'user-1');

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(result.status).toBe('APPROVED');
    });

    it('should not approve non-draft MR', async () => {
      const mockMR = {
        id: 'mr-1',
        status: 'APPROVED',
        type: MRType.TRANSFER,
      };

      mockPrismaService.materialRequisition.findUnique.mockResolvedValue(
        mockMR
      );

      await expect(service.approve('mr-1', 'user-1')).rejects.toThrow(
        'Can only approve Material Requisitions in DRAFT status'
      );
    });
  });

  describe('complete', () => {
    it('should complete transfer MR with stock deduction', async () => {
      const mockMR = {
        id: 'mr-1',
        status: 'APPROVED',
        type: MRType.TRANSFER,
        fromBranchId: 'branch-1',
        items: [
          {
            itemId: 'item-1',
            quantity: new Decimal('100'),
            item: mockItem,
          },
        ],
      };

      const completedMR = { ...mockMR, status: 'COMPLETED' };
      const mockTransaction = jest.fn().mockImplementation((callback) =>
        callback({
          materialRequisition: {
            update: jest.fn().mockResolvedValue(completedMR),
          },
          stock: {
            findUnique: jest.fn().mockResolvedValue(mockStock),
            update: jest
              .fn()
              .mockResolvedValue({
                ...mockStock,
                quantity: new Decimal('400'),
              }),
          },
        })
      );

      mockPrismaService.materialRequisition.findUnique.mockResolvedValue(
        mockMR
      );
      mockPrismaService.$transaction.mockImplementation(mockTransaction);

      const result = await service.complete('mr-1');

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(result.status).toBe('COMPLETED');
    });

    it('should complete trim/waste MR without additional stock changes', async () => {
      const mockMR = {
        id: 'mr-1',
        status: 'APPROVED',
        type: MRType.TRIM_WASTE,
        branchId: 'branch-1',
      };

      const completedMR = { ...mockMR, status: 'COMPLETED' };

      mockPrismaService.materialRequisition.findUnique.mockResolvedValue(
        mockMR
      );
      mockPrismaService.materialRequisition.update.mockResolvedValue(
        completedMR
      );

      const result = await service.complete('mr-1');

      expect(mockPrismaService.materialRequisition.update).toHaveBeenCalledWith(
        {
          where: { id: 'mr-1' },
          data: { status: 'COMPLETED' },
          include: expect.any(Object),
        }
      );
      expect(result.status).toBe('COMPLETED');
    });

    it('should not complete non-approved MR', async () => {
      const mockMR = {
        id: 'mr-1',
        status: 'DRAFT',
        type: MRType.TRANSFER,
      };

      mockPrismaService.materialRequisition.findUnique.mockResolvedValue(
        mockMR
      );

      await expect(service.complete('mr-1')).rejects.toThrow(
        'Can only complete APPROVED Material Requisitions'
      );
    });
  });

  describe('createFromRF', () => {
    it('should create MR from approved RF', async () => {
      const expectedMR = {
        id: 'mr-1',
        mrNumber: 'MR000001',
        title: 'MR for RF000001',
        rfId: 'rf-1',
        type: MRType.TRANSFER,
        fromBranchId: 'branch-1',
        toBranchId: 'branch-2',
      };

      mockPrismaService.requestForm.findUnique.mockResolvedValue(
        mockRequestForm
      );
      mockPrismaService.materialRequisition.count.mockResolvedValue(0);
      mockPrismaService.materialRequisition.create.mockResolvedValue(
        expectedMR
      );

      const result = await service.createFromRF('rf-1', 'user-1');

      expect(mockPrismaService.requestForm.findUnique).toHaveBeenCalledWith({
        where: { id: 'rf-1' },
        include: expect.any(Object),
      });
      expect(result).toEqual(expectedMR);
    });

    it('should not create MR from non-approved RF', async () => {
      const nonApprovedRF = { ...mockRequestForm, status: 'DRAFT' };

      mockPrismaService.requestForm.findUnique.mockResolvedValue(nonApprovedRF);

      await expect(service.createFromRF('rf-1', 'user-1')).rejects.toThrow(
        'Can only create MR from APPROVED or READY_FOR_MR Request Forms'
      );
    });

    it('should throw error for non-existent RF', async () => {
      mockPrismaService.requestForm.findUnique.mockResolvedValue(null);

      await expect(
        service.createFromRF('non-existent', 'user-1')
      ).rejects.toThrow(
        new NotFoundException('Request Form with ID non-existent not found')
      );
    });
  });

  describe('stock deduction logic', () => {
    it('should validate sufficient stock before deduction', async () => {
      const mockMR = {
        id: 'mr-1',
        status: 'APPROVED',
        type: MRType.TRANSFER,
        fromBranchId: 'branch-1',
        items: [
          {
            itemId: 'item-1',
            quantity: new Decimal('1000'), // More than available
            item: mockItem,
          },
        ],
      };

      const insufficientStock = {
        ...mockStock,
        availableQty: new Decimal('50'),
      };
      const mockTransaction = jest.fn().mockImplementation((callback) =>
        callback({
          materialRequisition: {
            update: jest.fn().mockResolvedValue(mockMR),
          },
          stock: {
            findUnique: jest.fn().mockResolvedValue(insufficientStock),
          },
        })
      );

      mockPrismaService.materialRequisition.findUnique.mockResolvedValue(
        mockMR
      );
      mockPrismaService.$transaction.mockImplementation(mockTransaction);

      await expect(service.complete('mr-1')).rejects.toThrow(
        'Insufficient stock for item Raw Material A in source branch'
      );
    });
  });

  describe('update and delete operations', () => {
    it('should only allow updates in DRAFT status', async () => {
      const mockMR = { id: 'mr-1', status: 'APPROVED' };

      mockPrismaService.materialRequisition.findUnique.mockResolvedValue(
        mockMR
      );

      await expect(
        service.update('mr-1', { title: 'Updated' })
      ).rejects.toThrow(
        'Can only update Material Requisitions in DRAFT status'
      );
    });

    it('should only allow deletion in DRAFT status', async () => {
      const mockMR = { id: 'mr-1', status: 'COMPLETED' };

      mockPrismaService.materialRequisition.findUnique.mockResolvedValue(
        mockMR
      );

      await expect(service.remove('mr-1')).rejects.toThrow(
        'Can only delete Material Requisitions in DRAFT status'
      );
    });

    it('should not cancel completed MR', async () => {
      const mockMR = { id: 'mr-1', status: 'COMPLETED' };

      mockPrismaService.materialRequisition.findUnique.mockResolvedValue(
        mockMR
      );

      await expect(service.cancel('mr-1')).rejects.toThrow(
        'Cannot cancel completed Material Requisitions'
      );
    });
  });
});
