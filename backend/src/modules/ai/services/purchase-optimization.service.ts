import { Injectable, Logger } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../../app/prisma.service';
import {
  type OrderOptimization,
  type OrderOptimizationResult,
  type POItem,
  PRItemForOptimization,
  type PriceHistoryItem,
  type QualityMetrics,
  type SupplierPerformanceData,
  SupplierWithOrders,
} from '../interfaces/ai-service.interface';
import { GeminiService } from './gemini.service';

interface SupplierRecommendation {
  supplierId: string;
  supplierName: string;
  score: number;
  averagePrice: number;
  deliveryPerformance: number;
  qualityRating: number;
  recommendations: string[];
}

export type { SupplierRecommendation };

@Injectable()
export class PurchaseOptimizationService {
  private readonly logger = new Logger(PurchaseOptimizationService.name);

  constructor(
    private prisma: PrismaService,
    private geminiService: GeminiService
  ) {}

  async recommendOptimalSupplier(itemIds: string[]): Promise<SupplierRecommendation[]> {
    try {
      const supplierData = await this.getSupplierPerformanceData(itemIds);
      const recommendations: SupplierRecommendation[] = [];

      for (const supplier of supplierData) {
        const recommendation = await this.analyzeSupplierWithAI(supplier);
        recommendations.push(recommendation);
      }

      // Sort by score (highest first)
      return recommendations.sort((a, b) => b.score - a.score);
    } catch (error) {
      this.logger.error('Error recommending optimal supplier:', error);
      throw new Error('Failed to recommend optimal supplier');
    }
  }

  private async getSupplierPerformanceData(itemIds: string[]) {
    // Get historical purchase orders and goods receipts for performance analysis
    const supplierPerformance = await this.prisma.supplier.findMany({
      include: {
        purchaseOrders: {
          where: {
            status: 'CONFIRMED',
            items: {
              some: {
                itemId: { in: itemIds },
              },
            },
          },
          include: {
            items: {
              where: {
                itemId: { in: itemIds },
              },
              include: {
                item: true,
              },
            },
            goodsReceipts: {
              where: {
                status: 'POSTED',
              },
              include: {
                items: {
                  where: {
                    itemId: { in: itemIds },
                  },
                },
              },
            },
          },
        },
      },
    });

    return supplierPerformance.map((supplier) => {
      const orders = supplier.purchaseOrders;
      const totalOrders = orders.length;

      // Calculate metrics
      const avgDeliveryTime = this.calculateAverageDeliveryTime(orders);
      const priceHistory = this.extractPriceHistory(orders);
      const qualityMetrics = this.calculateQualityMetrics(orders);

      return {
        supplierId: supplier.id,
        supplierName: supplier.name,
        totalOrders,
        avgDeliveryTime,
        priceHistory,
        qualityMetrics,
        contactInfo: supplier.email,
      };
    });
  }

  private calculateAverageDeliveryTime(orders: unknown[]): number {
    const deliveryTimes = orders
      .filter((order) => {
        const typedOrder = order as { goodsReceipts: unknown[] };
        return typedOrder.goodsReceipts.length > 0;
      })
      .map((order) => {
        const typedOrder = order as {
          orderDate: Date;
          goodsReceipts: Array<{ receiptDate: Date }>;
        };
        const orderDate = new Date(typedOrder.orderDate);
        const receiptDate = new Date(typedOrder.goodsReceipts[0].receiptDate);
        return Math.abs(receiptDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
      });

    return deliveryTimes.length > 0
      ? deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length
      : 0;
  }

  private extractPriceHistory(orders: unknown[]): PriceHistoryItem[] {
    return orders.flatMap((order) => {
      const typedOrder = order as {
        orderDate: Date;
        items: Array<{
          itemId: string;
          item: { name: string };
          unitPrice: number;
          quantity: number;
        }>;
      };
      return typedOrder.items.map((item) => ({
        itemId: item.itemId,
        itemName: item.item.name,
        unitPrice: Number(item.unitPrice),
        orderDate: typedOrder.orderDate,
        quantity: Number(item.quantity),
      }));
    });
  }

  private calculateQualityMetrics(orders: unknown[]): QualityMetrics {
    const typedOrders = orders as Array<{
      goodsReceipts: Array<{
        items: Array<{
          qualityNotes?: string;
        }>;
      }>;
    }>;
    const grItems = typedOrders.flatMap((order) => order.goodsReceipts.flatMap((gr) => gr.items));

    const totalItems = grItems.length;
    const itemsWithIssues = grItems.filter((item) =>
      item.qualityNotes?.toLowerCase().includes('issue')
    ).length;

    return {
      averageQuality: totalItems > 0 ? ((totalItems - itemsWithIssues) / totalItems) * 100 : 100,
      defectRate: totalItems > 0 ? (itemsWithIssues / totalItems) * 100 : 0,
      onTimeDeliveryRate: 95, // Placeholder - would need delivery data
      supplierRating: totalItems > 0 ? ((totalItems - itemsWithIssues) / totalItems) * 5 : 5,
    };
  }

  private async analyzeSupplierWithAI(
    supplierData: SupplierPerformanceData
  ): Promise<SupplierRecommendation> {
    const prompt = `
      Analyze this supplier's performance data and provide a comprehensive recommendation:
      
      Supplier: ${supplierData.supplierName}
      Total Orders: ${supplierData.totalOrders}
      Average Delivery Time: ${supplierData.avgDeliveryTime} days
      Price History: ${JSON.stringify(supplierData.priceHistory)}
      Quality Metrics: ${JSON.stringify(supplierData.qualityMetrics)}
      
      Calculate:
      1. Overall score (0-100) considering price, delivery, and quality
      2. Average price for items
      3. Delivery performance rating (0-100)
      4. Quality rating (0-100)
      5. Specific recommendations for working with this supplier
      
      Return JSON format (return only valid JSON, no markdown):
      {
        "score": number,
        "averagePrice": number,
        "deliveryPerformance": number,
        "qualityRating": number,
        "recommendations": ["recommendation1", "recommendation2"]
      }
    `;

    try {
      const aiResponse = await this.geminiService.generateText(prompt);
      // Clean the response to remove markdown code blocks if present
      const cleanedResponse = this.cleanJsonResponse(aiResponse);
      const analysis = JSON.parse(cleanedResponse);

      return {
        supplierId: supplierData.supplierId,
        supplierName: supplierData.supplierName,
        score: analysis.score || 50,
        averagePrice: analysis.averagePrice || 0,
        deliveryPerformance: analysis.deliveryPerformance || 50,
        qualityRating: analysis.qualityRating || supplierData.qualityMetrics.supplierRating,
        recommendations: analysis.recommendations || ['No specific recommendations available'],
      };
    } catch (error) {
      this.logger.error('Error in AI supplier analysis:', error);

      // Fallback calculation
      const deliveryScore = Math.max(0, 100 - supplierData.avgDeliveryTime * 2);
      const qualityScore = supplierData.qualityMetrics.supplierRating;
      const overallScore = (deliveryScore + qualityScore) / 2;

      return {
        supplierId: supplierData.supplierId,
        supplierName: supplierData.supplierName,
        score: overallScore,
        averagePrice: this.calculateAveragePrice(supplierData.priceHistory),
        deliveryPerformance: deliveryScore,
        qualityRating: qualityScore,
        recommendations: ['Fallback analysis - recommend reviewing manually'],
      };
    }
  }

  private calculateAveragePrice(priceHistory: PriceHistoryItem[]): number {
    if (priceHistory.length === 0) return 0;
    const totalPrice = priceHistory.reduce((sum, item) => sum + item.unitPrice, 0);
    return totalPrice / priceHistory.length;
  }

  async optimizeOrderQuantities(poItems: POItem[]): Promise<OrderOptimization[]> {
    try {
      const optimizations: OrderOptimization[] = [];

      for (const item of poItems) {
        const optimization = await this.optimizeItemOrderQuantity(item);
        optimizations.push(optimization);
      }

      return optimizations;
    } catch (error) {
      this.logger.error('Error optimizing order quantities:', error);
      throw new Error('Failed to optimize order quantities');
    }
  }

  private async optimizeItemOrderQuantity(item: unknown): Promise<OrderOptimization> {
    const typedItem = item as POItem & {
      item: { name: string };
      estimatedPrice?: number;
    };

    // Get historical consumption and pricing data
    const historicalData = await this.getItemHistoricalData(typedItem.itemId);

    const prompt = `
      Optimize the order quantity for this item using Economic Order Quantity (EOQ) principles:
      
      Item: ${typedItem.item?.name || 'Unknown'}
      Current Order Quantity: ${typedItem.quantity}
      Unit Price: ${typedItem.unitPrice || typedItem.estimatedPrice || 0}
      Historical Data: ${JSON.stringify(historicalData)}
      
      Consider:
      - Annual demand based on historical consumption
      - Holding costs (estimate 20% of unit price annually)
      - Ordering costs (estimate $50 per order)
      - Volume discounts
      - Storage constraints
      - Lead times
      
      Calculate optimal order quantity and potential savings.
      
      Return JSON (return only valid JSON, no markdown):
      {
        "optimizedOrderQty": number,
        "potentialSavings": number,
        "reasoning": ["reason1", "reason2"]
      }
    `;

    try {
      const aiResponse = await this.geminiService.generateText(prompt);
      const cleanedResponse = this.cleanJsonResponse(aiResponse);
      const optimization = JSON.parse(cleanedResponse);

      return {
        itemId: typedItem.itemId,
        itemName: typedItem.item?.name || 'Unknown',
        currentOrderQty: Number(typedItem.quantity),
        optimizedOrderQty: optimization.optimizedOrderQty || Number(typedItem.quantity),
        potentialSavings: optimization.potentialSavings || 0,
        reasoning: optimization.reasoning || ['AI optimization completed'],
      };
    } catch (error) {
      this.logger.error('Error in AI quantity optimization:', error);

      // Simple EOQ fallback
      const unitPrice = Number(typedItem.unitPrice || typedItem.estimatedPrice || 0);
      const eoq = this.calculateSimpleEOQ(historicalData.annualDemand, 50, unitPrice * 0.2);

      return {
        itemId: typedItem.itemId,
        itemName: typedItem.item?.name || 'Unknown',
        currentOrderQty: Number(typedItem.quantity),
        optimizedOrderQty: eoq,
        potentialSavings: 0,
        reasoning: ['Fallback EOQ calculation used'],
      };
    }
  }

  private async getItemHistoricalData(itemId: string) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const grItems = await this.prisma.gRItem.findMany({
      where: {
        itemId,
        goodsReceipt: {
          status: 'POSTED',
          postedAt: {
            gte: sixMonthsAgo,
          },
        },
      },
      include: {
        goodsReceipt: true,
      },
    });

    const totalConsumption = grItems.reduce((sum, item) => sum + Number(item.receivedQty), 0);
    const annualDemand = totalConsumption * 2; // Extrapolate to annual

    return {
      annualDemand,
      totalConsumption,
      orderFrequency: grItems.length,
      averageOrderSize: grItems.length > 0 ? totalConsumption / grItems.length : 0,
    };
  }

  private calculateSimpleEOQ(
    annualDemand: number,
    orderingCost: number,
    holdingCost: number
  ): number {
    if (annualDemand <= 0 || holdingCost <= 0) return annualDemand;
    return Math.sqrt((2 * annualDemand * orderingCost) / holdingCost);
  }
  async getSupplierRecommendations(itemIds: string[]): Promise<SupplierRecommendation[]> {
    return this.recommendOptimalSupplier(itemIds);
  }
  async adjustOrderQuantities(poItems: POItem[]): Promise<OrderOptimization[]> {
    const optimizedItems: OrderOptimization[] = [];
    for (const item of poItems) {
      try {
        const demandData = await this.calculateOptimalQuantity(item.itemId, item.quantity);
        optimizedItems.push({
          itemId: item.itemId,
          itemName: item.item?.name || 'Unknown Item',
          currentOrderQty: item.quantity,
          optimizedOrderQty: demandData.optimalQuantity,
          potentialSavings: demandData.savings,
          reasoning: [demandData.reasoning],
        });
      } catch (error) {
        this.logger.error(`Failed to optimize quantity for item ${item.itemId}:`, error);
        optimizedItems.push({
          itemId: item.itemId,
          itemName: item.item?.name || 'Unknown Item',
          currentOrderQty: item.quantity,
          optimizedOrderQty: item.quantity,
          potentialSavings: 0,
          reasoning: ['Optimization failed'],
        });
      }
    }

    return optimizedItems;
  }

  private async calculateOptimalQuantity(
    itemId: string,
    currentQty: number
  ): Promise<{
    optimalQuantity: number;
    savings: number;
    reasoning: string;
  }> {
    try {
      // Get historical consumption data
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const grItems = await this.prisma.gRItem.findMany({
        where: {
          itemId,
          goodsReceipt: {
            status: 'POSTED',
            postedAt: {
              gte: sixMonthsAgo,
            },
          },
        },
        include: {
          goodsReceipt: true,
        },
      });

      const totalConsumption = grItems.reduce((sum, item) => sum + Number(item.receivedQty), 0);

      // Calculate average monthly consumption
      const avgMonthlyConsumption = totalConsumption / 6;

      // Calculate optimal quantity (2-3 months supply)
      const optimalQuantity = Math.ceil(avgMonthlyConsumption * 2.5);

      // Calculate potential savings
      const savings = Math.abs(currentQty - optimalQuantity) * 0.1; // Placeholder calculation

      const reasoning =
        currentQty > optimalQuantity
          ? 'Reduce quantity to avoid overstocking'
          : 'Increase quantity for better price breaks';

      return {
        optimalQuantity,
        savings,
        reasoning,
      };
    } catch (error) {
      this.logger.error(`Error calculating optimal quantity for item ${itemId}:`, error);
      return {
        optimalQuantity: currentQty,
        savings: 0,
        reasoning: 'Unable to optimize due to insufficient data',
      };
    }
  }

  async optimizeOrder(
    itemIds: string[],
    branchId: string,
    budgetLimit?: number
  ): Promise<OrderOptimizationResult> {
    try {
      // Get current purchase request items for the specified items
      const items = await this.prisma.pRItem.findMany({
        where: {
          itemId: { in: itemIds },
          purchaseRequest: {
            branchId: branchId,
          },
        },
        include: {
          item: true,
          purchaseRequest: true,
        },
      });

      if (items.length === 0) {
        throw new Error('No items found for optimization');
      }

      // Optimize quantities for each item
      const optimizations = await Promise.all(
        items.map(async (item) => {
          const optimization = await this.optimizeItemOrderQuantity(item);
          return optimization;
        })
      );

      // Calculate total optimization savings
      const totalSavings = optimizations.reduce((sum, opt) => sum + opt.potentialSavings, 0); // Apply budget constraints if specified
      let finalOptimizations = optimizations;
      if (budgetLimit) {
        const currentTotal = optimizations.reduce(
          (sum, opt) =>
            sum +
            opt.optimizedOrderQty *
              Number(items.find((i) => i.itemId === opt.itemId)?.estimatedPrice || 0),
          0
        );
        if (currentTotal > budgetLimit) {
          // Scale down quantities proportionally to fit budget
          const scaleFactor = budgetLimit / currentTotal;
          finalOptimizations = optimizations.map((opt) => ({
            ...opt,
            optimizedOrderQty: Math.floor(opt.optimizedOrderQty * scaleFactor),
            reasoning: [
              ...opt.reasoning,
              `Adjusted for budget constraint (scale factor: ${scaleFactor.toFixed(2)})`,
            ],
          }));
        }
      }

      return {
        optimizations: finalOptimizations,
        totalSavings,
        budgetCompliant:
          !budgetLimit ||
          finalOptimizations.reduce(
            (sum, opt) =>
              sum +
              opt.optimizedOrderQty *
                Number(items.find((i) => i.itemId === opt.itemId)?.estimatedPrice || 0),
            0
          ) <= budgetLimit,
        summary: {
          itemsOptimized: finalOptimizations.length,
          totalPotentialSavings: totalSavings,
          averageSavingsPerItem: totalSavings / finalOptimizations.length,
        },
      };
    } catch (error) {
      this.logger.error('Error optimizing order:', error);
      throw new Error('Failed to optimize order');
    }
  }

  private cleanJsonResponse(response: string): string {
    // Remove markdown code blocks and any extra whitespace
    let cleaned = response.trim();

    // Remove ```json at the beginning and ``` at the end
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.substring(3);
    }

    if (cleaned.endsWith('```')) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }

    cleaned = cleaned.trim();

    // Extract the first complete JSON object
    const firstBraceIndex = cleaned.indexOf('{');
    if (firstBraceIndex === -1) return cleaned;

    // Find the matching closing brace
    let braceCount = 0;
    for (let i = firstBraceIndex; i < cleaned.length; i++) {
      if (cleaned[i] === '{') braceCount++;
      else if (cleaned[i] === '}') braceCount--;

      if (braceCount === 0) {
        return cleaned.substring(firstBraceIndex, i + 1);
      }
    }

    return cleaned;
  }
}
