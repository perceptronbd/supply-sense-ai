import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../app/prisma.service';
import { QueryItemDto } from './dto/query-item.dto';

@Injectable()
export class ItemService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get items with optional pagination, search, and stock information
   * If no pagination params provided, returns all items
   */
  async findAll(query: QueryItemDto) {
    const { search, branchId, page, limit, includeInactive = false, includeStock = false } = query; // Build where clause
    const where: Prisma.ItemWhereInput = {};

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
          sku: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    } // Build include clause for stock if requested
    const include: Prisma.ItemInclude = {};
    if (includeStock && branchId) {
      include.stock = {
        where: {
          branchId: branchId,
        },
        select: {
          quantity: true,
          reservedQty: true,
          availableQty: true,
          averageCost: true,
          lastCost: true,
        },
      };
    }

    // If pagination params are provided, use pagination
    if (page && limit) {
      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        this.prisma.item.findMany({
          where,
          include,
          skip,
          take: limit,
          orderBy: [{ name: 'asc' }, { sku: 'asc' }],
        }),
        this.prisma.item.count({ where }),
      ]);

      // Transform stock data for single branch response
      const transformedItems = items.map((item) => ({
        ...item,
        stock: includeStock && item.stock?.[0] ? item.stock[0] : undefined,
      }));

      return {
        data: transformedItems,
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

    // If no pagination params, return all items
    const items = await this.prisma.item.findMany({
      where,
      include,
      orderBy: [{ name: 'asc' }, { sku: 'asc' }],
    });

    // Transform stock data for single branch response
    const transformedItems = items.map((item) => ({
      ...item,
      stock: includeStock && item.stock?.[0] ? item.stock[0] : undefined,
    }));

    return {
      data: transformedItems,
      pagination: null,
    };
  }
  /**
   * Get a single item by ID with optional stock information
   */
  async findOne(id: string, branchId?: string, includeStock = false) {
    const include: Prisma.ItemInclude = {};
    if (includeStock && branchId) {
      include.stock = {
        where: {
          branchId: branchId,
        },
        select: {
          quantity: true,
          reservedQty: true,
          availableQty: true,
          averageCost: true,
          lastCost: true,
        },
      };
    }

    const item = await this.prisma.item.findUnique({
      where: { id },
      include,
    });

    if (!item) {
      throw new Error(`Item with id ${id} not found`);
    }

    // Transform stock data for single branch response
    return {
      ...item,
      stock: includeStock && item.stock?.[0] ? item.stock[0] : undefined,
    };
  }

  /**
   * Get items for a specific branch with stock information
   */
  async findByBranch(branchId: string, query: Omit<QueryItemDto, 'branchId'>) {
    return this.findAll({
      ...query,
      branchId,
      includeStock: true,
    });
  }
  /**
   * Search items by name or SKU (simplified search for dropdowns)
   */
  async searchItems(searchTerm: string, branchId?: string, limit = 20) {
    const where: Prisma.ItemWhereInput = {
      isActive: true,
      OR: [
        {
          name: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        {
          sku: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
      ],
    };

    // First get items with basic info
    const items = await this.prisma.item.findMany({
      where,
      take: limit,
      orderBy: [{ name: 'asc' }, { sku: 'asc' }],
      select: {
        id: true,
        name: true,
        sku: true,
        mainUnit: true,
        buyingUnit: true,
        transferUnit: true,
        usingUnit: true,
      },
    });

    // If branchId is provided, get stock information separately
    if (branchId && items.length > 0) {
      const itemIds = items.map((item) => item.id);
      const stocks = await this.prisma.stock.findMany({
        where: {
          itemId: { in: itemIds },
          branchId: branchId,
        },
        select: {
          itemId: true,
          quantity: true,
          availableQty: true,
        },
      });

      // Create a map for quick lookup
      const stockMap = new Map(stocks.map((stock) => [stock.itemId, stock]));

      // Combine items with stock data
      return items.map((item) => ({
        ...item,
        stock: stockMap.get(item.id) || null,
      }));
    }

    // Return items without stock information
    return items.map((item) => ({
      ...item,
      stock: null,
    }));
  }
}
