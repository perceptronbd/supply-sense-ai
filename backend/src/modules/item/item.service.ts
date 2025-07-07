import { PrismaService } from '@app/prisma.service';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateItemDto } from './dto/create-item.dto';
import { QueryItemDto } from './dto/query-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

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

export interface UnitConversion {
  fromMainUnit: (quantity: number, unitType: 'buying' | 'transfer' | 'using') => number;
  toMainUnit: (quantity: number, unitType: 'buying' | 'transfer' | 'using') => number;
}

@Injectable()
export class ItemService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /**
   * Unit Conversion Utilities (FR-2, FR-3)
   * Provides real-time conversion between different units and main unit
   */

  /**
   * Create unit conversion helper for an item
   */
  createUnitConverter(item: TransformedItem): UnitConversion {
    return {
      fromMainUnit: (quantity: number, unitType: 'buying' | 'transfer' | 'using'): number => {
        const rate = this.getConversionRate(item, unitType);
        return quantity / rate;
      },
      toMainUnit: (quantity: number, unitType: 'buying' | 'transfer' | 'using'): number => {
        const rate = this.getConversionRate(item, unitType);
        return quantity * rate;
      },
    };
  }

  /**
   * Get conversion rate for specific unit type
   */
  private getConversionRate(
    item: TransformedItem,
    unitType: 'buying' | 'transfer' | 'using'
  ): number {
    switch (unitType) {
      case 'buying':
        return item.buyingToMainRate || 1;
      case 'transfer':
        return item.transferToMainRate || 1;
      case 'using':
        return item.usingToMainRate || 1;
      default:
        throw new BadRequestException(`Invalid unit type: ${unitType}`);
    }
  }

  /**
   * Convert quantity from one unit to main unit
   */
  async convertToMainUnit(
    itemId: string,
    companyId: string,
    quantity: number,
    unitType: 'buying' | 'transfer' | 'using'
  ): Promise<number> {
    const item = await this.findOne(itemId, companyId);
    const converter = this.createUnitConverter(item);
    return converter.toMainUnit(quantity, unitType);
  }

  /**
   * Convert quantity from main unit to specified unit
   */
  async convertFromMainUnit(
    itemId: string,
    companyId: string,
    quantity: number,
    unitType: 'buying' | 'transfer' | 'using'
  ): Promise<number> {
    const item = await this.findOne(itemId, companyId);
    const converter = this.createUnitConverter(item);
    return converter.fromMainUnit(quantity, unitType);
  }

  /**
   * Get item with unit conversion information
   */
  async getItemWithConversions(
    itemId: string,
    companyId: string,
    quantities?: {
      buying?: number;
      transfer?: number;
      using?: number;
    }
  ) {
    const item = await this.findOne(itemId, companyId);
    const converter = this.createUnitConverter(item);

    const conversions: {
      rates: {
        buyingToMain: number | null;
        transferToMain: number | null;
        usingToMain: number | null;
      };
      units: {
        main: string;
        buying: string | null;
        transfer: string | null;
        using: string | null;
      };
      conversions?: {
        buyingToMain?: number;
        transferToMain?: number;
        usingToMain?: number;
      };
    } = {
      rates: {
        buyingToMain: item.buyingToMainRate,
        transferToMain: item.transferToMainRate,
        usingToMain: item.usingToMainRate,
      },
      units: {
        main: item.mainUnit,
        buying: item.buyingUnit,
        transfer: item.transferUnit,
        using: item.usingUnit,
      },
    };

    // Add quantity conversions if provided
    if (quantities) {
      conversions.conversions = {
        ...(quantities.buying && {
          buyingToMain: converter.toMainUnit(quantities.buying, 'buying'),
        }),
        ...(quantities.transfer && {
          transferToMain: converter.toMainUnit(quantities.transfer, 'transfer'),
        }),
        ...(quantities.using && {
          usingToMain: converter.toMainUnit(quantities.using, 'using'),
        }),
      };
    }

    return {
      item,
      conversions,
    };
  }

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
      companyId: item.companyId, // Add missing companyId
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

    // Stock-level filters are handled in post-processing
    // const { belowSafetyStock, belowReorderLevel, outOfStock, lowStock } = query;

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

      // Note: Stock-level filters (belowSafetyStock, belowReorderLevel, etc.)
      // are applied in post-processing due to Prisma limitations with cross-model comparisons
    }

    return { where, include };
  }

  /**
   * Filter items based on stock levels (post-processing for AI monitoring - FR-9)
   */
  private filterByStockLevels(items: TransformedItem[], query: QueryItemDto): TransformedItem[] {
    const { belowSafetyStock, belowReorderLevel, outOfStock, lowStock } = query;

    if (!belowSafetyStock && !belowReorderLevel && !outOfStock && !lowStock) {
      return items;
    }

    return items.filter((item) => {
      if (!item.stock) return false;

      const { quantity, availableQty } = item.stock;
      const safetyStock = item.safetyStockLevel || 0;
      const reorderLevel = item.reorderLevel || 0;

      if (outOfStock) {
        return quantity <= 0 || availableQty <= 0;
      }

      if (belowSafetyStock) {
        return quantity < safetyStock;
      }

      if (belowReorderLevel) {
        return quantity < reorderLevel;
      }

      if (lowStock && safetyStock > 0) {
        return quantity < safetyStock * 0.2; // Below 20% of safety stock
      }

      return false;
    });
  }

  /**
   * Get items with optional pagination, search, and stock information
   */
  async findAll(query: QueryItemDto, companyId: string) {
    const { page, limit, includeStock = false } = query;

    this.validatePaginationParams(page, limit);

    const { where, include } = this.buildQueryOptions(query);
    where.companyId = companyId;

    if (page && limit) {
      return this.findAllPaginated(query, where, include, page, limit, includeStock);
    }

    return this.findAllUnpaginated(query, where, include, limit, includeStock);
  }

  /**
   * Validate pagination parameters
   */
  private validatePaginationParams(page?: number, limit?: number): void {
    if (page && !limit) {
      throw new BadRequestException('Limit must be provided when page is specified');
    }

    if (page && page < 1) {
      throw new BadRequestException('Page must be greater than 0');
    }

    if (limit && (limit < 1 || limit > 100)) {
      throw new BadRequestException('Limit must be between 1 and 100');
    }
  }

  /**
   * Handle paginated queries
   */
  private async findAllPaginated(
    query: QueryItemDto,
    where: Prisma.ItemWhereInput,
    include: Prisma.ItemInclude,
    page: number,
    limit: number,
    includeStock: boolean
  ) {
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    let [items, total] = await Promise.all([
      this.prisma.item.findMany({
        where,
        include,
        skip,
        take: limitNum,
        orderBy: [{ name: 'asc' }, { sku: 'asc' }],
      }),
      this.prisma.item.count({ where }),
    ]);

    let transformedItems = this.transformItems(items, includeStock);

    if (includeStock && query.branchId) {
      const originalLength = transformedItems.length;
      transformedItems = this.filterByStockLevels(transformedItems, query);

      if (transformedItems.length !== originalLength) {
        total = await this.getFilteredTotal(where, include, query, includeStock);
      }
    }

    return {
      data: transformedItems,
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    };
  }

  /**
   * Handle non-paginated queries
   */
  private async findAllUnpaginated(
    query: QueryItemDto,
    where: Prisma.ItemWhereInput,
    include: Prisma.ItemInclude,
    limit?: number,
    includeStock = false
  ) {
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

    if (limit) {
      queryOptions.take = Number(limit);
    }

    const items = await this.prisma.item.findMany(queryOptions);
    let transformedItems = this.transformItems(items, includeStock);

    if (includeStock && query.branchId) {
      transformedItems = this.filterByStockLevels(transformedItems, query);
    }

    return transformedItems;
  }

  /**
   * Get filtered total count for paginated results
   */
  private async getFilteredTotal(
    where: Prisma.ItemWhereInput,
    include: Prisma.ItemInclude,
    query: QueryItemDto,
    includeStock: boolean
  ): Promise<number> {
    const allItems = await this.prisma.item.findMany({ where, include });
    const allTransformed = this.transformItems(allItems, includeStock);
    const filteredAll = this.filterByStockLevels(allTransformed, query);
    return filteredAll.length;
  }

  /**
   * Get a single item by ID with optional stock information
   */
  async findOne(id: string, companyId: string, branchId?: string, includeStock = false) {
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

    const item = await this.prisma.item.findFirst({
      where: {
        id,
        companyId, // Add company isolation
      },
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
  async findByBranch(branchId: string, query: Omit<QueryItemDto, 'branchId'>, companyId: string) {
    return this.findAll(
      {
        ...query,
        branchId,
        includeStock: true,
      },
      companyId
    );
  }
  /**
   * Search items by name or SKU (simplified search for dropdowns)
   */
  async searchItems(searchTerm: string, companyId: string, branchId?: string, limit = 20) {
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
      companyId, // Add company isolation
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

  /**
   * Create a new item
   */
  async create(createItemDto: CreateItemDto, companyId: string): Promise<TransformedItem> {
    try {
      const item = await this.prisma.item.create({
        data: {
          name: createItemDto.name,
          sku: createItemDto.sku,
          description: createItemDto.description,
          mainUnit: createItemDto.mainUnit,
          buyingUnit: createItemDto.buyingUnit,
          transferUnit: createItemDto.transferUnit,
          usingUnit: createItemDto.usingUnit,
          buyingToMainRate: createItemDto.buyingToMainRate ?? 1,
          transferToMainRate: createItemDto.transferToMainRate ?? 1,
          usingToMainRate: createItemDto.usingToMainRate ?? 1,
          safetyStockLevel: createItemDto.safetyStockLevel ?? 0,
          reorderLevel: createItemDto.reorderLevel ?? 0,
          isActive: createItemDto.isActive ?? true,
          companyId, // Add company isolation
        },
      });

      return this.transformSingleItem(item, false);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('An item with this SKU already exists');
        }
      }
      throw error;
    }
  }

  /**
   * Update an existing item
   */
  async update(
    id: string,
    updateItemDto: UpdateItemDto,
    companyId: string
  ): Promise<TransformedItem> {
    // Check if item exists and belongs to company
    const existingItem = await this.prisma.item.findFirst({
      where: {
        id,
        companyId, // Add company isolation
      },
    });

    if (!existingItem) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }

    try {
      const updateData = this.buildUpdateData(updateItemDto);
      const item = await this.prisma.item.update({
        where: { id },
        data: updateData,
      });

      return this.transformSingleItem(item, false);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('An item with this SKU already exists');
        }
      }
      throw error;
    }
  }

  /**
   * Build update data object from DTO
   */
  private buildUpdateData(updateItemDto: UpdateItemDto) {
    return {
      ...(updateItemDto.name && { name: updateItemDto.name }),
      ...(updateItemDto.sku && { sku: updateItemDto.sku }),
      ...(updateItemDto.description !== undefined && {
        description: updateItemDto.description,
      }),
      ...(updateItemDto.mainUnit && { mainUnit: updateItemDto.mainUnit }),
      ...(updateItemDto.buyingUnit && { buyingUnit: updateItemDto.buyingUnit }),
      ...(updateItemDto.transferUnit && { transferUnit: updateItemDto.transferUnit }),
      ...(updateItemDto.usingUnit && { usingUnit: updateItemDto.usingUnit }),
      ...(updateItemDto.buyingToMainRate !== undefined && {
        buyingToMainRate: updateItemDto.buyingToMainRate,
      }),
      ...(updateItemDto.transferToMainRate !== undefined && {
        transferToMainRate: updateItemDto.transferToMainRate,
      }),
      ...(updateItemDto.usingToMainRate !== undefined && {
        usingToMainRate: updateItemDto.usingToMainRate,
      }),
      ...(updateItemDto.safetyStockLevel !== undefined && {
        safetyStockLevel: updateItemDto.safetyStockLevel,
      }),
      ...(updateItemDto.reorderLevel !== undefined && {
        reorderLevel: updateItemDto.reorderLevel,
      }),
      ...(updateItemDto.isActive !== undefined && { isActive: updateItemDto.isActive }),
    };
  }

  /**
   * Soft delete an item (set isActive to false)
   */
  async remove(id: string, companyId: string): Promise<TransformedItem> {
    // Check if item exists and belongs to company
    const existingItem = await this.prisma.item.findFirst({
      where: {
        id,
        companyId, // Add company isolation
      },
    });

    if (!existingItem) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }

    // Check if item is being used in any active records
    const hasActiveReferences = await this.checkItemReferences(id);

    if (hasActiveReferences) {
      throw new BadRequestException('Cannot delete item as it is being used in active records');
    }

    const item = await this.prisma.item.update({
      where: { id },
      data: { isActive: false },
    });

    return this.transformSingleItem(item, false);
  }

  /**
   * Hard delete an item (only if no references exist)
   */
  async hardDelete(id: string, companyId: string): Promise<void> {
    // Check if item exists and belongs to company
    const existingItem = await this.prisma.item.findFirst({
      where: {
        id,
        companyId, // Add company isolation
      },
    });

    if (!existingItem) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }

    // Check if item has any references
    const hasReferences = await this.checkItemReferences(id);

    if (hasReferences) {
      throw new BadRequestException(
        'Cannot permanently delete item as it has references in the system'
      );
    }

    await this.prisma.item.delete({
      where: { id },
    });
  }

  /**
   * Check if item has any references in other tables
   */
  private async checkItemReferences(itemId: string): Promise<boolean> {
    const [
      stockCount,
      supplierCount,
      prItemCount,
      poItemCount,
      rfItemCount,
      mrItemCount,
      grItemCount,
      formulaItemCount,
    ] = await Promise.all([
      this.prisma.stock.count({ where: { itemId } }),
      this.prisma.itemSupplier.count({ where: { itemId } }),
      this.prisma.pRItem.count({ where: { itemId } }),
      this.prisma.pOItem.count({ where: { itemId } }),
      this.prisma.rFItem.count({ where: { itemId } }),
      this.prisma.mRItem.count({ where: { itemId } }),
      this.prisma.gRItem.count({ where: { itemId } }),
      this.prisma.formulaItem.count({ where: { itemId } }),
    ]);

    return (
      stockCount > 0 ||
      supplierCount > 0 ||
      prItemCount > 0 ||
      poItemCount > 0 ||
      rfItemCount > 0 ||
      mrItemCount > 0 ||
      grItemCount > 0 ||
      formulaItemCount > 0
    );
  }
}
