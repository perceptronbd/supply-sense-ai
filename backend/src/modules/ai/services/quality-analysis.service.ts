import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../app/prisma.service';
import {
  GRItemWithReceiptAccess,
  GoodsReceiptData,
  type QualityWhereClause,
  SupplierData,
  type SupplierWithQualityData,
} from '../interfaces/ai-service.interface';
import { GeminiService } from './gemini.service';

interface QualityAnalysis {
  supplierId: string;
  supplierName: string;
  qualityScore: number;
  totalReceipts: number;
  issueCount: number;
  issueTypes: string[];
  recommendations: string[];
  trend: 'improving' | 'declining' | 'stable';
}

interface AnomalyDetection {
  grId: string;
  grNumber: string;
  anomalies: string[];
  severity: 'low' | 'medium' | 'high';
  recommendations: string[];
}

@Injectable()
export class QualityAnalysisService {
  private readonly logger = new Logger(QualityAnalysisService.name);

  constructor(
    private prisma: PrismaService,
    private geminiService: GeminiService
  ) {}

  async analyzeSupplierQuality(supplierId?: string): Promise<QualityAnalysis[]> {
    try {
      const suppliers = await this.getSupplierQualityData(supplierId);
      const analyses: QualityAnalysis[] = [];

      for (const supplier of suppliers) {
        const analysis = await this.analyzeSupplierWithAI(supplier);
        analyses.push(analysis);
      }

      return analyses.sort((a, b) => b.qualityScore - a.qualityScore);
    } catch (error) {
      this.logger.error('Error analyzing supplier quality:', error);
      throw new Error('Failed to analyze supplier quality');
    }
  }

  private async getSupplierQualityData(supplierId?: string) {
    const where = supplierId ? { id: supplierId } : {};

    return this.prisma.supplier.findMany({
      where,
      include: {
        purchaseOrders: {
          where: {
            status: 'CONFIRMED',
          },
          include: {
            goodsReceipts: {
              where: {
                status: 'POSTED',
              },
              include: {
                items: {
                  include: {
                    item: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  private async analyzeSupplierWithAI(supplierData: unknown): Promise<QualityAnalysis> {
    const typedSupplierData = supplierData as SupplierWithQualityData;

    // Flatten items while preserving receipt date
    const grItemsWithDates = typedSupplierData.purchaseOrders.flatMap((po) =>
      po.goodsReceipts.flatMap((gr) =>
        gr.items.map((item) => ({
          ...item,
          receiptDate: gr.receiptDate,
        }))
      )
    );

    const qualityIssues = grItemsWithDates.filter(
      (item) =>
        item.qualityNotes &&
        (item.qualityNotes.toLowerCase().includes('issue') ||
          item.qualityNotes.toLowerCase().includes('defect') ||
          item.qualityNotes.toLowerCase().includes('damage'))
    );

    const recentData = grItemsWithDates.filter((item) => {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return new Date(item.receiptDate) >= threeMonthsAgo;
    });

    const prompt = `
      Analyze supplier quality performance:
      
      Supplier: ${typedSupplierData.name}
      Total Receipts: ${grItemsWithDates.length}
      Quality Issues: ${qualityIssues.length}
      Recent Quality Notes: ${JSON.stringify(
        qualityIssues.map((item) => item.qualityNotes).slice(0, 10)
      )}
      Recent Performance (3 months): ${recentData.length} receipts
      
      Analyze:
      1. Overall quality score (0-100)
      2. Common issue types
      3. Quality trend (improving/declining/stable)
      4. Specific recommendations
      
      Return JSON:
      {
        "qualityScore": number,
        "issueTypes": ["type1", "type2"],
        "trend": "improving|declining|stable",
        "recommendations": ["rec1", "rec2"]
      }
    `;

    try {
      const aiResponse = await this.geminiService.generateText(prompt);
      const cleanedResponse = this.cleanJsonResponse(aiResponse);
      const analysis = JSON.parse(cleanedResponse);

      return {
        supplierId: typedSupplierData.id,
        supplierName: typedSupplierData.name,
        qualityScore:
          analysis.qualityScore ||
          this.calculateFallbackQualityScore(grItemsWithDates.length, qualityIssues.length),
        totalReceipts: grItemsWithDates.length,
        issueCount: qualityIssues.length,
        issueTypes: analysis.issueTypes || this.extractIssueTypes(qualityIssues),
        recommendations: analysis.recommendations || ['Review quality control procedures'],
        trend: analysis.trend || 'stable',
      };
    } catch (error) {
      this.logger.error('Error in AI quality analysis:', error);

      return {
        supplierId: typedSupplierData.id,
        supplierName: typedSupplierData.name,
        qualityScore: this.calculateFallbackQualityScore(
          grItemsWithDates.length,
          qualityIssues.length
        ),
        totalReceipts: grItemsWithDates.length,
        issueCount: qualityIssues.length,
        issueTypes: this.extractIssueTypes(qualityIssues),
        recommendations: ['Manual quality review recommended'],
        trend: 'stable',
      };
    }
  }

  private calculateFallbackQualityScore(totalReceipts: number, issueCount: number): number {
    if (totalReceipts === 0) return 100;
    return Math.max(0, Math.round(((totalReceipts - issueCount) / totalReceipts) * 100));
  }

  private extractIssueTypes(qualityIssues: unknown[]): string[] {
    interface QualityIssueItem {
      qualityNotes?: string;
    }
    const typedIssues = qualityIssues as QualityIssueItem[];
    const issueTypes = new Set<string>();

    for (const item of typedIssues) {
      const notes = item.qualityNotes?.toLowerCase() || '';
      if (notes.includes('damage')) issueTypes.add('Physical Damage');
      if (notes.includes('defect')) issueTypes.add('Manufacturing Defect');
      if (notes.includes('quantity')) issueTypes.add('Quantity Discrepancy');
      if (notes.includes('delay')) issueTypes.add('Delivery Delay');
      if (notes.includes('packaging')) issueTypes.add('Packaging Issue');
    }

    return Array.from(issueTypes);
  }

  async detectGoodsReceiptAnomalies(grId: string): Promise<AnomalyDetection> {
    try {
      const goodsReceipt = await this.prisma.goodsReceipt.findUnique({
        where: { id: grId },
        include: {
          items: {
            include: {
              item: true,
            },
          },
          purchaseOrder: {
            include: {
              items: true,
              supplier: true,
            },
          },
        },
      });

      if (!goodsReceipt) {
        throw new Error('Goods receipt not found');
      }

      return this.analyzeGRForAnomalies(goodsReceipt);
    } catch (error) {
      this.logger.error('Error detecting goods receipt anomalies:', error);
      throw new Error('Failed to detect anomalies');
    }
  }

  private async analyzeGRForAnomalies(goodsReceipt: unknown): Promise<AnomalyDetection> {
    interface GoodsReceiptForAnalysis {
      id: string;
      grNumber?: string;
      receiptDate: Date;
      items: Array<{
        id: string;
        itemId: string;
        receivedQty: number;
        orderedQty: number;
        qualityNotes?: string;
        unitPrice?: number;
        item: {
          name: string;
        };
      }>;
      purchaseOrder: {
        expectedDeliveryDate: Date;
        items: Array<{ quantity: number }>;
        supplier?: {
          name: string;
        };
      };
    }
    const typedGR = goodsReceipt as GoodsReceiptForAnalysis;
    const anomalies: string[] = [];
    let severity: 'low' | 'medium' | 'high' = 'low';

    // Basic anomaly checks
    for (const grItem of typedGR.items) {
      const orderedQty = Number(grItem.orderedQty);
      const receivedQty = Number(grItem.receivedQty);

      if (receivedQty > orderedQty * 1.1) {
        anomalies.push(
          `Received quantity (${receivedQty}) significantly exceeds ordered quantity (${orderedQty}) for ${grItem.item.name}`
        );
        severity = 'medium';
      }

      if (receivedQty < orderedQty * 0.8) {
        anomalies.push(
          `Received quantity (${receivedQty}) significantly less than ordered quantity (${orderedQty}) for ${grItem.item.name}`
        );
        severity = 'medium';
      }

      if (grItem.qualityNotes?.toLowerCase().includes('issue')) {
        anomalies.push(`Quality issue noted for ${grItem.item.name}: ${grItem.qualityNotes}`);
        severity = 'high';
      }
    }

    // AI-powered anomaly detection
    const prompt = `
      Analyze this goods receipt for anomalies and patterns:
      
      GR Number: ${typedGR.grNumber}
      Supplier: ${typedGR.purchaseOrder?.supplier?.name || 'Unknown'}
      Items: ${JSON.stringify(
        typedGR.items.map((item) => ({
          name: item.item.name,
          ordered: item.orderedQty,
          received: item.receivedQty,
          unitPrice: item.unitPrice,
          qualityNotes: item.qualityNotes,
        }))
      )}
      
      Detect additional anomalies like:
      - Unusual pricing patterns
      - Suspicious delivery timing
      - Inconsistent quality patterns
      - Potential fraud indicators
      
      Return JSON:
      {
        "additionalAnomalies": ["anomaly1", "anomaly2"],
        "severityAssessment": "low|medium|high",
        "recommendations": ["rec1", "rec2"]
      }
    `;

    try {
      const aiResponse = await this.geminiService.generateText(prompt);
      const cleanedResponse = this.cleanJsonResponse(aiResponse);
      const analysis = JSON.parse(cleanedResponse);

      if (analysis.additionalAnomalies) {
        anomalies.push(...analysis.additionalAnomalies);
      }

      if (
        analysis.severityAssessment &&
        ['low', 'medium', 'high'].includes(analysis.severityAssessment)
      ) {
        severity = analysis.severityAssessment;
      }

      return {
        grId: typedGR.id,
        grNumber: typedGR.grNumber,
        anomalies,
        severity,
        recommendations: analysis.recommendations || ['No specific recommendations'],
      };
    } catch (error) {
      this.logger.error('Error in AI anomaly detection:', error);

      return {
        grId: typedGR.id,
        grNumber: typedGR.grNumber,
        anomalies,
        severity,
        recommendations: ['Manual review recommended due to AI processing error'],
      };
    }
  }

  async generateQualityReport(
    branchId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<unknown> {
    try {
      const whereClause: QualityWhereClause = {};
      if (branchId) whereClause.branchId = branchId;
      if (startDate && endDate) {
        whereClause.receiptDate = {
          gte: startDate,
          lte: endDate,
        };
      }

      const goodsReceipts = await this.prisma.goodsReceipt.findMany({
        where: {
          status: 'POSTED',
          ...whereClause,
        },
        include: {
          items: {
            include: {
              item: true,
            },
          },
          purchaseOrder: {
            include: {
              supplier: true,
            },
          },
        },
      });

      const qualityMetrics = this.calculateQualityMetrics(goodsReceipts);

      const prompt = `
        Generate a comprehensive quality analysis report based on this data:
        
        ${JSON.stringify(qualityMetrics)}
        
        Include:
        - Executive summary
        - Key quality trends
        - Supplier performance rankings
        - Areas for improvement
        - Action recommendations
        
        Format as a structured report.
      `;

      const reportText = await this.geminiService.generateText(prompt);

      return {
        period: {
          startDate: startDate || 'All time',
          endDate: endDate || 'Current',
        },
        metrics: qualityMetrics,
        report: reportText,
        generatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Error generating quality report:', error);
      throw new Error('Failed to generate quality report');
    }
  }

  private calculateQualityMetrics(goodsReceipts: unknown[]) {
    interface GoodsReceiptForMetrics {
      id: string;
      items: Array<{
        qualityNotes?: string;
      }>;
      purchaseOrder?: {
        supplier?: {
          id: string;
          name: string;
        };
      };
    }
    const typedReceipts = goodsReceipts as GoodsReceiptForMetrics[];
    const totalReceipts = typedReceipts.length;
    const totalItems = typedReceipts.reduce((sum, gr) => sum + gr.items.length, 0);

    const itemsWithIssues = typedReceipts.reduce(
      (sum, gr) =>
        sum + gr.items.filter((item) => item.qualityNotes?.toLowerCase().includes('issue')).length,
      0
    );

    const supplierMetrics = new Map();

    for (const gr of typedReceipts) {
      if (gr.purchaseOrder?.supplier) {
        const supplierId = gr.purchaseOrder.supplier.id;
        if (!supplierMetrics.has(supplierId)) {
          supplierMetrics.set(supplierId, {
            name: gr.purchaseOrder.supplier.name,
            totalReceipts: 0,
            itemsWithIssues: 0,
          });
        }

        const metrics = supplierMetrics.get(supplierId);
        metrics.totalReceipts++;
        metrics.itemsWithIssues += gr.items.filter((item) =>
          item.qualityNotes?.toLowerCase().includes('issue')
        ).length;
      }
    }

    return {
      summary: {
        totalReceipts,
        totalItems,
        itemsWithIssues,
        qualityRate:
          totalItems > 0
            ? (((totalItems - itemsWithIssues) / totalItems) * 100).toFixed(2)
            : '100.00',
      },
      supplierPerformance: Array.from(supplierMetrics.values()).map((supplier) => ({
        ...supplier,
        qualityRate:
          supplier.totalReceipts > 0
            ? (
                ((supplier.totalReceipts - supplier.itemsWithIssues) / supplier.totalReceipts) *
                100
              ).toFixed(2)
            : '100.00',
      })),
    };
  }

  async analyzeItemQuality(itemId: string, branchId?: string): Promise<unknown> {
    try {
      const whereClause: QualityWhereClause = { itemId };
      if (branchId) {
        whereClause.goodsReceipt = { branchId };
      }

      const grItems = await this.prisma.gRItem.findMany({
        where: whereClause,
        include: {
          item: true,
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
            receiptDate: 'desc',
          },
        },
        take: 50,
      });

      const qualityIssues = grItems.filter((item) =>
        item.qualityNotes?.toLowerCase().includes('issue')
      );

      return {
        itemId,
        itemName: grItems[0]?.item.name || 'Unknown',
        totalReceipts: grItems.length,
        qualityIssues: qualityIssues.length,
        qualityRate:
          grItems.length > 0
            ? ((grItems.length - qualityIssues.length) / grItems.length) * 100
            : '100.00',
        recentIssues: qualityIssues.slice(0, 5).map((item) => ({
          grNumber: item.goodsReceipt.grNumber,
          supplier: item.goodsReceipt.purchaseOrder?.supplier?.name || 'Unknown',
          notes: item.qualityNotes,
        })),
      };
    } catch (error) {
      this.logger.error(`Error analyzing item quality for ${itemId}:`, error);
      throw new Error('Failed to analyze item quality');
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
