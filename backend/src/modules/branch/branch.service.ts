import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../app/prisma.service';
import { QueryBranchDto } from './dto/query-branch.dto';

@Injectable()
export class BranchService {
  constructor(private readonly prisma: PrismaService) {}
  /**
   * Get branches with optional pagination and search
   * If no pagination params provided, returns all branches
   */ async findAll(query: QueryBranchDto) {
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
    const where: Prisma.BranchWhereInput = {};

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
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
          hasNext: pageNum * limitNum < total,
          hasPrev: pageNum > 1,
        },
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

    return {
      data: branches,
      pagination: null,
    };
  }
  /**
   * Get a single branch by ID
   */
  async findOne(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
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
      include: { branch: true },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    return {
      data: [user.branch],
      pagination: null as {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
      } | null,
    };
  }
}
