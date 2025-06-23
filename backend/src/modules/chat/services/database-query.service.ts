import { PrismaService } from '@app/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { QueryContext } from '../interfaces/chat.interface';

interface QueryAnalysis {
  isSafe: boolean;
  queryType: string;
  risks?: string[];
  parameters?: Record<string, unknown>;
}

interface QueryResult {
  query: string;
  parameters: Record<string, unknown>;
  explanation: string;
}

@Injectable()
export class DatabaseQueryService {
  private readonly logger = new Logger(DatabaseQueryService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Interprets natural language queries and converts them to safe database queries
   */ async interpretQuery(
    naturalLanguageQuery: string,
    context: QueryContext
  ): Promise<{
    canExecute: boolean;
    query?: string;
    parameters?: Record<string, unknown>;
    queryType: string;
    explanation: string;
    risks?: string[];
  }> {
    try {
      // Analyze the query for intent and safety
      const analysis = await this.analyzeQueryIntent(naturalLanguageQuery, context);

      if (!analysis.isSafe) {
        return {
          canExecute: false,
          queryType: 'UNSAFE',
          explanation: 'Query contains potentially unsafe operations',
          risks: analysis.risks,
        };
      } // Generate the appropriate Prisma query based on intent
      const queryResult = await this.generatePrismaQuery(analysis, context);

      // Log the generated Prisma query
      this.logger.log('🔧 Generated Prisma Query:');
      this.logger.log(`Query Type: ${queryResult.query}`);
      this.logger.log('Parameters:', JSON.stringify(queryResult.parameters, null, 2));

      return {
        canExecute: true,
        query: queryResult.query,
        parameters: queryResult.parameters,
        queryType: analysis.queryType,
        explanation: queryResult.explanation,
      };
    } catch (error) {
      this.logger.error('Failed to interpret query:', error);
      return {
        canExecute: false,
        queryType: 'ERROR',
        explanation: 'Failed to process the query',
      };
    }
  }

  /**
   * Executes safe database queries with proper authorization
   */
  async executeQuery(
    queryType: string,
    parameters: Record<string, unknown>,
    context: QueryContext
  ): Promise<unknown> {
    try {
      // Verify user has permission to access requested data
      if (!this.hasPermission(queryType, context)) {
        throw new Error('Insufficient permissions for this query');
      }

      switch (queryType) {
        case 'PURCHASE_REQUESTS':
          return this.getPurchaseRequests(parameters, context);

        case 'PURCHASE_ORDERS':
          return this.getPurchaseOrders(parameters, context);

        case 'ITEMS':
          return this.getItems(parameters, context);

        case 'SUPPLIERS':
          return this.getSuppliers(parameters, context);

        case 'INVENTORY':
          return this.getInventoryData(parameters, context);

        case 'ANALYTICS':
          return this.getAnalyticsData(parameters, context);

        default:
          throw new Error(`Unsupported query type: ${queryType}`);
      }
    } catch (error) {
      this.logger.error('Failed to execute query:', error);
      throw error;
    }
  }
  private async analyzeQueryIntent(
    query: string,
    _context: QueryContext
  ): Promise<{
    isSafe: boolean;
    queryType: string;
    intent: string;
    entities: string[];
    risks?: string[];
  }> {
    const lowerQuery = query.toLowerCase();

    // Check for unsafe operations
    const safetyCheck = this.checkQuerySafety(query);
    if (!safetyCheck.isSafe) {
      return {
        isSafe: false,
        queryType: 'UNSAFE',
        intent: 'unsafe_operation',
        entities: [],
        risks: safetyCheck.risks,
      };
    }

    // Determine query type and entities
    const { queryType, entities } = this.determineQueryType(lowerQuery);
    const intent = this.determineIntent(lowerQuery);

    return {
      isSafe: true,
      queryType,
      intent,
      entities,
    };
  }
  private checkQuerySafety(query: string): { isSafe: boolean; risks: string[] } {
    const unsafePatterns = [
      /\bdelete\b|\bdrop\b|\btruncate\b|\balter\b|\bcreate\s+(table|database|schema|index|view)\b|\bupdate\b/i,
      /\bexec\b|\bexecute\b|\bscript\b/i,
      /\bunion\s+select\b/i,
      /--|\*\/|\/\*/i,
    ];

    const risks: string[] = [];
    for (const pattern of unsafePatterns) {
      if (pattern.test(query)) {
        risks.push(`Potentially unsafe operation detected: ${pattern.source}`);
      }
    }

    return {
      isSafe: risks.length === 0,
      risks,
    };
  }
  private determineQueryType(lowerQuery: string): { queryType: string; entities: string[] } {
    let queryType = 'GENERAL';
    const entities: string[] = [];

    if (lowerQuery.includes('purchase request') || lowerQuery.includes('pr ')) {
      queryType = 'PURCHASE_REQUESTS';
      entities.push('purchase_requests');
    } else if (lowerQuery.includes('purchase order') || lowerQuery.includes('po ')) {
      queryType = 'PURCHASE_ORDERS';
      entities.push('purchase_orders');
    } else if (lowerQuery.includes('item') || lowerQuery.includes('product')) {
      queryType = 'ITEMS';
      entities.push('items');
    } else if (lowerQuery.includes('supplier') || lowerQuery.includes('vendor')) {
      queryType = 'SUPPLIERS';
      entities.push('suppliers');
    } else if (
      lowerQuery.includes('inventory') ||
      lowerQuery.includes('stock') ||
      lowerQuery.includes('quantity')
    ) {
      queryType = 'INVENTORY';
      entities.push('inventory', 'stock');
    } else if (
      lowerQuery.includes('report') ||
      lowerQuery.includes('analytics') ||
      lowerQuery.includes('summary')
    ) {
      queryType = 'ANALYTICS';
      entities.push('analytics');
    }

    return { queryType, entities };
  }

  private determineIntent(lowerQuery: string): string {
    if (lowerQuery.includes('report') || lowerQuery.includes('analytics')) {
      return 'analytics_request';
    }
    return 'information_request';
  }
  private async generatePrismaQuery(
    analysis: QueryAnalysis,
    context: QueryContext
  ): Promise<QueryResult> {
    switch (analysis.queryType) {
      case 'PURCHASE_REQUESTS':
        return {
          query: 'findMany',
          parameters: {
            where: { branchId: context.branchId },
            include: { items: true, branch: true, createdBy: true },
            take: 20,
            orderBy: { createdAt: 'desc' },
          },
          explanation: 'Fetching recent purchase requests for your branch',
        };

      case 'PURCHASE_ORDERS':
        return {
          query: 'findMany',
          parameters: {
            where: { branchId: context.branchId },
            include: { items: true, supplier: true, branch: true },
            take: 20,
            orderBy: { createdAt: 'desc' },
          },
          explanation: 'Fetching recent purchase orders for your branch',
        };

      case 'INVENTORY':
        return {
          query: 'stockQuery',
          parameters: {
            branchId: context.branchId,
            lowStockThreshold: 10, // Default threshold for low stock
          },
          explanation: 'Analyzing stock levels for your branch',
        };

      default:
        return {
          query: 'general',
          parameters: {},
          explanation: 'General information query',
        };
    }
  }
  private hasPermission(queryType: string, context: QueryContext): boolean {
    // Basic permission check - expand based on your authorization model
    const userPermissions = context.userPermissions || [];
    const userRole = context.userRole;

    switch (queryType) {
      case 'PURCHASE_REQUESTS':
      case 'PURCHASE_ORDERS':
        return (
          userPermissions.includes('READ_PURCHASE') ||
          userRole === 'admin' ||
          userRole === 'BRANCH_MANAGER' ||
          userRole === 'PROCUREMENT_MANAGER'
        );

      case 'ITEMS':
      case 'INVENTORY':
        return (
          userPermissions.includes('READ_INVENTORY') ||
          userRole === 'admin' ||
          userRole === 'BRANCH_MANAGER' ||
          userRole === 'INVENTORY_CLERK'
        );

      case 'SUPPLIERS':
        return (
          userPermissions.includes('READ_SUPPLIERS') ||
          userRole === 'admin' ||
          userRole === 'BRANCH_MANAGER' ||
          userRole === 'PROCUREMENT_MANAGER'
        );

      case 'ANALYTICS':
        return (
          userPermissions.includes('READ_ANALYTICS') ||
          userRole === 'admin' ||
          userRole === 'BRANCH_MANAGER'
        );

      default:
        return userRole === 'admin' || userRole === 'BRANCH_MANAGER';
    }
  }
  private async getPurchaseRequests(parameters: Record<string, unknown>, _context: QueryContext) {
    return this.prisma.purchaseRequest.findMany({
      ...parameters,
      where: {
        ...(parameters.where as Record<string, unknown>),
        branchId: _context.branchId, // Ensure user can only see their branch data
      },
    });
  }

  private async getPurchaseOrders(parameters: Record<string, unknown>, _context: QueryContext) {
    return this.prisma.purchaseOrder.findMany({
      ...parameters,
      where: {
        ...(parameters.where as Record<string, unknown>),
        branchId: _context.branchId,
      },
    });
  }

  private async getItems(parameters: Record<string, unknown>, _context: QueryContext) {
    return this.prisma.item.findMany({
      ...parameters,
      take: Math.min((parameters.take as number) || 50, 100), // Limit results
    });
  }

  private async getSuppliers(parameters: Record<string, unknown>, _context: QueryContext) {
    return this.prisma.supplier.findMany({
      ...parameters,
      take: Math.min((parameters.take as number) || 50, 100),
    });
  }
  private async getInventoryData(parameters: Record<string, unknown>, context: QueryContext) {
    try {
      const branchId = (parameters.branchId as string) || context.branchId;
      const lowStockThreshold = (parameters.lowStockThreshold as number) || 10;

      // Get all stock for the branch
      const allStock = await this.prisma.stock.findMany({
        where: {
          branchId: branchId,
        },
        include: {
          item: {
            select: {
              id: true,
              name: true,
              sku: true,
              mainUnit: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
        orderBy: {
          quantity: 'asc', // Show items with lowest stock first
        },
      });

      // Filter for low stock items
      const lowStockItems = allStock.filter((stock) => Number(stock.quantity) < lowStockThreshold);

      // Get total counts
      const totalItems = allStock.length;
      const lowStockCount = lowStockItems.length;

      // Calculate summary statistics
      const totalQuantity = allStock.reduce((sum, stock) => sum + Number(stock.quantity), 0);

      const averageQuantity = totalItems > 0 ? totalQuantity / totalItems : 0;

      return {
        branchInfo: allStock[0]?.branch || { name: 'Unknown Branch', code: branchId },
        summary: {
          totalItems,
          lowStockCount,
          lowStockThreshold,
          totalQuantity,
          averageQuantity: Math.round(averageQuantity * 100) / 100,
        },
        lowStockItems: lowStockItems.map((stock) => ({
          itemId: stock.item.id,
          itemName: stock.item.name,
          sku: stock.item.sku,
          currentQuantity: Number(stock.quantity),
          availableQuantity: Number(stock.availableQty),
          reservedQuantity: Number(stock.reservedQty),
          unit: stock.item.mainUnit,
          lastUpdated: stock.updatedAt,
        })),
        allItems:
          totalItems <= 50
            ? allStock.map((stock) => ({
                itemId: stock.item.id,
                itemName: stock.item.name,
                sku: stock.item.sku,
                currentQuantity: Number(stock.quantity),
                availableQuantity: Number(stock.availableQty),
                reservedQuantity: Number(stock.reservedQty),
                unit: stock.item.mainUnit,
                isLowStock: Number(stock.quantity) < lowStockThreshold,
                lastUpdated: stock.updatedAt,
              }))
            : [], // Only include all items if count is reasonable
      };
    } catch (error) {
      this.logger.error('Failed to fetch inventory data:', error);
      throw new Error('Failed to retrieve inventory information');
    }
  }

  private async getAnalyticsData(_parameters: Record<string, unknown>, context: QueryContext) {
    // Aggregate analytics based on user's branch
    const [totalPRs, totalPOs, recentActivity] = await Promise.all([
      this.prisma.purchaseRequest.count({
        where: { branchId: context.branchId },
      }),
      this.prisma.purchaseOrder.count({
        where: { branchId: context.branchId },
      }),
      this.prisma.purchaseRequest.findMany({
        where: { branchId: context.branchId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { createdBy: true },
      }),
    ]);

    return {
      summary: {
        totalPurchaseRequests: totalPRs,
        totalPurchaseOrders: totalPOs,
      },
      recentActivity,
    };
  }
}
