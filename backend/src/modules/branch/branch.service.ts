import { PrismaService } from '@app/prisma.service';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateBranchDto } from './dto/create-branch.dto';
import { QueryBranchDto } from './dto/query-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}
  /**
   * Get branches with optional pagination and search
   * If no pagination params provided, returns all branches
   */ async findAll(query: QueryBranchDto, companyId: string) {
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

    // Build where clause with company isolation
    const where: Prisma.BranchWhereInput = {
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
      ];
    }

    // If pagination params are provided, use pagination    // Handle paginated queries (both page and limit provided)
    if (page && limit) {
      const pageNum = Number(page);
      const limitNum = Number(limit);
      const skip = (pageNum - 1) * limitNum;

      const [branches, total] = await Promise.all([
        this.prisma.branch.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: [{ name: 'asc' }, { code: 'asc' }],
        }),
        this.prisma.branch.count({ where }),
      ]);

      return {
        data: branches,
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      };
    }

    // Handle non-paginated queries (with optional limit)
    const queryOptions: {
      where: Prisma.BranchWhereInput;
      orderBy: Prisma.BranchOrderByWithRelationInput[];
      take?: number;
    } = {
      where,
      orderBy: [{ name: 'asc' }, { code: 'asc' }],
    };

    // Add limit if provided (for performance in non-paginated queries)
    if (limit) {
      queryOptions.take = Number(limit);
    }

    const branches = await this.prisma.branch.findMany(queryOptions);

    return branches;
  }
  /**
   * Get a single branch by ID
   */
  async findOne(id: string, companyId: string) {
    const branch = await this.prisma.branch.findFirst({
      where: {
        id,
        companyId, // Add company isolation
      },
    });

    if (!branch) {
      throw new NotFoundException(`Branch with id ${id} not found`);
    }

    return branch;
  }

  /**
   * Get branches for a specific user (user's branch only)
   */
  async findUserBranches(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userBranches: {
          include: {
            branch: true,
          },
          where: {
            isActive: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    return user.userBranches.map((ub) => ub.branch);
  }

  /**
   * Create a new branch
   */
  async create(createBranchDto: CreateBranchDto, companyId: string) {
    try {
      const branch = await this.prisma.branch.create({
        data: {
          name: createBranchDto.name,
          code: createBranchDto.code,
          address: createBranchDto.address,
          phone: createBranchDto.phone,
          email: createBranchDto.email,
          isActive: createBranchDto.isActive ?? true,
          companyId, // Add company isolation
        },
      });

      return branch;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('A branch with this code already exists');
        }
      }
      throw error;
    }
  }

  /**
   * Update an existing branch
   */
  async update(id: string, updateBranchDto: UpdateBranchDto, companyId: string) {
    // Check if branch exists and belongs to company
    const existingBranch = await this.prisma.branch.findFirst({
      where: {
        id,
        companyId, // Add company isolation
      },
    });

    if (!existingBranch) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }

    try {
      const branch = await this.prisma.branch.update({
        where: { id },
        data: {
          ...(updateBranchDto.name && { name: updateBranchDto.name }),
          ...(updateBranchDto.code && { code: updateBranchDto.code }),
          ...(updateBranchDto.address !== undefined && { address: updateBranchDto.address }),
          ...(updateBranchDto.phone !== undefined && { phone: updateBranchDto.phone }),
          ...(updateBranchDto.email !== undefined && { email: updateBranchDto.email }),
          ...(updateBranchDto.isActive !== undefined && { isActive: updateBranchDto.isActive }),
        },
      });

      return branch;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('A branch with this code already exists');
        }
      }
      throw error;
    }
  }

  /**
   * Remove (soft delete) a branch
   */
  async remove(id: string, companyId: string) {
    // Check if branch exists and belongs to company
    const existingBranch = await this.prisma.branch.findFirst({
      where: {
        id,
        companyId, // Add company isolation
      },
    });

    if (!existingBranch) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }

    // Check if branch has dependent records
    const hasReferences = await this.checkBranchReferences(id);
    if (hasReferences) {
      throw new BadRequestException(
        'Cannot delete branch. It has associated purchase requests, purchase orders, or other records. Please remove them first or use soft delete.'
      );
    }

    // Soft delete: mark as inactive
    await this.prisma.branch.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Branch soft deleted successfully' };
  }

  /**
   * Hard delete a branch (permanently remove from database)
   * WARNING: This action cannot be undone
   */
  async hardDelete(id: string, companyId: string): Promise<void> {
    // Check if branch exists and belongs to company
    const existingBranch = await this.prisma.branch.findFirst({
      where: {
        id,
        companyId, // Add company isolation
      },
    });

    if (!existingBranch) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }

    // Check if branch has any references
    const hasReferences = await this.checkBranchReferences(id);

    if (hasReferences) {
      throw new BadRequestException(
        'Cannot hard delete branch. It has associated purchase requests, purchase orders, or other records. Please remove them first.'
      );
    }

    // Hard delete the branch
    await this.prisma.branch.delete({
      where: { id },
    });
  }

  /**
   * Check if branch has any references in other tables
   */
  private async checkBranchReferences(branchId: string): Promise<boolean> {
    const [
      stockCount,
      purchaseRequestsCount,
      purchaseOrdersCount,
      requestFormsFromCount,
      requestFormsToCount,
      materialRequisitionsFromCount,
      materialRequisitionsToCount,
      goodsReceiptsCount,
      manufacturingListsCount,
    ] = await Promise.all([
      this.prisma.stock.count({ where: { branchId } }),
      this.prisma.purchaseRequest.count({ where: { branchId } }),
      this.prisma.purchaseOrder.count({ where: { branchId } }),
      this.prisma.requestForm.count({ where: { fromBranchId: branchId } }),
      this.prisma.requestForm.count({ where: { toBranchId: branchId } }),
      this.prisma.materialRequisition.count({ where: { fromBranchId: branchId } }),
      this.prisma.materialRequisition.count({ where: { toBranchId: branchId } }),
      this.prisma.goodsReceipt.count({ where: { branchId } }),
      this.prisma.manufacturingList.count({ where: { branchId } }),
    ]);

    return (
      stockCount > 0 ||
      purchaseRequestsCount > 0 ||
      purchaseOrdersCount > 0 ||
      requestFormsFromCount > 0 ||
      requestFormsToCount > 0 ||
      materialRequisitionsFromCount > 0 ||
      materialRequisitionsToCount > 0 ||
      goodsReceiptsCount > 0 ||
      manufacturingListsCount > 0
    );
  }
}
