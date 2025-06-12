import { type GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EquipmentData, SupplierRequirements } from '../interfaces/ai-service.interface';

// Interfaces for typed data
export interface HistoricalDemandData {
  itemId: string;
  branchId: string;
  salesHistory: Array<{
    date: string;
    quantity: number;
    revenue: number;
  }>;
  seasonalFactors?: Record<string, number>;
  marketTrends?: string[];
}

export interface QualityAnalysisData {
  goodsReceiptId: string;
  items: Array<{
    itemId: string;
    quantityReceived: number;
    qualityScore: number;
    defectCount: number;
  }>;
  supplierData: {
    supplierId: string;
    performanceHistory: Array<{
      date: string;
      qualityRating: number;
      deliveryTime: number;
    }>;
  };
}

export interface OptimizationData {
  purchaseOrders: Array<{
    id: string;
    items: Array<{
      itemId: string;
      quantity: number;
      unitPrice: number;
    }>;
  }>;
  constraints: {
    budgetLimit?: number;
    minOrderQuantity?: Record<string, number>;
  };
}

export interface RiskAssessmentData {
  suppliers: Array<{
    id: string;
    reliabilityScore: number;
    geopoliticalRisk: number;
  }>;
  inventory: Array<{
    itemId: string;
    currentStock: number;
    leadTime: number;
  }>;
  marketConditions: {
    volatility: number;
    priceInflation: number;
  };
}

export interface AIAnalysisResult {
  analysis: string;
  recommendations: string[];
  confidence: number;
  metadata: Record<string, unknown>;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(private configService: ConfigService) {
    this.initializeGemini();
  }

  private initializeGemini() {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    const modelName = this.configService.get<string>('GEMINI_MODEL', 'gemini-1.5-flash');

    if (!apiKey) {
      this.logger.warn('Gemini API key not found. AI features will be limited.');
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: modelName });
      this.logger.log('Gemini AI service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Gemini AI:', error);
    }
  }

  async generateText(prompt: string): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini AI not properly initialized');
    }

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      this.logger.error('Error generating text with Gemini:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  async analyzeSupplyChainData(
    data: HistoricalDemandData | QualityAnalysisData | OptimizationData | RiskAssessmentData,
    analysisType: 'demand_forecast' | 'quality_analysis' | 'optimization' | 'risk_assessment'
  ): Promise<AIAnalysisResult> {
    const prompts = {
      demand_forecast: this.buildDemandForecastPrompt(data),
      quality_analysis: this.buildQualityAnalysisPrompt(data),
      optimization: this.buildOptimizationPrompt(data),
      risk_assessment: this.buildRiskAssessmentPrompt(data),
    };

    const prompt = prompts[analysisType];
    const aiResponse = await this.generateText(prompt);

    try {
      // Clean the response to remove markdown code blocks if present
      const cleanedResponse = this.cleanJsonResponse(aiResponse);
      return JSON.parse(cleanedResponse);
    } catch (_error) {
      this.logger.warn('AI response was not valid JSON, returning as text');
      return {
        analysis: aiResponse,
        recommendations: [],
        confidence: 0.5,
        metadata: { analysisType, responseType: 'text' },
      };
    }
  }

  private buildDemandForecastPrompt(
    data: HistoricalDemandData | QualityAnalysisData | OptimizationData | RiskAssessmentData
  ): string {
    return `
You are an AI SupplySense analyst. Analyze the following historical data and provide a demand forecast.

Historical Data:
${JSON.stringify(data, null, 2)}

Please provide a JSON response with the following structure (return only valid JSON, no markdown):
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

  private buildQualityAnalysisPrompt(
    data: HistoricalDemandData | QualityAnalysisData | OptimizationData | RiskAssessmentData
  ): string {
    return `
You are an AI quality control analyst. Analyze the following goods receipt and supplier data.

Data to Analyze:
${JSON.stringify(data, null, 2)}

Please provide a JSON response with (return only valid JSON, no markdown):
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

  private buildOptimizationPrompt(
    data: HistoricalDemandData | QualityAnalysisData | OptimizationData | RiskAssessmentData
  ): string {
    return `
You are an AI procurement optimization specialist. Analyze the purchase requirements and provide optimization recommendations.

Purchase Data:
${JSON.stringify(data, null, 2)}

Provide a JSON response with (return only valid JSON, no markdown):
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

  private buildRiskAssessmentPrompt(
    data: HistoricalDemandData | QualityAnalysisData | OptimizationData | RiskAssessmentData
  ): string {
    return `
You are an AI risk assessment specialist for SupplySense. Analyze the following data for potential risks.

SupplySense Data:
${JSON.stringify(data, null, 2)}

Provide a JSON response with (return only valid JSON, no markdown):
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

  async getSupplierRecommendation(requirements: SupplierRequirements): Promise<unknown> {
    const _prompt = `
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

    return await this.analyzeSupplyChainData(
      requirements as unknown as OptimizationData,
      'optimization'
    );
  }

  async predictMaintenanceNeeds(equipmentData: EquipmentData): Promise<unknown> {
    const prompt = `
Based on the following equipment and usage data, predict maintenance needs:

Equipment Data: ${JSON.stringify(equipmentData, null, 2)}

Provide JSON response with (return only valid JSON, no markdown):
- Predicted maintenance schedule
- Risk of equipment failure
- Recommended spare parts inventory
- Cost optimization suggestions
`;

    const response = await this.generateText(prompt);
    try {
      const cleanedResponse = this.cleanJsonResponse(response);
      return JSON.parse(cleanedResponse);
    } catch {
      return { prediction: response, type: 'maintenance_forecast' };
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

  isAvailable(): boolean {
    return !!this.model;
  }
}
