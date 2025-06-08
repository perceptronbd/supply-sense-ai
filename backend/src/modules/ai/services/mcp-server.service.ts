import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { DemandForecastingService } from "./demand-forecasting.service";
import { PurchaseOptimizationService } from "./purchase-optimization.service";
import { QualityAnalysisService } from "./quality-analysis.service";
import { StockPredictionService } from "./stock-prediction.service";
import { WorkflowAutomationService } from "./workflow-automation.service";

@Injectable()
export class McpServerService implements OnModuleInit {
  private readonly logger = new Logger(McpServerService.name);
  private server: Server;

  constructor(
    private configService: ConfigService,
    private demandForecastingService: DemandForecastingService,
    private purchaseOptimizationService: PurchaseOptimizationService,
    private qualityAnalysisService: QualityAnalysisService,
    private stockPredictionService: StockPredictionService,
    private workflowAutomationService: WorkflowAutomationService
  ) {}

  async onModuleInit() {
    await this.initializeServer();
  }

  private async initializeServer() {
    try {
      this.server = new Server(
        {
          name: "supply-chain-ai-mcp",
          version: "1.0.0",
        },
        {
          capabilities: {
            tools: {},
          },
        }
      );

      // Register MCP tools
      this.registerMCPTools();

      this.logger.log("MCP Server initialized successfully");
    } catch (error) {
      this.logger.error("Failed to initialize MCP Server:", error);
    }
  }

  private registerMCPTools() {
    // Register available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "forecast_demand",
            description: "AI-powered demand forecasting for supply chain items",
            inputSchema: {
              type: "object",
              properties: {
                itemId: {
                  type: "string",
                  description: "Item ID to forecast demand for",
                },
                branchId: {
                  type: "string",
                  description: "Branch ID for location-specific forecast",
                },
                period: {
                  type: "string",
                  enum: ["weekly", "monthly", "quarterly"],
                  description: "Forecast period",
                },
                periods: {
                  type: "number",
                  description: "Number of periods to forecast",
                  default: 12,
                },
              },
              required: ["itemId", "branchId", "period"],
            },
          },
          {
            name: "optimize_purchase",
            description:
              "Optimize purchase orders using AI recommendations for cost and efficiency",
            inputSchema: {
              type: "object",
              properties: {
                itemIds: {
                  type: "array",
                  items: { type: "string" },
                  description: "Array of item IDs to optimize",
                },
                branchId: {
                  type: "string",
                  description: "Branch ID for optimization context",
                },
                budgetLimit: {
                  type: "number",
                  description: "Optional budget constraint",
                },
              },
              required: ["itemIds", "branchId"],
            },
          },
          {
            name: "analyze_quality",
            description:
              "Analyze quality issues and supplier performance using AI",
            inputSchema: {
              type: "object",
              properties: {
                goodsReceiptId: {
                  type: "string",
                  description: "Goods Receipt ID to analyze",
                },
                includeSupplierAnalysis: {
                  type: "boolean",
                  description:
                    "Include comprehensive supplier performance analysis",
                  default: true,
                },
              },
              required: ["goodsReceiptId"],
            },
          },
          {
            name: "predict_stockout",
            description:
              "Predict potential stockouts using AI analysis of consumption patterns",
            inputSchema: {
              type: "object",
              properties: {
                branchId: {
                  type: "string",
                  description: "Branch ID for stockout prediction",
                },
                daysAhead: {
                  type: "number",
                  description: "Number of days to predict ahead",
                  default: 30,
                },
                itemIds: {
                  type: "array",
                  items: { type: "string" },
                  description: "Optional specific items to analyze",
                },
              },
              required: ["branchId"],
            },
          },
          {
            name: "auto_approve_document",
            description:
              "Automatically evaluate and approve PR/PO documents using AI decision making",
            inputSchema: {
              type: "object",
              properties: {
                documentId: {
                  type: "string",
                  description: "Document ID (PR or PO)",
                },
                documentType: {
                  type: "string",
                  enum: ["PR", "PO"],
                  description: "Document type to evaluate",
                },
              },
              required: ["documentId", "documentType"],
            },
          },
          {
            name: "generate_intelligent_pr",
            description:
              "Generate intelligent purchase requests based on AI analysis of stock levels and demand",
            inputSchema: {
              type: "object",
              properties: {
                branchId: {
                  type: "string",
                  description: "Branch ID for PR generation",
                },
                urgency: {
                  type: "string",
                  enum: ["low", "medium", "high", "critical"],
                  description: "Urgency level for the purchase request",
                  default: "medium",
                },
                category: {
                  type: "string",
                  description: "Optional item category filter",
                },
              },
              required: ["branchId"],
            },
          },
          {
            name: "calculate_optimal_reorder_points",
            description:
              "Calculate optimal reorder points for items using AI analysis",
            inputSchema: {
              type: "object",
              properties: {
                itemId: {
                  type: "string",
                  description: "Item ID to calculate reorder point for",
                },
                branchId: {
                  type: "string",
                  description: "Branch ID for calculation context",
                },
                serviceLevel: {
                  type: "number",
                  description: "Desired service level (0.0-1.0)",
                  minimum: 0,
                  maximum: 1,
                  default: 0.95,
                },
              },
              required: ["itemId", "branchId"],
            },
          },
        ],
      };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "forecast_demand":
            return await this.handleDemandForecast(args);
          case "optimize_purchase":
            return await this.handlePurchaseOptimization(args);
          case "analyze_quality":
            return await this.handleQualityAnalysis(args);
          case "predict_stockout":
            return await this.handleStockoutPrediction(args);
          case "auto_approve_document":
            return await this.handleAutoApproval(args);
          case "generate_intelligent_pr":
            return await this.handleIntelligentPRGeneration(args);
          case "calculate_optimal_reorder_points":
            return await this.handleReorderPointCalculation(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        this.logger.error(`Error executing MCP tool ${name}:`, error);
        return {
          content: [
            {
              type: "text",
              text: `Error executing ${name}: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  private async handleDemandForecast(args: any) {
    try {
      const forecast = await this.demandForecastingService.predictDemand(
        args.itemId,
        args.branchId,
        args.period,
        args.periods
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                tool: "forecast_demand",
                data: forecast,
                message: `Demand forecast generated for item ${args.itemId} in branch ${args.branchId}`,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                tool: "forecast_demand",
                error: error.message,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }

  private async handlePurchaseOptimization(args: any) {
    try {
      const optimization = await this.purchaseOptimizationService.optimizeOrder(
        args.itemIds,
        args.branchId,
        args.budgetLimit
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                tool: "optimize_purchase",
                data: optimization,
                message: `Purchase optimization completed for ${args.itemIds.length} items`,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                tool: "optimize_purchase",
                error: error.message,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }
  private async handleQualityAnalysis(args: any) {
    try {
      const analysis = await this.qualityAnalysisService.analyzeItemQuality(
        args.goodsReceiptId,
        args.includeSupplierAnalysis
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                tool: "analyze_quality",
                data: analysis,
                message: `Quality analysis completed for goods receipt ${args.goodsReceiptId}`,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                tool: "analyze_quality",
                error: error.message,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }

  private async handleStockoutPrediction(args: any) {
    try {
      const prediction = await this.stockPredictionService.predictStockouts(
        args.branchId,
        args.daysAhead,
        args.itemIds
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                tool: "predict_stockout",
                data: prediction,
                message: `Stockout prediction completed for branch ${args.branchId}`,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                tool: "predict_stockout",
                error: error.message,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }

  private async handleAutoApproval(args: any) {
    try {
      const evaluation =
        await this.workflowAutomationService.evaluateForAutoApproval(
          args.documentId,
          args.documentType
        );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                tool: "auto_approve_document",
                data: evaluation,
                message: `Auto-approval evaluation completed for ${args.documentType} ${args.documentId}`,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                tool: "auto_approve_document",
                error: error.message,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }

  private async handleIntelligentPRGeneration(args: any) {
    try {
      const prRecommendations =
        await this.workflowAutomationService.generateIntelligentPR(
          args.branchId,
          args.urgency,
          args.category
        );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                tool: "generate_intelligent_pr",
                data: prRecommendations,
                message: `Intelligent PR generation completed for branch ${args.branchId}`,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                tool: "generate_intelligent_pr",
                error: error.message,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }
  private async handleReorderPointCalculation(args: any) {
    try {
      const reorderPoints =
        await this.stockPredictionService.calculateOptimalReorderPoints(
          args.branchId
        );

      // If itemId is specified, filter for that specific item
      const reorderPoint = args.itemId
        ? reorderPoints.find((rp) => rp.itemId === args.itemId)
        : reorderPoints;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                tool: "calculate_optimal_reorder_points",
                data: reorderPoint,
                message: args.itemId
                  ? `Optimal reorder point calculated for item ${args.itemId}`
                  : `Optimal reorder points calculated for branch ${args.branchId}`,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                tool: "calculate_optimal_reorder_points",
                error: error.message,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }

  async connectMCPClient(): Promise<void> {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      this.logger.log("MCP Server connected and ready for automation");
    } catch (error) {
      this.logger.error("Failed to connect MCP Server:", error);
      throw error;
    }
  }

  getServer(): Server {
    return this.server;
  }
}
