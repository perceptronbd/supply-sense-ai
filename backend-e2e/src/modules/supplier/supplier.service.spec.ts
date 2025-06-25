import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, Supplier } from '@prisma/client';
import { PrismaService } from '../../../../backend/src/app/prisma.service';
import { CreateSupplierDto } from '../../../../backend/src/modules/supplier/dto/create-supplier.dto';
import { QuerySupplierDto } from '../../../../backend/src/modules/supplier/dto/query-supplier.dto';
import { UpdateSupplierDto } from '../../../../backend/src/modules/supplier/dto/update-supplier.dto';
import { SupplierService } from '../../../../backend/src/modules/supplier/supplier.service';

// Mock PrismaService
const mockPrismaService = {
  supplier: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  itemSupplier: {
    count: jest.fn(),
  },
  purchaseOrder: {
    count: jest.fn(),
  },
};

describe('SupplierService', () => {
  let service: SupplierService;
  let prismaService: typeof mockPrismaService;

  const mockSupplier: Supplier = {
    id: 'supplier-1',
    name: 'Test Supplier',
    code: 'SUP001',
    contactPerson: 'John Doe',
    email: 'john@testsupplier.com',
    phone: '+1-555-1234',
    address: '123 Test Street',
    averageLeadTime: 7,
    isActive: true,
    companyId: 'company-1',
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  };

  const mockSupplierWithRelations = {
    ...mockSupplier,
    items: [
      {
        id: 'item-supplier-1',
        itemId: 'item-1',
        supplierId: 'supplier-1',
        unitPrice: new Prisma.Decimal('25.50'),
        minOrderQty: new Prisma.Decimal('10'),
        leadTimeDays: 7,
        isPreferred: true,
        isActive: true,
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
        item: {
          id: 'item-1',
          name: 'Test Item',
          sku: 'ITEM001',
          description: 'Test item description',
          mainUnit: 'PCS',
          buyingUnit: 'PCS',
          transferUnit: 'PCS',
          usingUnit: 'PCS',
          buyingToMainRate: new Prisma.Decimal('1'),
          transferToMainRate: new Prisma.Decimal('1'),
          usingToMainRate: new Prisma.Decimal('1'),
          safetyStockLevel: new Prisma.Decimal('50'),
          reorderLevel: new Prisma.Decimal('100'),
          isActive: true,
          createdAt: new Date('2025-01-01T00:00:00.000Z'),
          updatedAt: new Date('2025-01-01T00:00:00.000Z'),
        },
      },
    ],
    purchaseOrders: [
      {
        id: 'po-1',
        poNumber: 'PO000001',
        status: 'DRAFT' as const,
        orderDate: new Date('2025-01-15T00:00:00.000Z'),
        totalAmount: new Prisma.Decimal('1275.00'),
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SupplierService>(SupplierService);
    prismaService = module.get(PrismaService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all active suppliers without pagination', async () => {
      const mockSuppliers: Supplier[] = [mockSupplier];
      prismaService.supplier.findMany.mockResolvedValue(mockSuppliers);

      const result = await service.findAll('company-1');

      expect(prismaService.supplier.findMany).toHaveBeenCalledWith({
        where: { isActive: true, companyId: 'company-1' },
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual({
        data: mockSuppliers,
        pagination: null,
      });
    });

    it('should return paginated suppliers with search', async () => {
      const mockSuppliers: Supplier[] = [mockSupplier];
      const query: QuerySupplierDto = {
        search: 'Test',
        page: 1,
        limit: 10,
      };

      prismaService.supplier.findMany.mockResolvedValue(mockSuppliers);
      prismaService.supplier.count.mockResolvedValue(1);

      const result = await service.findAll('company-1', query);

      expect(prismaService.supplier.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          companyId: 'company-1',
          OR: [
            { name: { contains: 'Test', mode: 'insensitive' } },
            { code: { contains: 'Test', mode: 'insensitive' } },
            { contactPerson: { contains: 'Test', mode: 'insensitive' } },
          ],
        },
        skip: 0,
        take: 10,
        orderBy: { name: 'asc' },
      });
      expect(prismaService.supplier.count).toHaveBeenCalledWith({
        where: {
          isActive: true,
          companyId: 'company-1',
          OR: [
            { name: { contains: 'Test', mode: 'insensitive' } },
            { code: { contains: 'Test', mode: 'insensitive' } },
            { contactPerson: { contains: 'Test', mode: 'insensitive' } },
          ],
        },
      });
      expect(result).toEqual({
        data: mockSuppliers,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1,
        },
      });
    });

    it('should include inactive suppliers when requested', async () => {
      const query: QuerySupplierDto = { includeInactive: true };
      const mockSuppliers: Supplier[] = [mockSupplier];
      prismaService.supplier.findMany.mockResolvedValue(mockSuppliers);

      await service.findAll('company-1', query);

      expect(prismaService.supplier.findMany).toHaveBeenCalledWith({
        where: { companyId: 'company-1' },
        orderBy: { name: 'asc' },
      });
    });

    it('should throw error when page is provided without limit', async () => {
      const query: QuerySupplierDto = { page: 1 };

      await expect(service.findAll('company-1', query)).rejects.toThrow(
        new BadRequestException('Limit must be provided when page is specified')
      );
    });

    it('should throw error for invalid page number', async () => {
      const query: QuerySupplierDto = { page: 0, limit: 10 };

      await expect(service.findAll('company-1', query)).rejects.toThrow(
        new BadRequestException('Page must be greater than 0')
      );
    });

    it('should throw error for invalid limit', async () => {
      const query: QuerySupplierDto = { page: 1, limit: 0 };

      await expect(service.findAll('company-1', query)).rejects.toThrow(
        new BadRequestException('Limit must be greater than 0')
      );
    });
  });

  describe('findOne', () => {
    it('should return supplier with relations', async () => {
      prismaService.supplier.findUnique.mockResolvedValue(mockSupplierWithRelations);

      const result = await service.findOne('supplier-1', 'company-1');

      expect(prismaService.supplier.findUnique).toHaveBeenCalledWith({
        where: { id: 'supplier-1', companyId: 'company-1' },
        include: {
          items: {
            where: { isActive: true },
            include: {
              item: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                },
              },
            },
          },
          purchaseOrders: {
            select: {
              id: true,
              poNumber: true,
              status: true,
              orderDate: true,
              totalAmount: true,
            },
            orderBy: { orderDate: 'desc' },
            take: 5,
          },
        },
      });
      expect(result).toEqual(mockSupplierWithRelations);
    });

    it('should throw NotFoundException when supplier not found', async () => {
      prismaService.supplier.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent', 'company-1')).rejects.toThrow(
        new NotFoundException('Supplier not found')
      );
    });
  });

  describe('create', () => {
    it('should create supplier successfully', async () => {
      const createDto: CreateSupplierDto = {
        name: 'New Supplier',
        code: 'SUP002',
        contactPerson: 'Jane Doe',
        email: 'jane@newsupplier.com',
        phone: '+1-555-5678',
        address: '456 New Street',
        averageLeadTime: 10,
        isActive: true,
      };

      const expectedSupplier: Supplier = {
        id: 'new-supplier-id',
        name: createDto.name,
        code: createDto.code,
        contactPerson: createDto.contactPerson,
        email: createDto.email,
        phone: createDto.phone,
        address: createDto.address,
        averageLeadTime: createDto.averageLeadTime,
        isActive: createDto.isActive,
        companyId: 'company-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.supplier.create.mockResolvedValue(expectedSupplier);

      const result = await service.create(createDto, 'company-1');

      expect(prismaService.supplier.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          companyId: 'company-1',
        },
      });
      expect(result).toEqual(expectedSupplier);
    });

    it('should handle Prisma unique constraint error', async () => {
      const createDto: CreateSupplierDto = {
        name: 'Duplicate Supplier',
        code: 'SUP001', // Duplicate code
      };

      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '4.0.0',
        meta: { target: ['code'] },
      });

      prismaService.supplier.create.mockRejectedValue(prismaError);

      await expect(service.create(createDto, 'company-1')).rejects.toThrow(
        new ConflictException('Supplier with this code already exists')
      );
    });
  });

  describe('update', () => {
    it('should update supplier successfully', async () => {
      const updateDto: UpdateSupplierDto = {
        name: 'Updated Supplier',
        contactPerson: 'Updated John Test',
        averageLeadTime: 10,
      };

      const updatedSupplier: Supplier = {
        ...mockSupplier,
        ...updateDto,
        updatedAt: new Date(),
      };

      prismaService.supplier.findUnique.mockResolvedValue(mockSupplier);
      prismaService.supplier.update.mockResolvedValue(updatedSupplier);

      const result = await service.update('supplier-1', updateDto, 'company-1');

      expect(prismaService.supplier.findUnique).toHaveBeenCalledWith({
        where: { id: 'supplier-1', companyId: 'company-1' },
      });
      expect(prismaService.supplier.update).toHaveBeenCalledWith({
        where: { id: 'supplier-1' },
        data: updateDto,
      });
      expect(result).toEqual(updatedSupplier);
    });

    it('should throw NotFoundException when supplier not found for update', async () => {
      const updateDto: UpdateSupplierDto = { name: 'Updated Name' };

      prismaService.supplier.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent', updateDto, 'company-1')).rejects.toThrow(
        new NotFoundException('Supplier not found')
      );
    });

    it('should handle Prisma unique constraint error on update', async () => {
      const updateDto: UpdateSupplierDto = { code: 'EXISTING-CODE' };
      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '4.0.0',
        meta: { target: ['code'] },
      });

      prismaService.supplier.findUnique.mockResolvedValue(mockSupplier);
      prismaService.supplier.update.mockRejectedValue(prismaError);

      await expect(service.update('supplier-1', updateDto, 'company-1')).rejects.toThrow(
        new ConflictException('Supplier with this code already exists')
      );
    });
  });

  describe('remove (soft delete)', () => {
    it('should soft delete supplier when no active references exist', async () => {
      const softDeletedSupplier: Supplier = {
        ...mockSupplier,
        isActive: false,
        updatedAt: new Date(),
      };

      prismaService.supplier.findUnique.mockResolvedValue(mockSupplier);
      prismaService.itemSupplier.count.mockResolvedValue(0);
      prismaService.purchaseOrder.count.mockResolvedValue(0);
      prismaService.supplier.update.mockResolvedValue(softDeletedSupplier);

      const result = await service.remove('supplier-1', 'company-1');

      expect(prismaService.supplier.findUnique).toHaveBeenCalledWith({
        where: { id: 'supplier-1', companyId: 'company-1' },
      });
      expect(prismaService.itemSupplier.count).toHaveBeenCalledWith({
        where: { supplierId: 'supplier-1', isActive: true },
      });
      expect(prismaService.purchaseOrder.count).toHaveBeenCalledWith({
        where: {
          supplierId: 'supplier-1',
          status: { in: ['DRAFT', 'SENT_TO_SUPPLIER', 'CONFIRMED'] },
        },
      });
      expect(prismaService.supplier.update).toHaveBeenCalledWith({
        where: { id: 'supplier-1' },
        data: { isActive: false },
      });
      expect(result).toEqual(softDeletedSupplier);
    });

    it('should throw NotFoundException when supplier not found for soft delete', async () => {
      prismaService.supplier.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent', 'company-1')).rejects.toThrow(
        new NotFoundException('Supplier not found')
      );
    });

    it('should throw BadRequestException when supplier has active item references', async () => {
      prismaService.supplier.findUnique.mockResolvedValue(mockSupplier);
      prismaService.itemSupplier.count.mockResolvedValue(1); // Has active references

      await expect(service.remove('supplier-1', 'company-1')).rejects.toThrow(
        new BadRequestException('Cannot delete supplier with active item references')
      );
    });

    it('should throw BadRequestException when supplier has active purchase order references', async () => {
      prismaService.supplier.findUnique.mockResolvedValue(mockSupplier);
      prismaService.itemSupplier.count.mockResolvedValue(0);
      prismaService.purchaseOrder.count.mockResolvedValue(1); // Has active purchase orders

      await expect(service.remove('supplier-1', 'company-1')).rejects.toThrow(
        new BadRequestException('Cannot delete supplier with active purchase order references')
      );
    });
  });

  describe('hardDelete', () => {
    it('should hard delete supplier when no references exist', async () => {
      prismaService.supplier.findUnique.mockResolvedValue(mockSupplier);
      prismaService.itemSupplier.count.mockResolvedValue(0);
      prismaService.purchaseOrder.count.mockResolvedValue(0);
      prismaService.supplier.delete.mockResolvedValue(mockSupplier);

      await service.hardDelete('supplier-1', 'company-1');

      expect(prismaService.supplier.findUnique).toHaveBeenCalledWith({
        where: { id: 'supplier-1', companyId: 'company-1' },
      });
      expect(prismaService.itemSupplier.count).toHaveBeenCalledWith({
        where: { supplierId: 'supplier-1' },
      });
      expect(prismaService.purchaseOrder.count).toHaveBeenCalledWith({
        where: { supplierId: 'supplier-1' },
      });
      expect(prismaService.supplier.delete).toHaveBeenCalledWith({
        where: { id: 'supplier-1' },
      });
    });

    it('should throw NotFoundException when supplier not found for hard delete', async () => {
      prismaService.supplier.findUnique.mockResolvedValue(null);

      await expect(service.hardDelete('non-existent', 'company-1')).rejects.toThrow(
        new NotFoundException('Supplier not found')
      );
    });

    it('should throw BadRequestException when supplier has existing references', async () => {
      prismaService.supplier.findUnique.mockResolvedValue(mockSupplier);
      prismaService.itemSupplier.count.mockResolvedValue(1); // Has references
      prismaService.purchaseOrder.count.mockResolvedValue(0);

      await expect(service.hardDelete('supplier-1', 'company-1')).rejects.toThrow(
        new BadRequestException('Cannot delete supplier with existing references')
      );
    });
  });
});
