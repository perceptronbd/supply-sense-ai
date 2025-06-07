import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../app/prisma.service';
import type { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { PurchaseOrderService } from './purchase-order.service';

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

const mockSupplier = {
  id: 'supplier-1',
  name: 'ABC Supplier',
  code: 'ABC',
  contactEmail: 'supplier@abc.com',
};

const mockItem = {
  id: 'item-1',
  name: 'Raw Material A',
  code: 'RM001',
  buyingUnit: 'kg',
  mainUnit: 'g',
  buyingToMainRate: new Decimal('1000'),
};

const mockPurchaseRequest = {
  id: 'pr-1',
  prNumber: 'PR000001',
  status: 'APPROVED',
  branchId: 'branch-1',
  requiredDate: new Date('2025-06-15'),
  items: [
    {
      id: 'pr-item-1',
      itemId: 'item-1',
      requestedQty: new Decimal('100'),
      estimatedPrice: new Decimal('25.50'),
      requiredDate: new Date('2025-06-15'),
      remarks: 'Urgent requirement',
      item: mockItem,
    },
  ],
  branch: mockBranch,
};

describe('PurchaseOrderService', () => {
  let service: PurchaseOrderService;

  const mockPrismaService = {
    purchaseOrder: {
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    purchaseRequest: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseOrderService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PurchaseOrderService>(PurchaseOrderService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create PO with sequential number generation and total calculations', async () => {
      const createDto: CreatePurchaseOrderDto = {
        title: 'Purchase Order for Raw Materials',
        prId: 'pr-1',
        supplierId: 'supplier-1',
        expectedDeliveryDate: '2025-06-15',
        paymentTerms: 'NET 30',
        deliveryTerms: 'FOB Destination',
        branchId: 'branch-1',
        notes: 'Urgent order',
        items: [
          {
            itemId: 'item-1',
            orderedQty: 100,
            unitPrice: 25.5,
            deliveryDate: '2025-06-15',
            remarks: 'Quality check required',
          },
          {
            itemId: 'item-2',
            orderedQty: 50,
            unitPrice: 15.75,
            deliveryDate: '2025-06-16',
            remarks: 'Standard quality',
          },
        ],
      };

      const expectedSubtotal = new Decimal('100').mul('25.50').add(new Decimal('50').mul('15.75'));
      const expectedTotal = expectedSubtotal; // No tax calculation implemented yet

      const expectedPO = {
        id: 'po-1',
        poNumber: 'PO000001',
        title: createDto.title,
        prId: 'pr-1',
        supplierId: 'supplier-1',
        expectedDeliveryDate: new Date('2025-06-15'),
        paymentTerms: 'NET 30',
        deliveryTerms: 'FOB Destination',
        branchId: 'branch-1',
        notes: 'Urgent order',
        subtotal: expectedSubtotal,
        taxAmount: new Decimal('0'),
        totalAmount: expectedTotal,
        status: 'DRAFT',
        items: [
          {
            id: 'po-item-1',
            itemId: 'item-1',
            orderedQty: new Decimal('100'),
            unitPrice: new Decimal('25.50'),
            totalAmount: new Decimal('2550'),
            deliveryDate: new Date('2025-06-15'),
            remarks: 'Quality check required',
            item: mockItem,
          },
        ],
        supplier: mockSupplier,
        branch: mockBranch,
        createdBy: mockUser,
        purchaseRequest: mockPurchaseRequest,
      };

      mockPrismaService.purchaseOrder.count.mockResolvedValue(0);
      mockPrismaService.purchaseOrder.create.mockResolvedValue(expectedPO);

      const result = await service.create(createDto, 'user-1');

      expect(mockPrismaService.purchaseOrder.count).toHaveBeenCalled();
      expect(mockPrismaService.purchaseOrder.create).toHaveBeenCalledWith({
        data: {
          poNumber: 'PO000001',
          title: createDto.title,
          prId: 'pr-1',
          supplierId: 'supplier-1',
          expectedDeliveryDate: new Date('2025-06-15'),
          paymentTerms: 'NET 30',
          deliveryTerms: 'FOB Destination',
          branchId: 'branch-1',
          createdById: 'user-1',
          notes: 'Urgent order',
          subtotal: expectedSubtotal,
          taxAmount: new Decimal('0'),
          totalAmount: expectedTotal,
          status: 'DRAFT',
          items: {
            create: [
              {
                itemId: 'item-1',
                orderedQty: new Decimal('100'),
                unitPrice: new Decimal('25.50'),
                totalAmount: new Decimal('2550'),
                deliveryDate: new Date('2025-06-15'),
                remarks: 'Quality check required',
              },
              {
                itemId: 'item-2',
                orderedQty: new Decimal('50'),
                unitPrice: new Decimal('15.75'),
                totalAmount: new Decimal('787.5'),
                deliveryDate: new Date('2025-06-16'),
                remarks: 'Standard quality',
              },
            ],
          },
        },
        include: expect.any(Object),
      });
      expect(result).toEqual(expectedPO);
    });

    it('should generate sequential PO numbers', async () => {
      const createDto: CreatePurchaseOrderDto = {
        title: 'Second PO',
        supplierId: 'supplier-1',
        expectedDeliveryDate: '2025-06-15',
        branchId: 'branch-1',
        items: [],
      };

      const expectedPO = {
        id: 'po-2',
        poNumber: 'PO000002',
        totalAmount: new Decimal('0'),
      };

      mockPrismaService.purchaseOrder.count.mockResolvedValue(1);
      mockPrismaService.purchaseOrder.create.mockResolvedValue(expectedPO);

      const result = await service.create(createDto, 'user-1');

      expect(result.poNumber).toBe('PO000002');
    });
  });

  describe('findAll', () => {
    it('should find all POs with branch filtering', async () => {
      const mockPOs = [
        { id: 'po-1', poNumber: 'PO000001', branchId: 'branch-1' },
        { id: 'po-2', poNumber: 'PO000002', branchId: 'branch-1' },
      ];

      mockPrismaService.purchaseOrder.findMany.mockResolvedValue(mockPOs);

      const result = await service.findAll('branch-1');

      expect(mockPrismaService.purchaseOrder.findMany).toHaveBeenCalledWith({
        where: { branchId: 'branch-1' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockPOs);
    });

    it('should find all POs without filtering', async () => {
      const mockPOs = [
        { id: 'po-1', poNumber: 'PO000001' },
        { id: 'po-2', poNumber: 'PO000002' },
      ];

      mockPrismaService.purchaseOrder.findMany.mockResolvedValue(mockPOs);

      await service.findAll();

      expect(mockPrismaService.purchaseOrder.findMany).toHaveBeenCalledWith({
        where: undefined,
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should find PO by ID', async () => {
      const mockPO = {
        id: 'po-1',
        poNumber: 'PO000001',
        items: [],
        goodsReceipts: [],
      };

      mockPrismaService.purchaseOrder.findUnique.mockResolvedValue(mockPO);

      const result = await service.findOne('po-1');

      expect(mockPrismaService.purchaseOrder.findUnique).toHaveBeenCalledWith({
        where: { id: 'po-1' },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockPO);
    });

    it('should throw NotFoundException when PO not found', async () => {
      mockPrismaService.purchaseOrder.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        new NotFoundException('Purchase Order with ID non-existent not found')
      );
    });
  });

  describe('update', () => {
    it('should update PO with recalculated totals', async () => {
      const mockPO = {
        id: 'po-1',
        status: 'DRAFT',
        items: [],
      };

      const updateDto = {
        title: 'Updated PO Title',
        items: [
          {
            itemId: 'item-1',
            orderedQty: 200,
            unitPrice: 30.0,
            deliveryDate: '2025-06-20',
            remarks: 'Updated item',
          },
        ],
      };

      const expectedSubtotal = new Decimal('200').mul('30.00');
      const updatedPO = {
        ...mockPO,
        title: 'Updated PO Title',
        subtotal: expectedSubtotal,
        totalAmount: expectedSubtotal,
      };

      mockPrismaService.purchaseOrder.findUnique.mockResolvedValue(mockPO);
      mockPrismaService.purchaseOrder.update.mockResolvedValue(updatedPO);

      const result = await service.update('po-1', updateDto);

      expect(mockPrismaService.purchaseOrder.update).toHaveBeenCalledWith({
        where: { id: 'po-1' },
        data: {
          title: 'Updated PO Title',
          prId: undefined,
          supplierId: undefined,
          expectedDeliveryDate: undefined,
          paymentTerms: undefined,
          deliveryTerms: undefined,
          branchId: undefined,
          notes: undefined,
          subtotal: expectedSubtotal,
          taxAmount: new Decimal('0'),
          totalAmount: expectedSubtotal,
          items: {
            deleteMany: { poId: 'po-1' },
            create: [
              {
                itemId: 'item-1',
                orderedQty: new Decimal('200'),
                unitPrice: new Decimal('30'),
                totalAmount: new Decimal('6000'),
                deliveryDate: new Date('2025-06-20'),
                remarks: 'Updated item',
              },
            ],
          },
        },
        include: expect.any(Object),
      });
      expect(result).toEqual(updatedPO);
    });

    it('should not allow updates to non-draft PO', async () => {
      const mockPO = {
        id: 'po-1',
        status: 'SENT_TO_SUPPLIER',
      };

      mockPrismaService.purchaseOrder.findUnique.mockResolvedValue(mockPO);

      await expect(service.update('po-1', { title: 'Updated' })).rejects.toThrow(
        'Can only update Purchase Orders in DRAFT status'
      );
    });
  });

  describe('remove', () => {
    it('should delete PO in DRAFT status', async () => {
      const mockPO = {
        id: 'po-1',
        status: 'DRAFT',
      };

      mockPrismaService.purchaseOrder.findUnique.mockResolvedValue(mockPO);
      mockPrismaService.purchaseOrder.delete.mockResolvedValue(mockPO);

      const result = await service.remove('po-1');

      expect(mockPrismaService.purchaseOrder.delete).toHaveBeenCalledWith({
        where: { id: 'po-1' },
      });
      expect(result).toEqual(mockPO);
    });

    it('should not allow deletion of non-draft PO', async () => {
      const mockPO = {
        id: 'po-1',
        status: 'CONFIRMED',
      };

      mockPrismaService.purchaseOrder.findUnique.mockResolvedValue(mockPO);

      await expect(service.remove('po-1')).rejects.toThrow(
        'Can only delete Purchase Orders in DRAFT status'
      );
    });
  });

  describe('status workflow', () => {
    it('should send PO to supplier', async () => {
      const mockPO = {
        id: 'po-1',
        status: 'DRAFT',
      };

      const sentPO = { ...mockPO, status: 'SENT_TO_SUPPLIER' };

      mockPrismaService.purchaseOrder.findUnique.mockResolvedValue(mockPO);
      mockPrismaService.purchaseOrder.update.mockResolvedValue(sentPO);

      const result = await service.sendToSupplier('po-1');

      expect(mockPrismaService.purchaseOrder.update).toHaveBeenCalledWith({
        where: { id: 'po-1' },
        data: { status: 'SENT_TO_SUPPLIER' },
        include: expect.any(Object),
      });
      expect(result.status).toBe('SENT_TO_SUPPLIER');
    });

    it('should not send non-draft PO to supplier', async () => {
      const mockPO = {
        id: 'po-1',
        status: 'CONFIRMED',
      };

      mockPrismaService.purchaseOrder.findUnique.mockResolvedValue(mockPO);

      await expect(service.sendToSupplier('po-1')).rejects.toThrow(
        'Can only send Purchase Orders in DRAFT status'
      );
    });

    it('should confirm PO from SENT_TO_SUPPLIER status', async () => {
      const mockPO = {
        id: 'po-1',
        status: 'SENT_TO_SUPPLIER',
      };

      const confirmedPO = {
        ...mockPO,
        status: 'CONFIRMED',
        confirmedDate: expect.any(Date),
      };

      mockPrismaService.purchaseOrder.findUnique.mockResolvedValue(mockPO);
      mockPrismaService.purchaseOrder.update.mockResolvedValue(confirmedPO);

      const result = await service.confirm('po-1');

      expect(mockPrismaService.purchaseOrder.update).toHaveBeenCalledWith({
        where: { id: 'po-1' },
        data: {
          status: 'CONFIRMED',
          confirmedDate: expect.any(Date),
        },
        include: expect.any(Object),
      });
      expect(result.status).toBe('CONFIRMED');
    });

    it('should not confirm PO not in SENT_TO_SUPPLIER status', async () => {
      const mockPO = {
        id: 'po-1',
        status: 'DRAFT',
      };

      mockPrismaService.purchaseOrder.findUnique.mockResolvedValue(mockPO);

      await expect(service.confirm('po-1')).rejects.toThrow(
        'Can only confirm Purchase Orders in SENT_TO_SUPPLIER status'
      );
    });

    it('should close confirmed PO', async () => {
      const mockPO = {
        id: 'po-1',
        status: 'CONFIRMED',
      };

      const closedPO = { ...mockPO, status: 'CLOSED' };

      mockPrismaService.purchaseOrder.findUnique.mockResolvedValue(mockPO);
      mockPrismaService.purchaseOrder.update.mockResolvedValue(closedPO);

      const result = await service.close('po-1');

      expect(mockPrismaService.purchaseOrder.update).toHaveBeenCalledWith({
        where: { id: 'po-1' },
        data: { status: 'CLOSED' },
        include: expect.any(Object),
      });
      expect(result.status).toBe('CLOSED');
    });

    it('should not close non-confirmed PO', async () => {
      const mockPO = {
        id: 'po-1',
        status: 'DRAFT',
      };

      mockPrismaService.purchaseOrder.findUnique.mockResolvedValue(mockPO);

      await expect(service.close('po-1')).rejects.toThrow(
        'Can only close Purchase Orders in CONFIRMED status'
      );
    });

    it('should cancel PO if not CLOSED or CANCELLED', async () => {
      const mockPO = {
        id: 'po-1',
        status: 'SENT_TO_SUPPLIER',
      };

      const cancelledPO = { ...mockPO, status: 'CANCELLED' };

      mockPrismaService.purchaseOrder.findUnique.mockResolvedValue(mockPO);
      mockPrismaService.purchaseOrder.update.mockResolvedValue(cancelledPO);

      const result = await service.cancel('po-1');

      expect(result.status).toBe('CANCELLED');
    });

    it('should not cancel already CLOSED or CANCELLED PO', async () => {
      const mockPO = {
        id: 'po-1',
        status: 'CLOSED',
      };

      mockPrismaService.purchaseOrder.findUnique.mockResolvedValue(mockPO);

      await expect(service.cancel('po-1')).rejects.toThrow(
        'Cannot cancel Purchase Orders that are already CLOSED or CANCELLED'
      );
    });
  });

  describe('createFromPR', () => {
    it('should create PO from approved PR', async () => {
      const expectedPO = {
        id: 'po-1',
        poNumber: 'PO000001',
        title: 'PO for PR000001',
        prId: 'pr-1',
        supplierId: 'supplier-1',
        branchId: 'branch-1',
      };

      const updatedPR = {
        ...mockPurchaseRequest,
        status: 'CONVERTED_TO_PO',
      };

      mockPrismaService.purchaseRequest.findUnique.mockResolvedValue(mockPurchaseRequest);
      mockPrismaService.purchaseOrder.count.mockResolvedValue(0);
      mockPrismaService.purchaseOrder.create.mockResolvedValue(expectedPO);
      mockPrismaService.purchaseRequest.update.mockResolvedValue(updatedPR);

      const result = await service.createFromPR('pr-1', 'supplier-1', 'user-1');

      expect(mockPrismaService.purchaseRequest.findUnique).toHaveBeenCalledWith({
        where: { id: 'pr-1' },
        include: expect.any(Object),
      });
      expect(mockPrismaService.purchaseRequest.update).toHaveBeenCalledWith({
        where: { id: 'pr-1' },
        data: { status: 'CONVERTED_TO_PO' },
      });
      expect(result).toEqual(expectedPO);
    });

    it('should not create PO from non-approved PR', async () => {
      const draftPR = { ...mockPurchaseRequest, status: 'DRAFT' };

      mockPrismaService.purchaseRequest.findUnique.mockResolvedValue(draftPR);

      await expect(service.createFromPR('pr-1', 'supplier-1', 'user-1')).rejects.toThrow(
        'Can only create PO from APPROVED Purchase Requests'
      );
    });

    it('should throw error for non-existent PR', async () => {
      mockPrismaService.purchaseRequest.findUnique.mockResolvedValue(null);

      await expect(service.createFromPR('non-existent', 'supplier-1', 'user-1')).rejects.toThrow(
        new NotFoundException('Purchase Request with ID non-existent not found')
      );
    });
  });

  describe('total calculations', () => {
    it('should calculate correct subtotal for multiple items', async () => {
      const createDto: CreatePurchaseOrderDto = {
        title: 'Multi-item PO',
        supplierId: 'supplier-1',
        expectedDeliveryDate: '2025-06-15',
        branchId: 'branch-1',
        items: [
          {
            itemId: 'item-1',
            orderedQty: 100,
            unitPrice: 25.5,
            deliveryDate: '2025-06-15',
          },
          {
            itemId: 'item-2',
            orderedQty: 50,
            unitPrice: 15.75,
            deliveryDate: '2025-06-16',
          },
          {
            itemId: 'item-3',
            orderedQty: 25,
            unitPrice: 45.8,
            deliveryDate: '2025-06-17',
          },
        ],
      };

      // Calculate expected totals
      const item1Total = new Decimal('100').mul('25.50'); // 2550
      const item2Total = new Decimal('50').mul('15.75'); // 787.5
      const item3Total = new Decimal('25').mul('45.80'); // 1145
      const expectedSubtotal = item1Total.add(item2Total).add(item3Total); // 4482.5

      const expectedPO = {
        id: 'po-1',
        subtotal: expectedSubtotal,
        taxAmount: new Decimal('0'),
        totalAmount: expectedSubtotal,
      };

      mockPrismaService.purchaseOrder.count.mockResolvedValue(0);
      mockPrismaService.purchaseOrder.create.mockResolvedValue(expectedPO);

      const result = await service.create(createDto, 'user-1');

      expect(result.subtotal).toEqual(expectedSubtotal);
      expect(result.totalAmount).toEqual(expectedSubtotal);
    });
  });
});
