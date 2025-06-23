import { PrismaService } from '@app/prisma.service';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { QuerySupplierDto } from './dto/query-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SupplierService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  /**
   * Get suppliers with optional pagination and search
   */
  async findAll(query: QuerySupplierDto = {}) {
    const { search, page, limit, includeInactive = false } = query;

    // Only validate pagination constraints if page is provided
    if (page && !limit) {
      throw new BadRequestException('Limit must be provided when page is specified');
    }

    if (page && page < 1) {
      throw new BadRequestException('Page must be greater than 0');
    }

    if (limit && (limit < 1 || limit > 100)) {
      throw new BadRequestException('Limit must be between 1 and 100');
    }

    // Build where clause
    const where: Prisma.SupplierWhereInput = {};

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
  async findOne(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
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
          take: 5, // Last 5 purchase orders
        },
      },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier with id ${id} not found`);
    }

    return supplier;
  }

  /**
   * Create a new supplier
   */
  async create(createSupplierDto: CreateSupplierDto) {
    try {
      const supplier = await this.prisma.supplier.create({
        data: {
          name: createSupplierDto.name,
          code: createSupplierDto.code,
          contactPerson: createSupplierDto.contactPerson,
          email: createSupplierDto.email,
          phone: createSupplierDto.phone,
          address: createSupplierDto.address,
          averageLeadTime: createSupplierDto.averageLeadTime,
          isActive: createSupplierDto.isActive ?? true,
        },
      });

      return supplier;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('A supplier with this code already exists');
        }
      }
      throw error;
    }
  }

  /**
   * Update an existing supplier
   */
  async update(id: string, updateSupplierDto: UpdateSupplierDto) {
    // Check if supplier exists
    const existingSupplier = await this.prisma.supplier.findUnique({
      where: { id },
    });

    if (!existingSupplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }

    try {
      const supplier = await this.prisma.supplier.update({
        where: { id },
        data: {
          ...(updateSupplierDto.name && { name: updateSupplierDto.name }),
          ...(updateSupplierDto.code && { code: updateSupplierDto.code }),
          ...(updateSupplierDto.contactPerson !== undefined && {
            contactPerson: updateSupplierDto.contactPerson,
          }),
          ...(updateSupplierDto.email !== undefined && { email: updateSupplierDto.email }),
          ...(updateSupplierDto.phone !== undefined && { phone: updateSupplierDto.phone }),
          ...(updateSupplierDto.address !== undefined && { address: updateSupplierDto.address }),
          ...(updateSupplierDto.averageLeadTime !== undefined && {
            averageLeadTime: updateSupplierDto.averageLeadTime,
          }),
          ...(updateSupplierDto.isActive !== undefined && { isActive: updateSupplierDto.isActive }),
        },
      });

      return supplier;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('A supplier with this code already exists');
        }
      }
      throw error;
    }
  }

  /**
   * Soft delete a supplier (set isActive to false)
   */
  async remove(id: string) {
    // Check if supplier exists
    const existingSupplier = await this.prisma.supplier.findUnique({
      where: { id },
    });

    if (!existingSupplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }

    // Check if supplier has active references
    const hasActiveReferences = await this.checkSupplierReferences(id);

    if (hasActiveReferences) {
      throw new BadRequestException('Cannot delete supplier as it has active records');
    }

    const supplier = await this.prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });

    return supplier;
  }

  /**
   * Hard delete a supplier (only if no references exist)
   */
  async hardDelete(id: string): Promise<void> {
    // Check if supplier exists
    const existingSupplier = await this.prisma.supplier.findUnique({
      where: { id },
    });

    if (!existingSupplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }

    // Check if supplier has any references
    const hasReferences = await this.checkSupplierReferences(id);

    if (hasReferences) {
      throw new BadRequestException(
        'Cannot permanently delete supplier as it has references in the system'
      );
    }

    await this.prisma.supplier.delete({
      where: { id },
    });
  }

  /**
   * Check if supplier has any references in other tables
   */
  private async checkSupplierReferences(supplierId: string): Promise<boolean> {
    const [itemSupplierCount, purchaseOrdersCount] = await Promise.all([
      this.prisma.itemSupplier.count({ where: { supplierId } }),
      this.prisma.purchaseOrder.count({ where: { supplierId } }),
    ]);

    return itemSupplierCount > 0 || purchaseOrdersCount > 0;
  }
}
