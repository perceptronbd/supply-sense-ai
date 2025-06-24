import { PrismaService } from '@app/prisma.service';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, Supplier } from '@prisma/client';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { QuerySupplierDto } from './dto/query-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SupplierService } from './supplier.service';

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

    // Reset all mocks
    jest.clearAllMocks();
  });
  describe('findAll', () => {
    it('should return all active suppliers without pagination', async () => {
      const mockSuppliers: Supplier[] = [mockSupplier];
      mockPrismaService.supplier.findMany.mockResolvedValue(mockSuppliers);

      const result = await service.findAll();

      expect(mockPrismaService.supplier.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
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

      mockPrismaService.supplier.findMany.mockResolvedValue(mockSuppliers);
      mockPrismaService.supplier.count.mockResolvedValue(1);

      const result = await service.findAll(query);

      expect(mockPrismaService.supplier.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
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
      expect(mockPrismaService.supplier.count).toHaveBeenCalledWith({
        where: {
          isActive: true,
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
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      });
    });

    it('should include inactive suppliers when requested', async () => {
      const query: QuerySupplierDto = { includeInactive: true };
      const mockSuppliers: Supplier[] = [mockSupplier];
      mockPrismaService.supplier.findMany.mockResolvedValue(mockSuppliers);

      await service.findAll(query);

      expect(mockPrismaService.supplier.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { name: 'asc' },
      });
    });

    it('should throw error when page is provided without limit', async () => {
      const query: QuerySupplierDto = { page: 1 };

      await expect(service.findAll(query)).rejects.toThrow(
        new BadRequestException('Limit must be provided when page is specified')
      );
    });

    it('should throw error for invalid page number', async () => {
      const query: QuerySupplierDto = { page: 0, limit: 10 };

      await expect(service.findAll(query)).rejects.toThrow(
        new BadRequestException('Page must be greater than 0')
      );
    });

    it('should throw error for invalid limit', async () => {
      const query: QuerySupplierDto = { page: 1, limit: 0 };

      await expect(service.findAll(query)).rejects.toThrow(
        new BadRequestException('Limit must be between 1 and 100')
      );
    });
  });

  describe('findOne', () => {
    it('should return supplier with relations', async () => {
      mockPrismaService.supplier.findUnique.mockResolvedValue(mockSupplierWithRelations);

      const result = await service.findOne('supplier-1');

      expect(mockPrismaService.supplier.findUnique).toHaveBeenCalledWith({
        where: { id: 'supplier-1' },
        include: {
          items: {
            include: {
              item: true,
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
            orderBy: {
              orderDate: 'desc',
            },
            take: 5,
          },
        },
      });
      expect(result).toEqual(mockSupplierWithRelations);
    });

    it('should throw NotFoundException when supplier not found', async () => {
      mockPrismaService.supplier.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        new NotFoundException('Supplier with id non-existent not found')
      );
    });
  });
  describe('create', () => {
    it('should create new supplier successfully', async () => {
      const createDto: CreateSupplierDto = {
        name: 'New Supplier',
        code: 'SUP002',
        contactPerson: 'Jane Smith',
        email: 'jane@newsupplier.com',
        phone: '+1-555-5678',
        address: '456 New Street',
        averageLeadTime: 5,
        isActive: true,
      };

      const expectedSupplier: Supplier = {
        id: 'supplier-2',
        name: createDto.name,
        code: createDto.code,
        contactPerson: createDto.contactPerson || null,
        email: createDto.email || null,
        phone: createDto.phone || null,
        address: createDto.address || null,
        averageLeadTime: createDto.averageLeadTime || null,
        isActive: createDto.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrismaService.supplier.create as jest.Mock).mockResolvedValue(expectedSupplier);

      const result = await service.create(createDto);

      expect(mockPrismaService.supplier.create).toHaveBeenCalledWith({
        data: {
          name: createDto.name,
          code: createDto.code,
          contactPerson: createDto.contactPerson,
          email: createDto.email,
          phone: createDto.phone,
          address: createDto.address,
          averageLeadTime: createDto.averageLeadTime,
          isActive: createDto.isActive,
        },
      });
      expect(result).toEqual(expectedSupplier);
    });

    it('should throw ConflictException for duplicate code', async () => {
      const createDto: CreateSupplierDto = {
        name: 'Duplicate Supplier',
        code: 'SUP001', // Already exists
      };

      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.0.0',
      });

      prismaService.supplier.create.mockRejectedValue(prismaError);

      await expect(service.create(createDto)).rejects.toThrow(
        new ConflictException('A supplier with this code already exists')
      );
    });
  });

  describe('update', () => {
    it('should update supplier successfully', async () => {
      const updateDto: UpdateSupplierDto = {
        name: 'Updated Supplier Name',
        contactPerson: 'Updated Contact',
      };

      const updatedSupplier: Supplier = {
        ...mockSupplier,
        name: updateDto.name || mockSupplier.name,
        contactPerson: updateDto.contactPerson || mockSupplier.contactPerson,
        updatedAt: new Date(),
      };

      prismaService.supplier.findUnique.mockResolvedValue(mockSupplier);
      prismaService.supplier.update.mockResolvedValue(updatedSupplier);

      const result = await service.update('supplier-1', updateDto);

      expect(prismaService.supplier.findUnique).toHaveBeenCalledWith({
        where: { id: 'supplier-1' },
      });
      expect(prismaService.supplier.update).toHaveBeenCalledWith({
        where: { id: 'supplier-1' },
        data: {
          name: updateDto.name,
          contactPerson: updateDto.contactPerson,
        },
      });
      expect(result).toEqual(updatedSupplier);
    });

    it('should throw NotFoundException when supplier not found', async () => {
      prismaService.supplier.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent', {})).rejects.toThrow(
        new NotFoundException('Supplier with ID non-existent not found')
      );
    });

    it('should throw ConflictException for duplicate code on update', async () => {
      const updateDto: UpdateSupplierDto = { code: 'EXISTING_CODE' };

      prismaService.supplier.findUnique.mockResolvedValue(mockSupplier);

      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.0.0',
      });

      prismaService.supplier.update.mockRejectedValue(prismaError);

      await expect(service.update('supplier-1', updateDto)).rejects.toThrow(
        new ConflictException('A supplier with this code already exists')
      );
    });
  });

  describe('remove', () => {
    it('should soft delete supplier when no active references', async () => {
      const softDeletedSupplier: Supplier = {
        ...mockSupplier,
        isActive: false,
        updatedAt: new Date(),
      };

      prismaService.supplier.findUnique.mockResolvedValue(mockSupplier);
      prismaService.itemSupplier.count.mockResolvedValue(0);
      prismaService.purchaseOrder.count.mockResolvedValue(0);
      prismaService.supplier.update.mockResolvedValue(softDeletedSupplier);

      const result = await service.remove('supplier-1');

      expect(prismaService.supplier.findUnique).toHaveBeenCalledWith({
        where: { id: 'supplier-1' },
      });
      expect(prismaService.itemSupplier.count).toHaveBeenCalledWith({
        where: { supplierId: 'supplier-1' },
      });
      expect(prismaService.purchaseOrder.count).toHaveBeenCalledWith({
        where: { supplierId: 'supplier-1' },
      });
      expect(prismaService.supplier.update).toHaveBeenCalledWith({
        where: { id: 'supplier-1' },
        data: { isActive: false },
      });
      expect(result).toEqual(softDeletedSupplier);
    });

    it('should throw NotFoundException when supplier not found', async () => {
      prismaService.supplier.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        new NotFoundException('Supplier with ID non-existent not found')
      );
    });

    it('should throw BadRequestException when supplier has active references', async () => {
      prismaService.supplier.findUnique.mockResolvedValue(mockSupplier);
      prismaService.itemSupplier.count.mockResolvedValue(1); // Has active references

      await expect(service.remove('supplier-1')).rejects.toThrow(
        new BadRequestException('Cannot delete supplier as it has active records')
      );
    });
  });

  describe('hardDelete', () => {
    it('should permanently delete supplier when no references exist', async () => {
      prismaService.supplier.findUnique.mockResolvedValue(mockSupplier);
      prismaService.itemSupplier.count.mockResolvedValue(0);
      prismaService.purchaseOrder.count.mockResolvedValue(0);
      prismaService.supplier.delete.mockResolvedValue(mockSupplier);

      await service.hardDelete('supplier-1');

      expect(prismaService.supplier.delete).toHaveBeenCalledWith({
        where: { id: 'supplier-1' },
      });
    });

    it('should throw NotFoundException when supplier not found', async () => {
      prismaService.supplier.findUnique.mockResolvedValue(null);

      await expect(service.hardDelete('non-existent')).rejects.toThrow(
        new NotFoundException('Supplier with ID non-existent not found')
      );
    });

    it('should throw BadRequestException when supplier has references', async () => {
      prismaService.supplier.findUnique.mockResolvedValue(mockSupplier);
      prismaService.itemSupplier.count.mockResolvedValue(0);
      prismaService.purchaseOrder.count.mockResolvedValue(1); // Has references

      await expect(service.hardDelete('supplier-1')).rejects.toThrow(
        new BadRequestException(
          'Cannot permanently delete supplier as it has references in the system'
        )
      );
    });
  });
});
