import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(private configService: ConfigService) {
    this.initializeGemini();
  }

  private initializeGemini() {
    const apiKey = this.configService.get<string>("GEMINI_API_KEY");
    const modelName = this.configService.get<string>(
      "GEMINI_MODEL",
      "gemini-1.5-flash"
    );

    if (!apiKey) {
      this.logger.warn(
        "Gemini API key not found. AI features will be limited."
      );
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: modelName });
      this.logger.log("Gemini AI service initialized successfully");
    } catch (error) {
      this.logger.error("Failed to initialize Gemini AI:", error);
    }
  }

  async generateText(prompt: string): Promise<string> {
    if (!this.model) {
      throw new Error("Gemini AI not properly initialized");
    }

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      this.logger.error("Error generating text with Gemini:", error);
      throw new Error("Failed to generate AI response");
    }
  }

  async analyzeSupplyChainData(
    data: any,
    analysisType:
      | "demand_forecast"
      | "quality_analysis"
      | "optimization"
      | "risk_assessment"
  ): Promise<any> {
    const prompts = {
      demand_forecast: this.buildDemandForecastPrompt(data),
      quality_analysis: this.buildQualityAnalysisPrompt(data),
      optimization: this.buildOptimizationPrompt(data),
      risk_assessment: this.buildRiskAssessmentPrompt(data),
    };

    const prompt = prompts[analysisType];
    const aiResponse = await this.generateText(prompt);

    try {
      return JSON.parse(aiResponse);
    } catch (error) {
      this.logger.warn("AI response was not valid JSON, returning as text");
      return { analysis: aiResponse, type: analysisType };
    }
  }

  private buildDemandForecastPrompt(data: any): string {
    return `
You are an AI supply chain analyst. Analyze the following historical data and provide a demand forecast.

Historical Data:
${JSON.stringify(data, null, 2)}

Please provide a JSON response with the following structure:
{
  "forecastedDemand": [
    {
      "period": "2025-01",
      "predictedQuantity": 150,
      "confidence": 0.85,
      "factors": ["seasonal_increase", "trend_growth"]
    }
  ],
  "insights": [
    "Key insight about demand patterns",
    "Recommendation for stock management"
  ],
  "riskFactors": [
    "Potential risk to consider"
  ],
  "recommendedActions": [
    "Specific action to take"
  ]
}

Focus on:
- Seasonal patterns
- Growth trends
- Risk factors
- Confidence levels
- Actionable recommendations
`;
  }

  private buildQualityAnalysisPrompt(data: any): string {
    return `
You are an AI quality control analyst. Analyze the following goods receipt and supplier data.

Data to Analyze:
${JSON.stringify(data, null, 2)}

Please provide a JSON response with:
{
  "qualityScore": 0.85,
  "issues": [
    {
      "type": "quantity_variance",
      "severity": "medium",
      "description": "Received quantity differs from ordered",
      "impact": "Medium impact on inventory planning"
    }
  ],
  "supplierPerformance": {
    "reliabilityScore": 0.9,
    "qualityTrend": "improving",
    "recommendations": ["Continue partnership", "Monitor delivery times"]
  },
  "predictiveInsights": [
    "Future quality predictions",
    "Preventive measures"
  ]
}

Analyze:
- Quantity variances
- Quality issues
- Supplier reliability
- Delivery performance
- Predictive quality trends
`;
  }

  private buildOptimizationPrompt(data: any): string {
    return `
You are an AI procurement optimization specialist. Analyze the purchase requirements and provide optimization recommendations.

Purchase Data:
${JSON.stringify(data, null, 2)}

Provide a JSON response with:
{
  "optimizedOrders": [
    {
      "itemId": "item_123",
      "recommendedQuantity": 200,
      "supplierRecommendation": "supplier_456",
      "reasoning": "Best cost-per-unit with reliable delivery",
      "costSavings": 150.75,
      "riskLevel": "low"
    }
  ],
  "consolidationOpportunities": [
    {
      "suppliers": ["supplier_1", "supplier_2"],
      "potentialSavings": 500.00,
      "items": ["item_1", "item_2"]
    }
  ],
  "budgetAnalysis": {
    "totalBudgetRequired": 10000.00,
    "potentialSavings": 750.00,
    "riskAdjustedBudget": 10200.00
  },
  "recommendations": [
    "Specific optimization recommendation"
  ]
}

Consider:
- Volume discounts
- Supplier consolidation
- Lead time optimization
- Risk mitigation
- Cost minimization
`;
  }

  private buildRiskAssessmentPrompt(data: any): string {
    return `
You are an AI risk assessment specialist for supply chains. Analyze the following data for potential risks.

Supply Chain Data:
${JSON.stringify(data, null, 2)}

Provide a JSON response with:
{
  "riskAssessment": {
    "overallRiskLevel": "medium",
    "riskScore": 0.65,
    "criticalRisks": [
      {
        "type": "supplier_dependency",
        "probability": 0.3,
        "impact": "high",
        "description": "High dependency on single supplier",
        "mitigation": "Diversify supplier base"
      }
    ],
    "emergingRisks": [
      "Potential future risks"
    ],
    "recommendations": [
      "Risk mitigation strategies"
    ]
  },
  "continuityPlan": {
    "criticalItems": ["item_1", "item_2"],
    "alternativeSuppliers": {
      "item_1": ["backup_supplier_1", "backup_supplier_2"]
    },
    "bufferStockRecommendations": {
      "item_1": {
        "currentStock": 100,
        "recommendedBuffer": 150,
        "reasoning": "Mitigate supply risk"
      }
    }
  }
}

Assess:
- Supplier risks
- Inventory risks
- Market risks
- Operational risks
- Financial risks
`;
  }

  async getSupplierRecommendation(requirements: any): Promise<any> {
    const prompt = `
Analyze the following purchase requirements and recommend the best supplier strategy:

Requirements: ${JSON.stringify(requirements, null, 2)}

Consider factors like:
- Cost efficiency
- Delivery reliability
- Quality history
- Risk factors
- Volume discounts

Provide recommendations in JSON format with supplier rankings and reasoning.
`;

    return await this.analyzeSupplyChainData(requirements, "optimization");
  }

  async predictMaintenanceNeeds(equipmentData: any): Promise<any> {
    const prompt = `
Based on the following equipment and usage data, predict maintenance needs:

Equipment Data: ${JSON.stringify(equipmentData, null, 2)}

Provide JSON response with:
- Predicted maintenance schedule
- Risk of equipment failure
- Recommended spare parts inventory
- Cost optimization suggestions
`;

    const response = await this.generateText(prompt);
    try {
      return JSON.parse(response);
    } catch {
      return { prediction: response, type: "maintenance_forecast" };
    }
  }

  isAvailable(): boolean {
    return !!this.model;
  }
}
