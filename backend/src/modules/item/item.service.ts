import { PrismaService } from '@app/prisma.service';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { QueryItemDto } from './dto/query-item.dto';

type ItemWithOptionalStock = Prisma.ItemGetPayload<Record<string, never>> & {
  stock?: Array<{
    quantity: Prisma.Decimal;
    reservedQty: Prisma.Decimal;
    availableQty: Prisma.Decimal;
    averageCost: Prisma.Decimal;
    lastCost: Prisma.Decimal;
  }>;
};

type TransformedItem = Omit<
  Prisma.ItemGetPayload<Record<string, never>>,
  | 'buyingToMainRate'
  | 'transferToMainRate'
  | 'usingToMainRate'
  | 'safetyStockLevel'
  | 'reorderLevel'
> & {
  buyingToMainRate: number | null;
  transferToMainRate: number | null;
  usingToMainRate: number | null;
  safetyStockLevel: number | null;
  reorderLevel: number | null;
  stock?:
    | {
        quantity: number;
        reservedQty: number;
        availableQty: number;
        averageCost: number | null;
        lastCost: number | null;
      }
    | undefined;
};

@Injectable()
export class ItemService {
  constructor(private readonly prisma: PrismaService) {}
  /**
   * Transform items with proper Decimal to number conversion
   */
  private transformItems(items: ItemWithOptionalStock[], includeStock: boolean): TransformedItem[] {
    return items.map((item) => this.transformSingleItem(item, includeStock));
  }

  /**
   * Transform a single item with Decimal to number conversion
   */
  private transformSingleItem(item: ItemWithOptionalStock, includeStock: boolean): TransformedItem {
    const transformed: TransformedItem = {
      id: item.id,
      name: item.name,
      sku: item.sku,
      description: item.description,
      mainUnit: item.mainUnit,
      buyingUnit: item.buyingUnit,
      transferUnit: item.transferUnit,
      usingUnit: item.usingUnit,
      isActive: item.isActive,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      buyingToMainRate: item.buyingToMainRate ? Number(item.buyingToMainRate) : null,
      transferToMainRate: item.transferToMainRate ? Number(item.transferToMainRate) : null,
      usingToMainRate: item.usingToMainRate ? Number(item.usingToMainRate) : null,
      safetyStockLevel: item.safetyStockLevel ? Number(item.safetyStockLevel) : null,
      reorderLevel: item.reorderLevel ? Number(item.reorderLevel) : null,
      stock: undefined, // Initialize with proper type
    };
    if (includeStock && item.stock?.[0]) {
      const stockData = item.stock[0];
      const quantity = Number(stockData.quantity);
      const reservedQty = Number(stockData.reservedQty || 0);

      transformed.stock = {
        quantity,
        reservedQty,
        availableQty: Math.max(0, quantity - reservedQty), // Ensure non-negative
        averageCost: stockData.averageCost ? Number(stockData.averageCost) : null,
        lastCost: stockData.lastCost ? Number(stockData.lastCost) : null,
      };
    }

    return transformed;
  }

  /**
   * Build query options for finding items
   */
  private buildQueryOptions(query: QueryItemDto) {
    const { search, branchId, includeInactive = false, includeStock = false } = query;

    const where: Prisma.ItemWhereInput = {};
    if (!includeInactive) {
      where.isActive = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const include: Prisma.ItemInclude = {};
    if (includeStock && branchId) {
      include.stock = {
        where: { branchId },
        select: {
          quantity: true,
          reservedQty: true,
          availableQty: true,
          averageCost: true,
          lastCost: true,
        },
      };
    }

    return { where, include };
  }

  /**
   * Get items with optional pagination, search, and stock information
   */ async findAll(query: QueryItemDto) {
    const { page, limit, includeStock = false } = query;

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
    const { where, include } = this.buildQueryOptions(query);

    // Handle paginated queries (both page and limit provided)
    if (page && limit) {
      const pageNum = Number(page);
      const limitNum = Number(limit);
      const skip = (pageNum - 1) * limitNum;

      const [items, total] = await Promise.all([
        this.prisma.item.findMany({
          where,
          include,
          skip,
          take: limitNum,
          orderBy: [{ name: 'asc' }, { sku: 'asc' }],
        }),
        this.prisma.item.count({ where }),
      ]);

      const transformedItems = this.transformItems(items, includeStock);

      return {
        data: transformedItems,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
          hasNext: pageNum * limitNum < total,
          hasPrev: pageNum > 1,
        },
      };
    } // Handle non-paginated queries (with optional limit)
    const queryOptions: {
      where: Prisma.ItemWhereInput;
      include: Prisma.ItemInclude;
      orderBy: Prisma.ItemOrderByWithRelationInput[];
      take?: number;
    } = {
      where,
      include,
      orderBy: [{ name: 'asc' }, { sku: 'asc' }],
    };

    // Add limit if provided (for performance in non-paginated queries)
    if (limit) {
      queryOptions.take = Number(limit);
    }

    const items = await this.prisma.item.findMany(queryOptions);

    const transformedItems = this.transformItems(items, includeStock);

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
        where: { branchId },
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
      throw new NotFoundException(`Item with id ${id} not found`);
    }
    return this.transformSingleItem(item, includeStock);
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
    // Validate inputs
    if (!searchTerm) {
      throw new BadRequestException('Search term is required');
    }

    // Ensure limit is a valid number
    const validLimit = Number(limit) || 20;
    if (validLimit < 1 || validLimit > 100) {
      throw new BadRequestException('Limit must be between 1 and 100');
    }

    const where: Prisma.ItemWhereInput = {
      isActive: true,
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { sku: { contains: searchTerm, mode: 'insensitive' } },
      ],
    };

    const items = await this.prisma.item.findMany({
      where,
      take: validLimit,
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

    if (branchId && items.length > 0) {
      const itemIds = items.map((item) => item.id);
      const stocks = await this.prisma.stock.findMany({
        where: {
          itemId: { in: itemIds },
          branchId,
        },
        select: {
          itemId: true,
          quantity: true,
          reservedQty: true,
          availableQty: true,
        },
      });
      const stockMap = new Map(stocks.map((stock) => [stock.itemId, stock]));
      return items.map((item) => {
        const stock = stockMap.get(item.id);
        if (stock) {
          const quantity = Number(stock.quantity);
          const reservedQty = Number(stock.reservedQty || 0);
          return {
            ...item,
            stock: {
              ...stock,
              quantity,
              reservedQty,
              availableQty: Math.max(0, quantity - reservedQty), // Calculate properly
            },
          };
        }
        return {
          ...item,
          stock: null,
        };
      });
    }

    return items.map((item) => ({
      ...item,
      stock: null as null,
    }));
  }
}
