import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../app/prisma.service';
import type { CreateRequestFormDto } from './dto/create-request-form.dto';
import { RequestFormService } from './request-form.service';

// Mock data
const mockUser = {
  id: 'user-1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
};

const mockFromBranch = {
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
  transferUnit: 'kg',
  mainUnit: 'g',
  transferToMainRate: new Decimal('1000'),
};

const mockRFTemplate = {
  id: 'template-1',
  name: 'Standard Material Request',
  description: 'Template for standard material requests',
  isActive: true,
  usageCount: 5,
  items: [
    {
      id: 'template-item-1',
      itemId: 'item-1',
      defaultQty: new Decimal('100'),
      remarks: 'Standard quantity',
      item: mockItem,
    },
  ],
};

describe('RequestFormService', () => {
  let service: RequestFormService;
  let prismaService: any;

  beforeEach(async () => {
    const mockPrismaService = {
      requestForm: {
        count: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      rFTemplate: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestFormService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RequestFormService>(RequestFormService);
    prismaService = module.get(PrismaService);
  });

  describe('create', () => {
    it('should create RF with sequential number generation', async () => {
      const createDto: CreateRequestFormDto = {
        title: 'Material Request for Production',
        description: 'Urgent materials needed for production line',
        fromBranchId: 'branch-1',
        toBranchId: 'branch-2',
        requiredDate: '2025-06-15',
        reason: 'Production shortage',
        items: [
          {
            itemId: 'item-1',
            requestedQty: 100,
            remarks: 'High quality required',
          },
        ],
      };

      const expectedRF = {
        id: 'rf-1',
        rfNumber: 'RF000001',
        title: createDto.title,
        description: createDto.description,
        fromBranchId: 'branch-1',
        toBranchId: 'branch-2',
        requiredDate: new Date('2025-06-15'),
        reason: 'Production shortage',
        status: 'DRAFT',
        items: [
          {
            id: 'rf-item-1',
            itemId: 'item-1',
            requestedQty: new Decimal('100'),
            remarks: 'High quality required',
            item: mockItem,
          },
        ],
        fromBranch: mockFromBranch,
        toBranch: mockToBranch,
        createdBy: mockUser,
        rfTemplate: null,
      };

      prismaService.requestForm.count.mockResolvedValue(0);
      prismaService.requestForm.create.mockResolvedValue(expectedRF);

      const result = await service.create(createDto, 'user-1');

      expect(prismaService.requestForm.count).toHaveBeenCalled();
      expect(prismaService.requestForm.create).toHaveBeenCalledWith({
        data: {
          rfNumber: 'RF000001',
          title: createDto.title,
          description: createDto.description,
          fromBranchId: 'branch-1',
          toBranchId: 'branch-2',
          requiredDate: new Date('2025-06-15'),
          createdById: 'user-1',
          rfTemplateId: undefined,
          reason: 'Production shortage',
          status: 'DRAFT',
          items: {
            create: [
              {
                itemId: 'item-1',
                requestedQty: new Decimal('100'),
                remarks: 'High quality required',
              },
            ],
          },
        },
        include: expect.any(Object),
      });
      expect(result).toEqual(expectedRF);
    });

    it('should generate sequential RF numbers', async () => {
      const createDto: CreateRequestFormDto = {
        title: 'Second RF',
        fromBranchId: 'branch-1',
        toBranchId: 'branch-2',
        requiredDate: '2025-06-15',
        items: [],
      };

      const expectedRF = {
        id: 'rf-2',
        rfNumber: 'RF000002',
        title: 'Second RF',
      };

      prismaService.requestForm.count.mockResolvedValue(1);
      prismaService.requestForm.create.mockResolvedValue(expectedRF);

      const result = await service.create(createDto, 'user-1');

      expect(result.rfNumber).toBe('RF000002');
    });
  });

  describe('findAll', () => {
    it('should find all RFs with branch filtering', async () => {
      const mockRFs = [
        { id: 'rf-1', rfNumber: 'RF000001', fromBranchId: 'branch-1' },
        { id: 'rf-2', rfNumber: 'RF000002', fromBranchId: 'branch-1' },
      ];

      prismaService.requestForm.findMany.mockResolvedValue(mockRFs);

      const result = await service.findAll('branch-1');

      expect(prismaService.requestForm.findMany).toHaveBeenCalledWith({
        where: { fromBranchId: 'branch-1' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockRFs);
    });

    it('should find all RFs with both branch filters', async () => {
      const mockRFs = [
        {
          id: 'rf-1',
          rfNumber: 'RF000001',
          fromBranchId: 'branch-1',
          toBranchId: 'branch-2',
        },
      ];

      prismaService.requestForm.findMany.mockResolvedValue(mockRFs);

      await service.findAll('branch-1', 'branch-2');

      expect(prismaService.requestForm.findMany).toHaveBeenCalledWith({
        where: { fromBranchId: 'branch-1', toBranchId: 'branch-2' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should find RF by ID', async () => {
      const mockRF = {
        id: 'rf-1',
        rfNumber: 'RF000001',
        items: [],
        materialRequisitions: [],
      };

      prismaService.requestForm.findUnique.mockResolvedValue(mockRF);

      const result = await service.findOne('rf-1');

      expect(prismaService.requestForm.findUnique).toHaveBeenCalledWith({
        where: { id: 'rf-1' },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockRF);
    });

    it('should throw NotFoundException when RF not found', async () => {
      prismaService.requestForm.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        new NotFoundException('Request Form with ID non-existent not found')
      );
    });
  });

  describe('update', () => {
    it('should update RF in DRAFT status', async () => {
      const mockRF = {
        id: 'rf-1',
        status: 'DRAFT',
        items: [],
      };

      const updateDto = {
        title: 'Updated RF Title',
        items: [
          {
            itemId: 'item-1',
            requestedQty: 200,
            remarks: 'Updated quantity',
          },
        ],
      };

      const updatedRF = {
        ...mockRF,
        title: 'Updated RF Title',
        items: [
          {
            itemId: 'item-1',
            requestedQty: new Decimal('200'),
            remarks: 'Updated quantity',
          },
        ],
      };

      prismaService.requestForm.findUnique.mockResolvedValue(mockRF);
      prismaService.requestForm.update.mockResolvedValue(updatedRF);

      const result = await service.update('rf-1', updateDto);

      expect(prismaService.requestForm.update).toHaveBeenCalledWith({
        where: { id: 'rf-1' },
        data: {
          title: 'Updated RF Title',
          description: undefined,
          fromBranchId: undefined,
          toBranchId: undefined,
          requiredDate: undefined,
          rfTemplateId: undefined,
          reason: undefined,
          items: {
            deleteMany: { rfId: 'rf-1' },
            create: [
              {
                itemId: 'item-1',
                requestedQty: new Decimal('200'),
                remarks: 'Updated quantity',
              },
            ],
          },
        },
        include: expect.any(Object),
      });
      expect(result).toEqual(updatedRF);
    });

    it('should not allow updates to non-draft RF', async () => {
      const mockRF = {
        id: 'rf-1',
        status: 'SUBMITTED',
      };

      prismaService.requestForm.findUnique.mockResolvedValue(mockRF);

      await expect(service.update('rf-1', { title: 'Updated' })).rejects.toThrow(
        'Can only update Request Forms in DRAFT status'
      );
    });
  });

  describe('remove', () => {
    it('should delete RF in DRAFT status', async () => {
      const mockRF = {
        id: 'rf-1',
        status: 'DRAFT',
      };

      prismaService.requestForm.findUnique.mockResolvedValue(mockRF);
      prismaService.requestForm.delete.mockResolvedValue(mockRF);

      const result = await service.remove('rf-1');

      expect(prismaService.requestForm.delete).toHaveBeenCalledWith({
        where: { id: 'rf-1' },
      });
      expect(result).toEqual(mockRF);
    });

    it('should not allow deletion of non-draft RF', async () => {
      const mockRF = {
        id: 'rf-1',
        status: 'APPROVED',
      };

      prismaService.requestForm.findUnique.mockResolvedValue(mockRF);

      await expect(service.remove('rf-1')).rejects.toThrow(
        'Can only delete Request Forms in DRAFT status'
      );
    });
  });

  describe('workflow status transitions', () => {
    it('should submit RF from DRAFT status', async () => {
      const mockRF = {
        id: 'rf-1',
        status: 'DRAFT',
      };

      const submittedRF = { ...mockRF, status: 'SUBMITTED' };

      prismaService.requestForm.findUnique.mockResolvedValue(mockRF);
      prismaService.requestForm.update.mockResolvedValue(submittedRF);

      const result = await service.submit('rf-1');

      expect(prismaService.requestForm.update).toHaveBeenCalledWith({
        where: { id: 'rf-1' },
        data: { status: 'SUBMITTED' },
        include: expect.any(Object),
      });
      expect(result.status).toBe('SUBMITTED');
    });

    it('should not submit non-draft RF', async () => {
      const mockRF = {
        id: 'rf-1',
        status: 'SUBMITTED',
      };

      prismaService.requestForm.findUnique.mockResolvedValue(mockRF);

      await expect(service.submit('rf-1')).rejects.toThrow(
        'Can only submit Request Forms in DRAFT status'
      );
    });

    it('should approve RF from SUBMITTED status', async () => {
      const mockRF = {
        id: 'rf-1',
        status: 'SUBMITTED',
      };

      const approvedRF = {
        ...mockRF,
        status: 'APPROVED',
        approvedDate: expect.any(Date),
      };

      prismaService.requestForm.findUnique.mockResolvedValue(mockRF);
      prismaService.requestForm.update.mockResolvedValue(approvedRF);

      const result = await service.approve('rf-1', 'user-1');

      expect(prismaService.requestForm.update).toHaveBeenCalledWith({
        where: { id: 'rf-1' },
        data: {
          status: 'APPROVED',
          approvedDate: expect.any(Date),
        },
        include: expect.any(Object),
      });
      expect(result.status).toBe('APPROVED');
    });

    it('should not approve non-submitted RF', async () => {
      const mockRF = {
        id: 'rf-1',
        status: 'DRAFT',
      };

      prismaService.requestForm.findUnique.mockResolvedValue(mockRF);

      await expect(service.approve('rf-1', 'user-1')).rejects.toThrow(
        'Can only approve Request Forms in SUBMITTED status'
      );
    });

    it('should reject RF from SUBMITTED status', async () => {
      const mockRF = {
        id: 'rf-1',
        status: 'SUBMITTED',
      };

      const rejectedRF = { ...mockRF, status: 'REJECTED' };

      prismaService.requestForm.findUnique.mockResolvedValue(mockRF);
      prismaService.requestForm.update.mockResolvedValue(rejectedRF);

      const result = await service.reject('rf-1', 'user-1');

      expect(prismaService.requestForm.update).toHaveBeenCalledWith({
        where: { id: 'rf-1' },
        data: { status: 'REJECTED' },
        include: expect.any(Object),
      });
      expect(result.status).toBe('REJECTED');
    });

    it('should not reject non-submitted RF', async () => {
      const mockRF = {
        id: 'rf-1',
        status: 'APPROVED',
      };

      prismaService.requestForm.findUnique.mockResolvedValue(mockRF);

      await expect(service.reject('rf-1', 'user-1')).rejects.toThrow(
        'Can only reject Request Forms in SUBMITTED status'
      );
    });

    it('should mark approved RF as ready for MR', async () => {
      const mockRF = {
        id: 'rf-1',
        status: 'APPROVED',
      };

      const readyRF = { ...mockRF, status: 'READY_FOR_MR' };

      prismaService.requestForm.findUnique.mockResolvedValue(mockRF);
      prismaService.requestForm.update.mockResolvedValue(readyRF);

      const result = await service.markReadyForMR('rf-1');

      expect(prismaService.requestForm.update).toHaveBeenCalledWith({
        where: { id: 'rf-1' },
        data: { status: 'READY_FOR_MR' },
        include: expect.any(Object),
      });
      expect(result.status).toBe('READY_FOR_MR');
    });

    it('should not mark non-approved RF as ready for MR', async () => {
      const mockRF = {
        id: 'rf-1',
        status: 'SUBMITTED',
      };

      prismaService.requestForm.findUnique.mockResolvedValue(mockRF);

      await expect(service.markReadyForMR('rf-1')).rejects.toThrow(
        'Can only mark APPROVED Request Forms as ready for MR'
      );
    });
  });

  describe('createFromTemplate', () => {
    it('should create RF from active template', async () => {
      const expectedRF = {
        id: 'rf-1',
        rfNumber: 'RF000001',
        title: 'RF from Standard Material Request',
        rfTemplateId: 'template-1',
        fromBranchId: 'branch-1',
        toBranchId: 'branch-2',
        items: [
          {
            itemId: 'item-1',
            requestedQty: new Decimal('100'),
            remarks: 'Standard quantity',
          },
        ],
      };

      const updatedTemplate = {
        ...mockRFTemplate,
        usageCount: 6,
      };

      prismaService.rFTemplate.findUnique.mockResolvedValue(mockRFTemplate);
      prismaService.rFTemplate.update.mockResolvedValue(updatedTemplate);
      prismaService.requestForm.count.mockResolvedValue(0);
      prismaService.requestForm.create.mockResolvedValue(expectedRF);

      const result = await service.createFromTemplate(
        'template-1',
        'branch-1',
        'branch-2',
        'user-1'
      );

      expect(prismaService.rFTemplate.findUnique).toHaveBeenCalledWith({
        where: { id: 'template-1' },
        include: expect.any(Object),
      });
      expect(prismaService.rFTemplate.update).toHaveBeenCalledWith({
        where: { id: 'template-1' },
        data: { usageCount: 6 },
      });
      expect(result).toEqual(expectedRF);
    });

    it('should not create RF from inactive template', async () => {
      const inactiveTemplate = {
        ...mockRFTemplate,
        isActive: false,
      };

      prismaService.rFTemplate.findUnique.mockResolvedValue(inactiveTemplate);

      await expect(
        service.createFromTemplate('template-1', 'branch-1', 'branch-2', 'user-1')
      ).rejects.toThrow('Cannot create RF from inactive template');
    });

    it('should throw error for non-existent template', async () => {
      prismaService.rFTemplate.findUnique.mockResolvedValue(null);

      await expect(
        service.createFromTemplate('non-existent', 'branch-1', 'branch-2', 'user-1')
      ).rejects.toThrow(new NotFoundException('RF Template with ID non-existent not found'));
    });
  });

  describe('template integration', () => {
    it('should create RF with template reference', async () => {
      const createDto: CreateRequestFormDto = {
        title: 'Template-based RF',
        fromBranchId: 'branch-1',
        toBranchId: 'branch-2',
        requiredDate: '2025-06-15',
        rfTemplateId: 'template-1',
        items: [],
      };

      const expectedRF = {
        id: 'rf-1',
        rfNumber: 'RF000001',
        rfTemplateId: 'template-1',
        rfTemplate: mockRFTemplate,
      };

      prismaService.requestForm.count.mockResolvedValue(0);
      prismaService.requestForm.create.mockResolvedValue(expectedRF);

      const result = await service.create(createDto, 'user-1');

      expect(result.rfTemplateId).toBe('template-1');
      expect(result.rfTemplate).toEqual(mockRFTemplate);
    });
  });

  describe('branch-to-branch request validation', () => {
    it('should create inter-branch request successfully', async () => {
      const createDto: CreateRequestFormDto = {
        title: 'Inter-branch Material Request',
        fromBranchId: 'branch-1', // Requesting branch
        toBranchId: 'branch-2', // Supplying branch
        requiredDate: '2025-06-15',
        reason: 'Stock shortage in requesting branch',
        items: [
          {
            itemId: 'item-1',
            requestedQty: 100,
            remarks: 'Transfer from main warehouse',
          },
        ],
      };

      const expectedRF = {
        id: 'rf-1',
        rfNumber: 'RF000001',
        fromBranchId: 'branch-1',
        toBranchId: 'branch-2',
        fromBranch: mockFromBranch,
        toBranch: mockToBranch,
      };

      prismaService.requestForm.count.mockResolvedValue(0);
      prismaService.requestForm.create.mockResolvedValue(expectedRF);

      const result = await service.create(createDto, 'user-1');

      expect(result.fromBranchId).toBe('branch-1');
      expect(result.toBranchId).toBe('branch-2');
      expect(result.fromBranch).toEqual(mockFromBranch);
      expect(result.toBranch).toEqual(mockToBranch);
    });
  });
});
