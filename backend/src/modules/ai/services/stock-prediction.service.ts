import { Injectable, Logger } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaService } from '../../../app/prisma.service';
import type {
  ConsumptionRecord,
  StockData,
  StockWhereClause,
} from '../interfaces/ai-service.interface';
import type { GeminiService } from './gemini.service';

interface StockPrediction {
  itemId: string;
  itemName: string;
  currentStock: number;
  predictedStock: number[];
  stockoutRisk: 'low' | 'medium' | 'high';
  stockoutDate: Date | null;
  recommendedAction: string;
  confidence: number;
}

interface ReorderRecommendation {
  itemId: string;
  itemName: string;
  currentStock: number;
  reorderPoint: number;
  recommendedOrderQty: number;
  urgency: 'low' | 'medium' | 'high';
  daysUntilStockout: number;
  estimatedCost: number;
}

@Injectable()
export class StockPredictionService {
  private readonly logger = new Logger(StockPredictionService.name);

  constructor(
    private prisma: PrismaService,
    private geminiService: GeminiService
  ) {}

  async predictStockLevels(
    branchId: string,
    itemId?: string,
    daysAhead = 30
  ): Promise<StockPrediction[]> {
    try {
      const stockData = await this.getCurrentStockData(branchId, itemId);
      const predictions: StockPrediction[] = [];

      for (const stock of stockData) {
        const prediction = await this.predictItemStock(stock, daysAhead);
        predictions.push(prediction);
      }

      return predictions.sort((a, b) => {
        const riskOrder = { high: 3, medium: 2, low: 1 };
        return riskOrder[b.stockoutRisk] - riskOrder[a.stockoutRisk];
      });
    } catch (error) {
      this.logger.error('Error predicting stock levels:', error);
      throw new Error('Failed to predict stock levels');
    }
  }

  private async getCurrentStockData(branchId: string, itemId?: string) {
    const where: StockWhereClause = { branchId };
    if (itemId) where.itemId = itemId;

    return this.prisma.stock.findMany({
      where,
      include: {
        item: true,
        branch: true,
      },
    });
  }

  private async predictItemStock(stockData: unknown, daysAhead: number): Promise<StockPrediction> {
    const typedStockData = stockData as StockData;
    // Get historical consumption data
    const consumptionHistory = await this.getConsumptionHistory(
      typedStockData.itemId,
      typedStockData.branchId
    );

    const prompt = `
      Predict stock levels for the next ${daysAhead} days:
      
      Item: ${typedStockData.item.name}
      Current Stock: ${typedStockData.currentQuantity}
      Branch: ${typedStockData.branch.name}
      
      Historical Consumption (last 90 days):
      ${JSON.stringify(consumptionHistory)}
      
      Consider:
      - Consumption patterns and trends
      - Seasonal variations
      - Lead times for replenishment
      - Safety stock requirements
      
      Predict daily stock levels and identify:
      - Stockout risk level (low/medium/high)
      - Estimated stockout date if applicable
      - Recommended action
      - Confidence level (0-100)
      
      Return JSON:
      {
        "predictedStock": [day1_stock, day2_stock, ...day${daysAhead}_stock],
        "stockoutRisk": "low|medium|high",
        "stockoutDate": "YYYY-MM-DD or null",
        "recommendedAction": "action description",
        "confidence": number
      }
    `;

    try {
      const aiResponse = await this.geminiService.generateText(prompt);
      const prediction = JSON.parse(aiResponse);

      return {
        itemId: typedStockData.itemId,
        itemName: typedStockData.item.name,
        currentStock: Number(typedStockData.currentQuantity),
        predictedStock:
          prediction.predictedStock ||
          this.calculateFallbackPrediction(typedStockData, consumptionHistory, daysAhead),
        stockoutRisk: prediction.stockoutRisk || 'medium',
        stockoutDate: prediction.stockoutDate ? new Date(prediction.stockoutDate) : null,
        recommendedAction: prediction.recommendedAction || 'Monitor stock levels',
        confidence: prediction.confidence || 70,
      };
    } catch (error) {
      this.logger.error('Error in AI stock prediction:', error);

      return {
        itemId: typedStockData.itemId,
        itemName: typedStockData.item.name,
        currentStock: Number(typedStockData.currentQuantity),
        predictedStock: this.calculateFallbackPrediction(
          typedStockData,
          consumptionHistory,
          daysAhead
        ),
        stockoutRisk: 'medium',
        stockoutDate: null,
        recommendedAction: 'Manual review recommended',
        confidence: 50,
      };
    }
  }

  private async getConsumptionHistory(itemId: string, branchId: string) {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const grItems = await this.prisma.gRItem.findMany({
      where: {
        itemId,
        goodsReceipt: {
          branchId,
          status: 'POSTED',
          postedAt: {
            gte: ninetyDaysAgo,
          },
        },
      },
      include: {
        goodsReceipt: true,
      },
      orderBy: {
        goodsReceipt: {
          postedAt: 'asc',
        },
      },
    });
    return grItems.map((item) => ({
      date: item.goodsReceipt.postedAt,
      quantity: Number(item.receivedQty),
      unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
    }));
  }

  private calculateFallbackPrediction(
    stockData: unknown,
    consumptionHistory: unknown[],
    daysAhead: number
  ): number[] {
    const typedStockData = stockData as StockData;
    const typedConsumptionHistory = consumptionHistory as ConsumptionRecord[];
    const avgDailyConsumption =
      typedConsumptionHistory.length > 0
        ? typedConsumptionHistory.reduce((sum, item) => sum + item.quantity, 0) / 90
        : 1;

    const prediction = [];
    let currentStock = Number(typedStockData.currentQuantity);

    for (let day = 1; day <= daysAhead; day++) {
      currentStock = Math.max(0, currentStock - avgDailyConsumption);
      prediction.push(Math.round(currentStock));
    }

    return prediction;
  }

  async generateReorderRecommendations(branchId: string): Promise<ReorderRecommendation[]> {
    try {
      const stockPredictions = await this.predictStockLevels(branchId, undefined, 30);
      const recommendations: ReorderRecommendation[] = [];

      for (const prediction of stockPredictions) {
        if (prediction.stockoutRisk === 'medium' || prediction.stockoutRisk === 'high') {
          const recommendation = await this.generateReorderRecommendation(prediction);
          recommendations.push(recommendation);
        }
      }

      return recommendations.sort((a, b) => {
        const urgencyOrder = { high: 3, medium: 2, low: 1 };
        return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      });
    } catch (error) {
      this.logger.error('Error generating reorder recommendations:', error);
      throw new Error('Failed to generate reorder recommendations');
    }
  }

  private async generateReorderRecommendation(
    prediction: StockPrediction
  ): Promise<ReorderRecommendation> {
    // Get item pricing information
    const recentPricing = await this.getRecentItemPricing(prediction.itemId);

    const prompt = `
      Generate a reorder recommendation for this item:
      
      Item: ${prediction.itemName}
      Current Stock: ${prediction.currentStock}
      Stockout Risk: ${prediction.stockoutRisk}
      Predicted Stock: ${prediction.predictedStock}
      Recent Pricing: ${JSON.stringify(recentPricing)}
      
      Calculate:
      - Optimal reorder point
      - Recommended order quantity
      - Urgency level (low/medium/high)
      - Days until stockout
      - Estimated total cost
      
      Consider EOQ principles, lead times, and safety stock.
      
      Return JSON:
      {
        "reorderPoint": number,
        "recommendedOrderQty": number,
        "urgency": "low|medium|high",
        "daysUntilStockout": number,
        "estimatedCost": number
      }
    `;

    try {
      const aiResponse = await this.geminiService.generateText(prompt);
      const recommendation = JSON.parse(aiResponse);

      return {
        itemId: prediction.itemId,
        itemName: prediction.itemName,
        currentStock: prediction.currentStock,
        reorderPoint: recommendation.reorderPoint || prediction.currentStock,
        recommendedOrderQty: recommendation.recommendedOrderQty || 100,
        urgency: recommendation.urgency || prediction.stockoutRisk,
        daysUntilStockout:
          recommendation.daysUntilStockout || this.calculateDaysUntilStockout(prediction),
        estimatedCost: recommendation.estimatedCost || 0,
      };
    } catch (error) {
      this.logger.error('Error in AI reorder recommendation:', error);

      return {
        itemId: prediction.itemId,
        itemName: prediction.itemName,
        currentStock: prediction.currentStock,
        reorderPoint: prediction.currentStock,
        recommendedOrderQty: 100,
        urgency: prediction.stockoutRisk,
        daysUntilStockout: this.calculateDaysUntilStockout(prediction),
        estimatedCost: 0,
      };
    }
  }

  private async getRecentItemPricing(itemId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentPricing = await this.prisma.gRItem.findMany({
      where: {
        itemId,
        goodsReceipt: {
          status: 'POSTED',
          postedAt: {
            gte: thirtyDaysAgo,
          },
        },
        unitPrice: {
          not: null,
        },
      },
      include: {
        goodsReceipt: {
          include: {
            purchaseOrder: {
              include: {
                supplier: true,
              },
            },
          },
        },
      },
      orderBy: {
        goodsReceipt: {
          postedAt: 'desc',
        },
      },
      take: 10,
    });

    return recentPricing.map((item) => ({
      date: item.goodsReceipt.postedAt,
      unitPrice: Number(item.unitPrice),
      supplier: item.goodsReceipt.purchaseOrder?.supplier?.name || 'Unknown',
      quantity: Number(item.receivedQty),
    }));
  }

  private calculateDaysUntilStockout(prediction: StockPrediction): number {
    const stockoutIndex = prediction.predictedStock.findIndex((stock) => stock <= 0);
    return stockoutIndex === -1 ? 30 : stockoutIndex + 1;
  }

  async generateStockReport(branchId: string): Promise<unknown> {
    try {
      const predictions = await this.predictStockLevels(branchId, undefined, 30);
      const reorderRecommendations = await this.generateReorderRecommendations(branchId);

      const summary = {
        totalItems: predictions.length,
        highRiskItems: predictions.filter((p) => p.stockoutRisk === 'high').length,
        mediumRiskItems: predictions.filter((p) => p.stockoutRisk === 'medium').length,
        lowRiskItems: predictions.filter((p) => p.stockoutRisk === 'low').length,
        itemsNeedingReorder: reorderRecommendations.length,
      };

      const prompt = `
        Generate a comprehensive stock management report:
        
        Summary: ${JSON.stringify(summary)}
        High-risk items: ${predictions.filter((p) => p.stockoutRisk === 'high').length}
        Reorder recommendations: ${reorderRecommendations.length}
        
        Create an executive summary highlighting:
        - Key risks and opportunities
        - Immediate actions required
        - Cost implications
        - Performance trends
        
        Format as a structured business report.
      `;

      const reportText = await this.geminiService.generateText(prompt);

      return {
        branchId,
        reportDate: new Date(),
        summary,
        predictions: predictions.slice(0, 20), // Top 20 items by risk
        reorderRecommendations: reorderRecommendations.slice(0, 10), // Top 10 urgent items
        executiveSummary: reportText,
      };
    } catch (error) {
      this.logger.error('Error generating stock report:', error);
      throw new Error('Failed to generate stock report');
    }
  }

  async identifyStockoutRisks(branchId: string, daysAhead = 30): Promise<unknown[]> {
    try {
      const stocks = await this.prisma.stock.findMany({
        where: { branchId },
        include: { item: true },
      });

      const risks = [];
      for (const stock of stocks) {
        try {
          const prediction = await this.predictItemStock(stock, daysAhead);
          if (prediction.stockoutRisk !== 'low') {
            risks.push(prediction);
          }
        } catch (error) {
          this.logger.warn(`Failed to predict stockout risk for item ${stock.itemId}:`, error);
        }
      }

      return risks.sort((a, b) => {
        const urgencyOrder = { high: 3, medium: 2, low: 1 };
        return urgencyOrder[b.stockoutRisk] - urgencyOrder[a.stockoutRisk];
      });
    } catch (error) {
      this.logger.error('Error identifying stockout risks:', error);
      throw new Error('Failed to identify stockout risks');
    }
  }

  async predictStockouts(
    branchId: string,
    daysAhead = 30,
    itemIds?: string[]
  ): Promise<StockPrediction[]> {
    try {
      const whereClause: StockWhereClause = { branchId };
      if (itemIds && itemIds.length > 0) {
        whereClause.itemId = { in: itemIds };
      }

      const stocks = await this.prisma.stock.findMany({
        where: whereClause,
        include: { item: true },
      });

      const predictions: StockPrediction[] = [];
      for (const stock of stocks) {
        try {
          const prediction = await this.predictItemStock(stock, daysAhead);
          // Only include items with medium or high stockout risk
          if (prediction.stockoutRisk !== 'low') {
            predictions.push(prediction);
          }
        } catch (error) {
          this.logger.warn(`Failed to predict stockout for item ${stock.itemId}:`, error);
        }
      }

      return predictions.sort((a, b) => {
        const urgencyOrder = { high: 3, medium: 2, low: 1 };
        return urgencyOrder[b.stockoutRisk] - urgencyOrder[a.stockoutRisk];
      });
    } catch (error) {
      this.logger.error('Error predicting stockouts:', error);
      throw new Error('Failed to predict stockouts');
    }
  }

  async calculateOptimalReorderPoints(branchId: string): Promise<ReorderRecommendation[]> {
    try {
      const stocks = await this.prisma.stock.findMany({
        where: { branchId },
        include: { item: true },
      });

      const recommendations = [];
      for (const stock of stocks) {
        try {
          const consumptionHistory = await this.getConsumptionHistory(stock.itemId, stock.branchId);
          const avgDemand = this.calculateAverageDemand(consumptionHistory);
          const leadTime = 7; // Default 7 days lead time

          const reorderPoint = Math.ceil(avgDemand * leadTime * 1.2); // 20% safety buffer
          const recommendedOrderQty = Math.ceil(avgDemand * 30); // 30 days supply

          recommendations.push({
            itemId: stock.itemId,
            itemName: stock.item.name,
            currentStock: Number(stock.quantity),
            reorderPoint,
            recommendedOrderQty,
            urgency: Number(stock.quantity) <= reorderPoint ? 'high' : 'low',
            daysUntilStockout: Number(stock.quantity) / Math.max(avgDemand, 1),
            estimatedCost: recommendedOrderQty * 10, // Placeholder cost calculation
          });
        } catch (error) {
          this.logger.warn(`Failed to calculate reorder point for item ${stock.itemId}:`, error);
        }
      }

      return recommendations;
    } catch (error) {
      this.logger.error('Error calculating optimal reorder points:', error);
      throw new Error('Failed to calculate optimal reorder points');
    }
  }

  private calculateAverageDemand(consumptionHistory: unknown[]): number {
    const typedHistory = consumptionHistory as ConsumptionRecord[];
    if (typedHistory.length === 0) return 1;

    const totalConsumption = typedHistory.reduce((sum, item) => sum + item.quantity, 0);
    return totalConsumption / typedHistory.length;
  }
}
