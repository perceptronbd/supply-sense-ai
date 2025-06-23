import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../app/prisma.service';
import { type PurchaseRequestData, type WorkflowData } from '../interfaces/ai-service.interface';
import { GeminiService } from './gemini.service';

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
  implementationComplexity: 'low' | 'medium' | 'high';
}

interface SmartRouting {
  documentType: 'PR' | 'PO' | 'GR';
  documentId: string;
  recommendedApprovers: string[];
  priorityLevel: 'low' | 'medium' | 'high';
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
        throw new Error('Purchase request not found');
      }

      return this.analyzePRForAutoApproval(purchaseRequest);
    } catch (error) {
      this.logger.error('Error evaluating PR for auto-approval:', error);
      throw new Error('Failed to evaluate PR for auto-approval');
    }
  }

  private async analyzePRForAutoApproval(pr: unknown): Promise<AutoApprovalDecision> {
    const typedPR = pr as PurchaseRequestData;
    // Get historical data for analysis
    const historicalPRs = await this.getHistoricalPRData(typedPR.requestedById, typedPR.branchId);
    const budgetData = await this.getBudgetData(typedPR.branchId);

    const totalValue = typedPR.items.reduce(
      (sum, item) => sum + Number(item.estimatedPrice) * Number(item.requestedQty),
      0
    );

    const prompt = `
      Evaluate this Purchase Request for automatic approval:
      
      PR Details:
      - Total Value: $${totalValue}
      - Items: ${typedPR.items.length}
      - Requested by: ${typedPR.requestedById}
      - Branch: ${typedPR.branchId}
      - Title: ${typedPR.title}
      - Status: ${typedPR.status}
      
      Items:
      ${JSON.stringify(
        typedPR.items.map((item) => ({
          name: item.item.name,
          quantity: item.requestedQty,
          estimatedPrice: item.estimatedPrice,
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
      const cleanedResponse = this.cleanJsonResponse(aiResponse);
      const decision = JSON.parse(cleanedResponse);

      return {
        shouldAutoApprove: decision.shouldAutoApprove || false,
        confidence: decision.confidence || 50,
        reasoning: decision.reasoning || ['AI analysis completed'],
        requiredApprovers: decision.requiredApprovers || ['Manager'],
        estimatedProcessingTime: decision.estimatedProcessingTime || 24,
      };
    } catch (error) {
      this.logger.error('Error in AI auto-approval analysis:', error);

      // Fallback logic
      const shouldAutoApprove = totalValue < 500 && historicalPRs.rejectionRate < 10;

      return {
        shouldAutoApprove,
        confidence: 60,
        reasoning: ['Fallback evaluation based on value and history'],
        requiredApprovers: totalValue > 1000 ? ['Manager', 'Senior Manager'] : ['Manager'],
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

    const approvedPRs = historicalPRs.filter((pr) => pr.status === 'APPROVED');
    const rejectedPRs = historicalPRs.filter((pr) => pr.status === 'REJECTED');

    const avgApprovalTime =
      approvedPRs.length > 0
        ? approvedPRs.reduce((sum, pr) => {
            if (pr.approvedAt && pr.createdAt) {
              return (
                sum +
                Math.abs(pr.approvedAt.getTime() - pr.createdAt.getTime()) / (1000 * 60 * 60 * 24)
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
        historicalPRs.length > 0 ? (rejectedPRs.length / historicalPRs.length) * 100 : 0,
      avgApprovalTime,
    };
  }

  private async getBudgetData(_branchId: string) {
    // This would integrate with your budget system
    // For now, returning mock data
    return {
      monthlyBudget: 50000,
      spentThisMonth: 30000,
      availableBudget: 20000,
      utilizationRate: 60,
    };
  }

  async optimizeWorkflow(workflowType: 'PR' | 'PO' | 'GR'): Promise<WorkflowOptimization> {
    try {
      const workflowData = await this.getWorkflowAnalysisData(workflowType);
      return this.analyzeWorkflowWithAI(workflowType, workflowData);
    } catch (error) {
      this.logger.error('Error optimizing workflow:', error);
      throw new Error('Failed to optimize workflow');
    }
  }

  private async getWorkflowAnalysisData(workflowType: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let data: unknown[];

    switch (workflowType) {
      case 'PR':
        data = await this.prisma.purchaseRequest.findMany({
          where: {
            createdAt: { gte: thirtyDaysAgo },
          },
          include: {
            items: true,
          },
        });
        break;
      case 'PO':
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
      case 'GR':
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

  private analyzeWorkflowTimings(data: unknown[], workflowType: string) {
    const timings = data
      .map((item) => {
        const typedItem = item as WorkflowData & {
          approvedAt?: Date;
          rejectedAt?: Date;
          sentAt?: Date;
          postedAt?: Date;
        };
        const created = new Date(typedItem.createdAt);
        let processed = null;

        switch (workflowType) {
          case 'PR':
            processed = typedItem.approvedAt || typedItem.rejectedAt;
            break;
          case 'PO':
            processed = typedItem.sentAt;
            break;
          case 'GR':
            processed = typedItem.postedAt;
            break;
        }

        if (processed) {
          const processingTime =
            Math.abs(new Date(processed).getTime() - created.getTime()) / (1000 * 60 * 60);
          return {
            id: typedItem.id,
            processingTimeHours: processingTime,
            status: typedItem.status,
            itemCount: typedItem.items?.length || 0,
          };
        }

        return null;
      })
      .filter(Boolean);

    const avgProcessingTime =
      timings.length > 0
        ? timings.reduce((sum, t) => sum + t.processingTimeHours, 0) / timings.length
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
    workflowData: unknown
  ): Promise<WorkflowOptimization> {
    const typedData = workflowData as {
      totalDocuments: number;
      processedDocuments: number;
      avgProcessingTimeHours: number;
      timings: unknown[];
    };

    const prompt = `
      Analyze this ${workflowType} workflow and recommend optimizations:
      
      Current Performance:
      - Total documents (30 days): ${typedData.totalDocuments}
      - Processed documents: ${typedData.processedDocuments}
      - Average processing time: ${typedData.avgProcessingTimeHours.toFixed(2)} hours
      
      Processing Details:
      ${JSON.stringify(typedData.timings.slice(0, 10))}
      
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
      const cleanedResponse = this.cleanJsonResponse(aiResponse);
      const analysis = JSON.parse(cleanedResponse);

      return {
        currentWorkflow: `${workflowType} Processing`,
        bottlenecks: analysis.bottlenecks || ['No specific bottlenecks identified'],
        optimizations: analysis.optimizations || ['No specific optimizations identified'],
        estimatedTimeSaving: analysis.estimatedTimeSaving || 0,
        implementationComplexity: analysis.implementationComplexity || 'medium',
      };
    } catch (error) {
      this.logger.error('Error in AI workflow analysis:', error);

      return {
        currentWorkflow: `${workflowType} Processing`,
        bottlenecks: ['AI analysis error - manual review needed'],
        optimizations: ['Implement automated approval thresholds', 'Add parallel processing'],
        estimatedTimeSaving: 15,
        implementationComplexity: 'medium',
      };
    }
  }

  async routeDocumentIntelligently(
    documentType: 'PR' | 'PO' | 'GR',
    documentId: string
  ): Promise<SmartRouting> {
    try {
      // Validate inputs
      if (!documentType) {
        throw new Error('Document type is required');
      }
      if (!documentId) {
        throw new Error('Document ID is required');
      }

      let document: unknown;

      switch (documentType) {
        case 'PR':
          document = await this.prisma.purchaseRequest.findUnique({
            where: { id: documentId },
            include: { items: true, createdBy: true },
          });
          break;
        case 'PO':
          document = await this.prisma.purchaseOrder.findUnique({
            where: { id: documentId },
            include: { items: true, createdBy: true },
          });
          break;
        case 'GR':
          document = await this.prisma.goodsReceipt.findUnique({
            where: { id: documentId },
            include: { items: true, receivedBy: true },
          });
          break;
        default:
          throw new Error(`Invalid document type: ${documentType}. Must be PR, PO, or GR`);
      }

      if (!document) {
        throw new Error(`${documentType} with ID ${documentId} not found`);
      }

      return this.generateSmartRouting(documentType, document);
    } catch (error) {
      this.logger.error('Error in intelligent document routing:', error);
      throw new Error(`Failed to route document intelligently: ${error.message}`);
    }
  }

  private async generateSmartRouting(
    documentType: string,
    document: unknown
  ): Promise<SmartRouting> {
    const typedDocument = document as WorkflowData & {
      requestedBy?: { firstName: string };
      createdBy?: { firstName: string };
      priority?: string;
      department?: string;
    };

    const totalValue =
      typedDocument.items?.reduce(
        (sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 0),
        0
      ) || 0;

    const prompt = `
      Determine intelligent routing for this ${documentType}:
      
      Document Value: $${totalValue}
      Items Count: ${typedDocument.items?.length || 0}
      Creator: ${
        typedDocument.requestedBy?.firstName || typedDocument.createdBy?.firstName || 'Unknown'
      }
      Priority: ${typedDocument.priority || 'MEDIUM'}
      Department: ${typedDocument.department || 'Unknown'}
      
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
      const cleanedResponse = this.cleanJsonResponse(aiResponse);
      const routing = JSON.parse(cleanedResponse);

      return {
        documentType: documentType as 'PR' | 'PO' | 'GR',
        documentId: typedDocument.id,
        recommendedApprovers: routing.recommendedApprovers || ['Manager'],
        priorityLevel: routing.priorityLevel || 'medium',
        estimatedApprovalTime: routing.estimatedApprovalTime || 24,
        escalationRules: routing.escalationRules || ['Escalate after 48 hours'],
      };
    } catch (error) {
      this.logger.error('Error in AI smart routing:', error);

      // Fallback routing logic
      let approvers = ['Manager'];
      let priority: 'low' | 'medium' | 'high' = 'medium';

      if (totalValue > 10000) {
        approvers = ['Senior Manager', 'Finance Director', 'Executive'];
        priority = 'high';
      } else if (totalValue > 2000) {
        approvers = ['Senior Manager', 'Finance Manager'];
        priority = 'medium';
      }

      return {
        documentType: documentType as 'PR' | 'PO' | 'GR',
        documentId: typedDocument.id,
        recommendedApprovers: approvers,
        priorityLevel: priority,
        estimatedApprovalTime: 24,
        escalationRules: ['Escalate after 48 hours if no response'],
      };
    }
  }

  async evaluateForAutoApproval(
    documentId: string,
    _documentType: string
  ): Promise<AutoApprovalDecision> {
    return this.evaluatePRForAutoApproval(documentId);
  }

  async generateIntelligentPR(
    branchId: string,
    _urgency?: string,
    _category?: string
  ): Promise<unknown[]> {
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
          urgency: Number(stock.quantity) <= 5 ? 'high' : 'medium',
          reasoning: `Current stock: ${
            stock.quantity
          }, Average monthly usage: ${avgMonthlyConsumption.toFixed(1)}`,
        });
      }

      return suggestions.sort((a, b) => {
        const urgencyOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
        return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      });
    } catch (error) {
      this.logger.error('Error generating intelligent PR suggestions:', error);
      throw new Error('Failed to generate intelligent PR suggestions');
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
