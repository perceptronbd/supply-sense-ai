import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../app/prisma.service';
import { QueryBranchDto } from './dto/query-branch.dto';

@Injectable()
export class BranchService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get branches with optional pagination and search
   * If no pagination params provided, returns all branches
   */
  async findAll(query: QueryBranchDto) {
    const { search, page, limit, includeInactive = false } = query; // Build where clause
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

    // If pagination params are provided, use pagination
    if (page && limit) {
      const skip = (page - 1) * limit;

      const [branches, total] = await Promise.all([
        this.prisma.branch.findMany({
          where,
          skip,
          take: limit,
          orderBy: [{ name: 'asc' }, { code: 'asc' }],
        }),
        this.prisma.branch.count({ where }),
      ]);

      return {
        data: branches,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    }

    // If no pagination params, return all branches
    const branches = await this.prisma.branch.findMany({
      where,
      orderBy: [{ name: 'asc' }, { code: 'asc' }],
    });

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
      throw new Error(`Branch with id ${id} not found`);
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
      throw new Error(`User with id ${userId} not found`);
    }

    return {
      data: [user.branch],
      pagination: null,
    };
  }
}
