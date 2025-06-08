import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../app/prisma.service";
import { GeminiService } from "./gemini.service";

interface AutoApprovalDecision {
  shouldAutoApprove: boolean;
  confidence: number;
  reasoning: string[];
  requiredApprovers: string[];
  estimatedProcessingTime: number;
}

interface WorkflowOptimization {
  currentWorkflow: string;
  bottlenecks: string[];
  optimizations: string[];
  estimatedTimeSaving: number;
  implementationComplexity: "low" | "medium" | "high";
}

interface SmartRouting {
  documentType: "PR" | "PO" | "GR";
  documentId: string;
  recommendedApprovers: string[];
  priorityLevel: "low" | "medium" | "high";
  estimatedApprovalTime: number;
  escalationRules: string[];
}

@Injectable()
export class WorkflowAutomationService {
  private readonly logger = new Logger(WorkflowAutomationService.name);

  constructor(
    private prisma: PrismaService,
    private geminiService: GeminiService
  ) {}

  async evaluatePRForAutoApproval(prId: string): Promise<AutoApprovalDecision> {
    try {
      const purchaseRequest = await this.prisma.purchaseRequest.findUnique({
        where: { id: prId },
        include: {
          items: {
            include: {
              item: true,
            },
          },
          createdBy: true,
          branch: true,
        },
      });

      if (!purchaseRequest) {
        throw new Error("Purchase request not found");
      }

      return this.analyzePRForAutoApproval(purchaseRequest);
    } catch (error) {
      this.logger.error("Error evaluating PR for auto-approval:", error);
      throw new Error("Failed to evaluate PR for auto-approval");
    }
  }

  private async analyzePRForAutoApproval(
    pr: any
  ): Promise<AutoApprovalDecision> {
    // Get historical data for analysis
    const historicalPRs = await this.getHistoricalPRData(
      pr.requestedById,
      pr.branchId
    );
    const budgetData = await this.getBudgetData(pr.branchId);

    const totalValue = pr.items.reduce(
      (sum, item) =>
        sum + Number(item.estimatedUnitPrice) * Number(item.requestedQty),
      0
    );

    const prompt = `
      Evaluate this Purchase Request for automatic approval:
      
      PR Details:
      - Total Value: $${totalValue}
      - Items: ${pr.items.length}
      - Requested by: ${pr.requestedBy.firstName} ${pr.requestedBy.lastName}
      - Department: ${pr.department}
      - Justification: ${pr.justification}
      - Priority: ${pr.priority}
      
      Items:
      ${JSON.stringify(
        pr.items.map((item) => ({
          name: item.item.name,
          quantity: item.requestedQty,
          estimatedPrice: item.estimatedUnitPrice,
        }))
      )}
      
      Historical Context:
      - Requester's past PRs: ${historicalPRs.totalPRs}
      - Average approval time: ${historicalPRs.avgApprovalTime} days
      - Rejection rate: ${historicalPRs.rejectionRate}%
      
      Budget Context:
      - Monthly budget utilization: ${budgetData.utilizationRate}%
      - Available budget: $${budgetData.availableBudget}
      
      Evaluation Criteria:
      1. Value thresholds ($500 = auto, $1000-5000 = manager, >$5000 = senior approval)
      2. Requester reliability and history
      3. Budget availability
      4. Item risk categorization
      5. Urgency and business impact
      
      Return JSON:
      {
        "shouldAutoApprove": boolean,
        "confidence": number (0-100),
        "reasoning": ["reason1", "reason2"],
        "requiredApprovers": ["approver_role1", "approver_role2"],
        "estimatedProcessingTime": number (hours)
      }
    `;

    try {
      const aiResponse = await this.geminiService.generateText(prompt);
      const decision = JSON.parse(aiResponse);

      return {
        shouldAutoApprove: decision.shouldAutoApprove || false,
        confidence: decision.confidence || 50,
        reasoning: decision.reasoning || ["AI analysis completed"],
        requiredApprovers: decision.requiredApprovers || ["Manager"],
        estimatedProcessingTime: decision.estimatedProcessingTime || 24,
      };
    } catch (error) {
      this.logger.error("Error in AI auto-approval analysis:", error);

      // Fallback logic
      const shouldAutoApprove =
        totalValue < 500 && historicalPRs.rejectionRate < 10;

      return {
        shouldAutoApprove,
        confidence: 60,
        reasoning: ["Fallback evaluation based on value and history"],
        requiredApprovers:
          totalValue > 1000 ? ["Manager", "Senior Manager"] : ["Manager"],
        estimatedProcessingTime: 24,
      };
    }
  }

  private async getHistoricalPRData(requesterId: string, branchId: string) {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const historicalPRs = await this.prisma.purchaseRequest.findMany({
      where: {
        createdById: requesterId,
        branchId,
        createdAt: {
          gte: ninetyDaysAgo,
        },
      },
    });

    const approvedPRs = historicalPRs.filter((pr) => pr.status === "APPROVED");
    const rejectedPRs = historicalPRs.filter((pr) => pr.status === "REJECTED");

    const avgApprovalTime =
      approvedPRs.length > 0
        ? approvedPRs.reduce((sum, pr) => {
            if (pr.approvedAt && pr.createdAt) {
              return (
                sum +
                Math.abs(pr.approvedAt.getTime() - pr.createdAt.getTime()) /
                  (1000 * 60 * 60 * 24)
              );
            }
            return sum;
          }, 0) / approvedPRs.length
        : 0;

    return {
      totalPRs: historicalPRs.length,
      approvedPRs: approvedPRs.length,
      rejectedPRs: rejectedPRs.length,
      rejectionRate:
        historicalPRs.length > 0
          ? (rejectedPRs.length / historicalPRs.length) * 100
          : 0,
      avgApprovalTime,
    };
  }

  private async getBudgetData(branchId: string) {
    // This would integrate with your budget system
    // For now, returning mock data
    return {
      monthlyBudget: 50000,
      spentThisMonth: 30000,
      availableBudget: 20000,
      utilizationRate: 60,
    };
  }

  async optimizeWorkflow(
    workflowType: "PR" | "PO" | "GR"
  ): Promise<WorkflowOptimization> {
    try {
      const workflowData = await this.getWorkflowAnalysisData(workflowType);
      return this.analyzeWorkflowWithAI(workflowType, workflowData);
    } catch (error) {
      this.logger.error("Error optimizing workflow:", error);
      throw new Error("Failed to optimize workflow");
    }
  }

  private async getWorkflowAnalysisData(workflowType: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let data;

    switch (workflowType) {
      case "PR":
        data = await this.prisma.purchaseRequest.findMany({
          where: {
            createdAt: { gte: thirtyDaysAgo },
          },
          include: {
            items: true,
          },
        });
        break;
      case "PO":
        data = await this.prisma.purchaseOrder.findMany({
          where: {
            createdAt: { gte: thirtyDaysAgo },
          },
          include: {
            items: true,
            goodsReceipts: true,
          },
        });
        break;
      case "GR":
        data = await this.prisma.goodsReceipt.findMany({
          where: {
            createdAt: { gte: thirtyDaysAgo },
          },
          include: {
            items: true,
          },
        });
        break;
      default:
        data = [];
    }

    return this.analyzeWorkflowTimings(data, workflowType);
  }

  private analyzeWorkflowTimings(data: any[], workflowType: string) {
    const timings = data
      .map((item) => {
        const created = new Date(item.createdAt);
        let processed = null;

        switch (workflowType) {
          case "PR":
            processed = item.approvedAt || item.rejectedAt;
            break;
          case "PO":
            processed = item.sentAt;
            break;
          case "GR":
            processed = item.postedAt;
            break;
        }

        if (processed) {
          const processingTime =
            Math.abs(new Date(processed).getTime() - created.getTime()) /
            (1000 * 60 * 60);
          return {
            id: item.id,
            processingTimeHours: processingTime,
            status: item.status,
            itemCount: item.items?.length || 0,
          };
        }

        return null;
      })
      .filter(Boolean);

    const avgProcessingTime =
      timings.length > 0
        ? timings.reduce((sum, t) => sum + t.processingTimeHours, 0) /
          timings.length
        : 0;

    return {
      totalDocuments: data.length,
      processedDocuments: timings.length,
      avgProcessingTimeHours: avgProcessingTime,
      timings,
    };
  }

  private async analyzeWorkflowWithAI(
    workflowType: string,
    workflowData: any
  ): Promise<WorkflowOptimization> {
    const prompt = `
      Analyze this ${workflowType} workflow and recommend optimizations:
      
      Current Performance:
      - Total documents (30 days): ${workflowData.totalDocuments}
      - Processed documents: ${workflowData.processedDocuments}
      - Average processing time: ${workflowData.avgProcessingTimeHours.toFixed(
        2
      )} hours
      
      Processing Details:
      ${JSON.stringify(workflowData.timings.slice(0, 10))}
      
      Identify:
      1. Current workflow bottlenecks
      2. Optimization opportunities
      3. Estimated time savings
      4. Implementation complexity
      
      Return JSON:
      {
        "bottlenecks": ["bottleneck1", "bottleneck2"],
        "optimizations": ["optimization1", "optimization2"],
        "estimatedTimeSaving": number (percentage),
        "implementationComplexity": "low|medium|high"
      }
    `;

    try {
      const aiResponse = await this.geminiService.generateText(prompt);
      const analysis = JSON.parse(aiResponse);

      return {
        currentWorkflow: `${workflowType} Processing`,
        bottlenecks: analysis.bottlenecks || [
          "No specific bottlenecks identified",
        ],
        optimizations: analysis.optimizations || [
          "No specific optimizations identified",
        ],
        estimatedTimeSaving: analysis.estimatedTimeSaving || 0,
        implementationComplexity: analysis.implementationComplexity || "medium",
      };
    } catch (error) {
      this.logger.error("Error in AI workflow analysis:", error);

      return {
        currentWorkflow: `${workflowType} Processing`,
        bottlenecks: ["AI analysis error - manual review needed"],
        optimizations: [
          "Implement automated approval thresholds",
          "Add parallel processing",
        ],
        estimatedTimeSaving: 15,
        implementationComplexity: "medium",
      };
    }
  }

  async routeDocumentIntelligently(
    documentType: "PR" | "PO" | "GR",
    documentId: string
  ): Promise<SmartRouting> {
    try {
      let document;

      switch (documentType) {
        case "PR":
          document = await this.prisma.purchaseRequest.findUnique({
            where: { id: documentId },
            include: { items: true, createdBy: true },
          });
          break;
        case "PO":
          document = await this.prisma.purchaseOrder.findUnique({
            where: { id: documentId },
            include: { items: true, createdBy: true },
          });
          break;
        case "GR":
          document = await this.prisma.goodsReceipt.findUnique({
            where: { id: documentId },
            include: { items: true, receivedBy: true },
          });
          break;
      }

      if (!document) {
        throw new Error(`${documentType} not found`);
      }

      return this.generateSmartRouting(documentType, document);
    } catch (error) {
      this.logger.error("Error in intelligent document routing:", error);
      throw new Error("Failed to route document intelligently");
    }
  }

  private async generateSmartRouting(
    documentType: string,
    document: any
  ): Promise<SmartRouting> {
    const totalValue =
      document.items?.reduce(
        (sum, item) =>
          sum +
          Number(item.estimatedUnitPrice || item.unitPrice || 0) *
            Number(item.requestedQty || item.quantity || 0),
        0
      ) || 0;

    const prompt = `
      Determine intelligent routing for this ${documentType}:
      
      Document Value: $${totalValue}
      Items Count: ${document.items?.length || 0}
      Creator: ${
        document.requestedBy?.firstName ||
        document.createdBy?.firstName ||
        "Unknown"
      }
      Priority: ${document.priority || "MEDIUM"}
      Department: ${document.department || "Unknown"}
      
      Business Rules:
      - <$500: Auto-approve or supervisor
      - $500-$2000: Department manager
      - $2000-$10000: Senior manager + finance
      - >$10000: Executive approval required
      
      Consider:
      - Document complexity
      - Risk factors
      - Approver availability
      - Escalation thresholds
      
      Return JSON:
      {
        "recommendedApprovers": ["role1", "role2"],
        "priorityLevel": "low|medium|high",
        "estimatedApprovalTime": number (hours),
        "escalationRules": ["rule1", "rule2"]
      }
    `;

    try {
      const aiResponse = await this.geminiService.generateText(prompt);
      const routing = JSON.parse(aiResponse);

      return {
        documentType: documentType as "PR" | "PO" | "GR",
        documentId: document.id,
        recommendedApprovers: routing.recommendedApprovers || ["Manager"],
        priorityLevel: routing.priorityLevel || "medium",
        estimatedApprovalTime: routing.estimatedApprovalTime || 24,
        escalationRules: routing.escalationRules || ["Escalate after 48 hours"],
      };
    } catch (error) {
      this.logger.error("Error in AI smart routing:", error);

      // Fallback routing logic
      let approvers = ["Manager"];
      let priority: "low" | "medium" | "high" = "medium";

      if (totalValue > 10000) {
        approvers = ["Senior Manager", "Finance Director", "Executive"];
        priority = "high";
      } else if (totalValue > 2000) {
        approvers = ["Senior Manager", "Finance Manager"];
        priority = "medium";
      }

      return {
        documentType: documentType as "PR" | "PO" | "GR",
        documentId: document.id,
        recommendedApprovers: approvers,
        priorityLevel: priority,
        estimatedApprovalTime: 24,
        escalationRules: ["Escalate after 48 hours if no response"],
      };
    }
  }

  async evaluateForAutoApproval(
    documentId: string,
    documentType: string
  ): Promise<any> {
    return this.evaluatePRForAutoApproval(documentId);
  }

  async generateIntelligentPR(
    branchId: string,
    urgency?: string,
    category?: string
  ): Promise<any[]> {
    try {
      // Get low stock items
      const lowStockItems = await this.prisma.stock.findMany({
        where: {
          branchId,
          quantity: { lte: 10 }, // Low stock threshold
        },
        include: { item: true },
        take: 20,
      });

      const suggestions = [];
      for (const stock of lowStockItems) {
        // Calculate suggested quantity based on consumption patterns
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const consumption = await this.prisma.gRItem.findMany({
          where: {
            itemId: stock.itemId,
            goodsReceipt: {
              branchId,
              postedAt: { gte: sixMonthsAgo },
            },
          },
        });

        const totalConsumption = consumption.reduce(
          (sum, item) => sum + Number(item.receivedQty),
          0
        );
        const avgMonthlyConsumption = totalConsumption / 6;
        const suggestedQty = Math.ceil(avgMonthlyConsumption * 2); // 2 months supply

        suggestions.push({
          itemId: stock.itemId,
          itemName: stock.item.name,
          currentStock: Number(stock.quantity),
          suggestedQuantity: Math.max(suggestedQty, 10),
          urgency: Number(stock.quantity) <= 5 ? "high" : "medium",
          reasoning: `Current stock: ${
            stock.quantity
          }, Average monthly usage: ${avgMonthlyConsumption.toFixed(1)}`,
        });
      }

      return suggestions.sort((a, b) => {
        const urgencyOrder = { high: 3, medium: 2, low: 1 };
        return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      });
    } catch (error) {
      this.logger.error("Error generating intelligent PR suggestions:", error);
      throw new Error("Failed to generate intelligent PR suggestions");
    }
  }
}
