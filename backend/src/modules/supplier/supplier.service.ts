import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../app/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { QuerySupplierDto } from './dto/query-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SupplierService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  /**
   * Get suppliers with optional pagination and search
   */
  async findAll(companyId: string, query: QuerySupplierDto = {}) {
    const { search, includeInactive = false } = query;

    // Ensure page and limit are properly converted to numbers
    let page = query.page;
    let limit = query.limit;

    if (typeof page === 'string') {
      page = Number.parseInt(page, 10);
    }

    if (typeof limit === 'string') {
      limit = Number.parseInt(limit, 10);
    }

    // Validate page and limit individually first
    if (page !== undefined && page < 1) {
      throw new BadRequestException('Page must be greater than 0');
    }

    if (limit !== undefined && limit < 1) {
      throw new BadRequestException('Limit must be greater than 0');
    }

    // Then validate if both are provided when one is specified
    if (page && !limit) {
      throw new BadRequestException('Limit must be provided when page is specified');
    }

    if (limit && !page) {
      throw new BadRequestException('Page must be provided when limit is specified');
    }

    if (limit && limit > 100) {
      throw new BadRequestException('Limit must be between 1 and 100');
    }

    // Build where clause with company isolation
    const where: Prisma.SupplierWhereInput = {
      companyId, // Add company isolation
    };

    // Filter by active status unless includeInactive is true
    if (!includeInactive) {
      where.isActive = true;
    }

    // Add search filter
    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          code: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          contactPerson: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // If pagination is requested
    if (page && limit) {
      const skip = (page - 1) * limit;

      const [suppliers, total] = await Promise.all([
        this.prisma.supplier.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            name: 'asc',
          },
        }),
        this.prisma.supplier.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      // Return suppliers with pagination metadata - the ResponseInterceptor will format it properly
      return {
        data: suppliers,
        page,
        limit,
        total,
        pages: totalPages,
      };
    }

    // No pagination - return all suppliers
    const suppliers = await this.prisma.supplier.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
    });

    return suppliers;
  }

  /**
   * Get a single supplier by ID
   */
  async findOne(id: string, companyId: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: {
        id,
        companyId, // Add company isolation
      },
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
          take: 5, // Last 5 purchase orders
        },
      },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    return supplier;
  }

  /**
   * Create a new supplier
   */
  async create(createSupplierDto: CreateSupplierDto, companyId: string) {
    // Validate required fields (only name and code are required)
    if (!createSupplierDto.name?.trim()) {
      throw new BadRequestException('Name is required');
    }

    if (!createSupplierDto.code?.trim()) {
      throw new BadRequestException('Code is required');
    }

    try {
      const supplier = await this.prisma.supplier.create({
        data: {
          name: createSupplierDto.name.trim(),
          code: createSupplierDto.code.trim(),
          contactPerson: createSupplierDto.contactPerson?.trim() || null,
          email: createSupplierDto.email?.trim() || null,
          phone: createSupplierDto.phone?.trim() || null,
          address: createSupplierDto.address?.trim() || null,
          averageLeadTime: createSupplierDto.averageLeadTime || null,
          isActive: createSupplierDto.isActive ?? true,
          companyId, // Add company isolation
        },
      });

      return supplier;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Supplier with this code already exists');
        }
      }
      throw error;
    }
  }

  /**
   * Update a supplier
   */
  async update(id: string, updateSupplierDto: UpdateSupplierDto, companyId: string) {
    // Check if supplier exists and belongs to company
    const existingSupplier = await this.prisma.supplier.findUnique({
      where: {
        id,
        companyId, // Add company isolation
      },
    });

    if (!existingSupplier) {
      throw new NotFoundException('Supplier not found');
    }

    try {
      const updatedSupplier = await this.prisma.supplier.update({
        where: { id },
        data: {
          name: updateSupplierDto.name?.trim(),
          code: updateSupplierDto.code?.trim(),
          contactPerson: updateSupplierDto.contactPerson?.trim(),
          email: updateSupplierDto.email?.trim(),
          phone: updateSupplierDto.phone?.trim(),
          address: updateSupplierDto.address?.trim(),
          averageLeadTime: updateSupplierDto.averageLeadTime,
          isActive: updateSupplierDto.isActive,
        },
      });

      return updatedSupplier;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Supplier with this code already exists');
        }
      }
      throw error;
    }
  }

  /**
   * Soft delete a supplier
   */
  async remove(id: string, companyId: string) {
    // Check if supplier exists and belongs to company
    const existingSupplier = await this.prisma.supplier.findUnique({
      where: {
        id,
        companyId, // Add company isolation
      },
    });

    if (!existingSupplier) {
      throw new NotFoundException('Supplier not found');
    }

    // Check for active references
    const [itemReferences, orderReferences] = await Promise.all([
      this.prisma.itemSupplier.count({
        where: { supplierId: id, isActive: true },
      }),
      this.prisma.purchaseOrder.count({
        where: { supplierId: id, status: { in: ['DRAFT', 'SENT_TO_SUPPLIER', 'CONFIRMED'] } },
      }),
    ]);

    if (itemReferences > 0) {
      throw new BadRequestException('Cannot delete supplier with active item references');
    }

    if (orderReferences > 0) {
      throw new BadRequestException('Cannot delete supplier with active purchase order references');
    }

    // Soft delete by setting isActive to false
    const softDeletedSupplier = await this.prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });

    return softDeletedSupplier;
  }

  /**
   * Hard delete a supplier (permanent)
   */
  async hardDelete(id: string, companyId: string): Promise<void> {
    // Check if supplier exists and belongs to company
    const existingSupplier = await this.prisma.supplier.findUnique({
      where: {
        id,
        companyId, // Add company isolation
      },
    });

    if (!existingSupplier) {
      throw new NotFoundException('Supplier not found');
    }

    // Check for any references before hard deletion
    const hasReferences = await this.checkSupplierReferences(id);

    if (hasReferences) {
      throw new BadRequestException('Cannot delete supplier with existing references');
    }

    // Permanently delete
    await this.prisma.supplier.delete({
      where: { id },
    });
  }

  /**
   * Check if supplier has any references in the system
   */
  private async checkSupplierReferences(supplierId: string): Promise<boolean> {
    const [itemReferences, orderReferences] = await Promise.all([
      this.prisma.itemSupplier.count({
        where: { supplierId },
      }),
      this.prisma.purchaseOrder.count({
        where: { supplierId },
      }),
    ]);

    return itemReferences > 0 || orderReferences > 0;
  }
}
