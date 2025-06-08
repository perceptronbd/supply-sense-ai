import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../app/prisma.service";
import { GeminiService } from "./gemini.service";

interface QualityAnalysis {
  supplierId: string;
  supplierName: string;
  qualityScore: number;
  totalReceipts: number;
  issueCount: number;
  issueTypes: string[];
  recommendations: string[];
  trend: "improving" | "declining" | "stable";
}

interface AnomalyDetection {
  grId: string;
  grNumber: string;
  anomalies: string[];
  severity: "low" | "medium" | "high";
  recommendations: string[];
}

@Injectable()
export class QualityAnalysisService {
  private readonly logger = new Logger(QualityAnalysisService.name);

  constructor(
    private prisma: PrismaService,
    private geminiService: GeminiService
  ) {}

  async analyzeSupplierQuality(
    supplierId?: string
  ): Promise<QualityAnalysis[]> {
    try {
      const suppliers = await this.getSupplierQualityData(supplierId);
      const analyses: QualityAnalysis[] = [];

      for (const supplier of suppliers) {
        const analysis = await this.analyzeSupplierWithAI(supplier);
        analyses.push(analysis);
      }

      return analyses.sort((a, b) => b.qualityScore - a.qualityScore);
    } catch (error) {
      this.logger.error("Error analyzing supplier quality:", error);
      throw new Error("Failed to analyze supplier quality");
    }
  }

  private async getSupplierQualityData(supplierId?: string) {
    const where = supplierId ? { id: supplierId } : {};

    return this.prisma.supplier.findMany({
      where,
      include: {
        purchaseOrders: {
          where: {
            status: "CONFIRMED",
          },
          include: {
            goodsReceipts: {
              where: {
                status: "POSTED",
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

  private async analyzeSupplierWithAI(
    supplierData: any
  ): Promise<QualityAnalysis> {
    const grItems = supplierData.purchaseOrders.flatMap((po) =>
      po.goodsReceipts.flatMap((gr) => gr.items)
    );

    const qualityIssues = grItems.filter(
      (item) =>
        item.qualityNotes &&
        (item.qualityNotes.toLowerCase().includes("issue") ||
          item.qualityNotes.toLowerCase().includes("defect") ||
          item.qualityNotes.toLowerCase().includes("damage"))
    );

    const recentData = grItems.filter((item) => {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return new Date(item.gr.receiptDate) >= threeMonthsAgo;
    });

    const prompt = `
      Analyze supplier quality performance:
      
      Supplier: ${supplierData.name}
      Total Receipts: ${grItems.length}
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
      const analysis = JSON.parse(aiResponse);

      return {
        supplierId: supplierData.id,
        supplierName: supplierData.name,
        qualityScore:
          analysis.qualityScore ||
          this.calculateFallbackQualityScore(
            grItems.length,
            qualityIssues.length
          ),
        totalReceipts: grItems.length,
        issueCount: qualityIssues.length,
        issueTypes:
          analysis.issueTypes || this.extractIssueTypes(qualityIssues),
        recommendations: analysis.recommendations || [
          "Review quality control procedures",
        ],
        trend: analysis.trend || "stable",
      };
    } catch (error) {
      this.logger.error("Error in AI quality analysis:", error);

      return {
        supplierId: supplierData.id,
        supplierName: supplierData.name,
        qualityScore: this.calculateFallbackQualityScore(
          grItems.length,
          qualityIssues.length
        ),
        totalReceipts: grItems.length,
        issueCount: qualityIssues.length,
        issueTypes: this.extractIssueTypes(qualityIssues),
        recommendations: ["Manual quality review recommended"],
        trend: "stable",
      };
    }
  }

  private calculateFallbackQualityScore(
    totalReceipts: number,
    issueCount: number
  ): number {
    if (totalReceipts === 0) return 100;
    return Math.max(
      0,
      Math.round(((totalReceipts - issueCount) / totalReceipts) * 100)
    );
  }

  private extractIssueTypes(qualityIssues: any[]): string[] {
    const issueTypes = new Set<string>();

    qualityIssues.forEach((item) => {
      const notes = item.qualityNotes?.toLowerCase() || "";
      if (notes.includes("damage")) issueTypes.add("Physical Damage");
      if (notes.includes("defect")) issueTypes.add("Manufacturing Defect");
      if (notes.includes("quantity")) issueTypes.add("Quantity Discrepancy");
      if (notes.includes("delay")) issueTypes.add("Delivery Delay");
      if (notes.includes("packaging")) issueTypes.add("Packaging Issue");
    });

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
        throw new Error("Goods receipt not found");
      }

      return this.analyzeGRForAnomalies(goodsReceipt);
    } catch (error) {
      this.logger.error("Error detecting goods receipt anomalies:", error);
      throw new Error("Failed to detect anomalies");
    }
  }

  private async analyzeGRForAnomalies(
    goodsReceipt: any
  ): Promise<AnomalyDetection> {
    const anomalies: string[] = [];
    let severity: "low" | "medium" | "high" = "low";

    // Basic anomaly checks
    for (const grItem of goodsReceipt.items) {
      const orderedQty = Number(grItem.orderedQty);
      const receivedQty = Number(grItem.receivedQty);

      if (receivedQty > orderedQty * 1.1) {
        anomalies.push(
          `Received quantity (${receivedQty}) significantly exceeds ordered quantity (${orderedQty}) for ${grItem.item.name}`
        );
        severity = "medium";
      }

      if (receivedQty < orderedQty * 0.8) {
        anomalies.push(
          `Received quantity (${receivedQty}) significantly less than ordered quantity (${orderedQty}) for ${grItem.item.name}`
        );
        severity = "medium";
      }

      if (
        grItem.qualityNotes &&
        grItem.qualityNotes.toLowerCase().includes("issue")
      ) {
        anomalies.push(
          `Quality issue noted for ${grItem.item.name}: ${grItem.qualityNotes}`
        );
        severity = "high";
      }
    }

    // AI-powered anomaly detection
    const prompt = `
      Analyze this goods receipt for anomalies and patterns:
      
      GR Number: ${goodsReceipt.grNumber}
      Supplier: ${goodsReceipt.purchaseOrder?.supplier?.name || "Unknown"}
      Items: ${JSON.stringify(
        goodsReceipt.items.map((item) => ({
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
      const analysis = JSON.parse(aiResponse);

      if (analysis.additionalAnomalies) {
        anomalies.push(...analysis.additionalAnomalies);
      }

      if (
        analysis.severityAssessment &&
        ["low", "medium", "high"].includes(analysis.severityAssessment)
      ) {
        severity = analysis.severityAssessment;
      }

      return {
        grId: goodsReceipt.id,
        grNumber: goodsReceipt.grNumber,
        anomalies,
        severity,
        recommendations: analysis.recommendations || [
          "No specific recommendations",
        ],
      };
    } catch (error) {
      this.logger.error("Error in AI anomaly detection:", error);

      return {
        grId: goodsReceipt.id,
        grNumber: goodsReceipt.grNumber,
        anomalies,
        severity,
        recommendations: [
          "Manual review recommended due to AI processing error",
        ],
      };
    }
  }

  async generateQualityReport(
    branchId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    try {
      const whereClause: any = {};
      if (branchId) whereClause.branchId = branchId;
      if (startDate && endDate) {
        whereClause.receiptDate = {
          gte: startDate,
          lte: endDate,
        };
      }

      const goodsReceipts = await this.prisma.goodsReceipt.findMany({
        where: {
          status: "POSTED",
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
          startDate: startDate || "All time",
          endDate: endDate || "Current",
        },
        metrics: qualityMetrics,
        report: reportText,
        generatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error("Error generating quality report:", error);
      throw new Error("Failed to generate quality report");
    }
  }

  private calculateQualityMetrics(goodsReceipts: any[]) {
    const totalReceipts = goodsReceipts.length;
    const totalItems = goodsReceipts.reduce(
      (sum, gr) => sum + gr.items.length,
      0
    );

    const itemsWithIssues = goodsReceipts.reduce(
      (sum, gr) =>
        sum +
        gr.items.filter(
          (item) =>
            item.qualityNotes &&
            item.qualityNotes.toLowerCase().includes("issue")
        ).length,
      0
    );

    const supplierMetrics = new Map();

    goodsReceipts.forEach((gr) => {
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
        metrics.itemsWithIssues += gr.items.filter(
          (item) =>
            item.qualityNotes &&
            item.qualityNotes.toLowerCase().includes("issue")
        ).length;
      }
    });

    return {
      summary: {
        totalReceipts,
        totalItems,
        itemsWithIssues,
        qualityRate:
          totalItems > 0
            ? (((totalItems - itemsWithIssues) / totalItems) * 100).toFixed(2)
            : "100.00",
      },
      supplierPerformance: Array.from(supplierMetrics.values()).map(
        (supplier) => ({
          ...supplier,
          qualityRate:
            supplier.totalReceipts > 0
              ? (
                  ((supplier.totalReceipts - supplier.itemsWithIssues) /
                    supplier.totalReceipts) *
                  100
                ).toFixed(2)
              : "100.00",
        })
      ),
    };
  }

  async analyzeItemQuality(itemId: string, branchId?: string): Promise<any> {
    try {
      const whereClause: any = { itemId };
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
            receiptDate: "desc",
          },
        },
        take: 50,
      });

      const qualityIssues = grItems.filter(
        (item) =>
          item.qualityNotes && item.qualityNotes.toLowerCase().includes("issue")
      );

      return {
        itemId,
        itemName: grItems[0]?.item.name || "Unknown",
        totalReceipts: grItems.length,
        qualityIssues: qualityIssues.length,
        qualityRate:
          grItems.length > 0
            ? ((grItems.length - qualityIssues.length) / grItems.length) * 100
            : "100.00",
        recentIssues: qualityIssues.slice(0, 5).map((item) => ({
          grNumber: item.goodsReceipt.grNumber,
          supplier:
            item.goodsReceipt.purchaseOrder?.supplier?.name || "Unknown",
          notes: item.qualityNotes,
        })),
      };
    } catch (error) {
      this.logger.error(`Error analyzing item quality for ${itemId}:`, error);
      throw new Error("Failed to analyze item quality");
    }
  }
}
