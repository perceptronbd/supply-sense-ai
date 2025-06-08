import axios from 'axios';
import { TestHelpers, type TestUser } from '../../support/test-helpers';

describe('AI Risk Assessment (E2E)', () => {
  const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
  let authToken: string;
  let testUser: TestUser;
  let TEST_BRANCH_ID: string;

  beforeAll(async () => {
    // Authenticate and get test data
    const auth = await TestHelpers.loginAsBranchManager();
    authToken = auth.accessToken;
    testUser = auth.user;
    TEST_BRANCH_ID = testUser.branchId;
  });

  const getAuthHeaders = () => TestHelpers.getAuthHeaders(authToken);

  describe('Authentication and Authorization', () => {
    it('should require authentication for supplier risk assessment', async () => {
      try {
        await axios.post(`${API_BASE_URL}/api/ai/assess-supplier-risk`, {
          supplierId: 'test-supplier-id',
        });
        fail('Should have thrown 401 error');
      } catch (error: any) {
        expect(error.response?.status).toBe(401);
      }
    });

    it('should require authentication for purchase risk analysis', async () => {
      try {
        await axios.post(`${API_BASE_URL}/api/ai/analyze-purchase-risk`, {
          purchaseRequestId: 'test-pr-id',
        });
        fail('Should have thrown 401 error');
      } catch (error: any) {
        expect(error.response?.status).toBe(401);
      }
    });

    it('should require authentication for inventory risk evaluation', async () => {
      try {
        await axios.post(`${API_BASE_URL}/api/ai/evaluate-inventory-risk`, {
          branchId: TEST_BRANCH_ID,
        });
        fail('Should have thrown 401 error');
      } catch (error: any) {
        expect(error.response?.status).toBe(401);
      }
    });
  });

  describe('Supplier Risk Assessment', () => {
    it('should assess comprehensive supplier risk profile', async () => {
      const supplierId = await TestHelpers.getTestSupplierId();

      const response = await axios.post(
        `${API_BASE_URL}/api/ai/assess-supplier-risk`,
        {
          supplierId: supplierId,
          assessmentScope: 'comprehensive',
          includeFinancialAnalysis: true,
          includeOperationalAnalysis: true,
          includeGeopoliticalAnalysis: true,
          timeframe: '12_months',
        },
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        supplierId: expect.any(String),
        overallRiskScore: expect.any(Number),
        riskLevel: expect.stringMatching(/^(low|medium|high|critical)$/),
        riskCategories: expect.objectContaining({
          financial: expect.objectContaining({
            score: expect.any(Number),
            level: expect.stringMatching(/^(low|medium|high|critical)$/),
            factors: expect.arrayContaining([
              expect.objectContaining({
                factor: expect.any(String),
                impact: expect.stringMatching(/^(low|medium|high)$/),
                probability: expect.any(Number),
                description: expect.any(String),
              }),
            ]),
            metrics: expect.objectContaining({
              creditRating: expect.any(String),
              liquidityRatio: expect.any(Number),
              debtToEquity: expect.any(Number),
              paymentHistory: expect.any(Object),
            }),
          }),
          operational: expect.objectContaining({
            score: expect.any(Number),
            level: expect.stringMatching(/^(low|medium|high|critical)$/),
            factors: expect.any(Array),
            metrics: expect.objectContaining({
              onTimeDelivery: expect.any(Number),
              qualityScore: expect.any(Number),
              capacityUtilization: expect.any(Number),
              certifications: expect.any(Array),
            }),
          }),
          geopolitical: expect.objectContaining({
            score: expect.any(Number),
            level: expect.stringMatching(/^(low|medium|high|critical)$/),
            factors: expect.any(Array),
            considerations: expect.any(Array),
          }),
        }),
        recommendations: expect.arrayContaining([
          expect.objectContaining({
            type: expect.stringMatching(/^(mitigate|monitor|diversify|replace)$/),
            priority: expect.stringMatching(/^(low|medium|high|critical)$/),
            description: expect.any(String),
            actionItems: expect.any(Array),
            timeline: expect.any(String),
          }),
        ]),
        monitoring: expect.objectContaining({
          keyIndicators: expect.any(Array),
          alertThresholds: expect.any(Object),
          reviewFrequency: expect.any(String),
        }),
      });

      expect(response.data.overallRiskScore).toBeGreaterThanOrEqual(0);
      expect(response.data.overallRiskScore).toBeLessThanOrEqual(100);
    });

    it('should assess supplier diversification risk', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/api/ai/assess-supplier-diversification`,
        {
          branchId: TEST_BRANCH_ID,
          categoryAnalysis: true,
          concentrationThreshold: 0.6,
          includeAlternatives: true,
        },
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        concentrationRisk: expect.objectContaining({
          overallScore: expect.any(Number),
          riskLevel: expect.stringMatching(/^(low|medium|high|critical)$/),
          concentratedSuppliers: expect.any(Array),
          riskFactors: expect.any(Array),
        }),
        categoryAnalysis: expect.arrayContaining([
          expect.objectContaining({
            category: expect.any(String),
            supplierCount: expect.any(Number),
            concentrationRatio: expect.any(Number),
            riskLevel: expect.any(String),
            recommendations: expect.any(Array),
          }),
        ]),
        diversificationOpportunities: expect.arrayContaining([
          expect.objectContaining({
            category: expect.any(String),
            currentSuppliers: expect.any(Number),
            recommendedSuppliers: expect.any(Number),
            potentialSuppliers: expect.any(Array),
            riskReduction: expect.any(Number),
          }),
        ]),
      });
    });
  });

  describe('Purchase Risk Analysis', () => {
    it('should analyze purchase request risk factors', async () => {
      const purchaseRequestId = await TestHelpers.createApprovedPurchaseRequest(
        authToken,
        TEST_BRANCH_ID,
        {
          title: 'Risk Analysis Test PR',
          description: 'Testing purchase risk analysis',
        }
      );

      const response = await axios.post(
        `${API_BASE_URL}/api/ai/analyze-purchase-risk`,
        {
          purchaseRequestId: purchaseRequestId,
          includeSupplierRisk: true,
          includeMarketRisk: true,
          includeComplianceRisk: true,
        },
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        purchaseRequestId: expect.any(String),
        overallRiskScore: expect.any(Number),
        riskLevel: expect.stringMatching(/^(low|medium|high|critical)$/),
        riskFactors: expect.arrayContaining([
          expect.objectContaining({
            category: expect.stringMatching(/^(supplier|market|compliance|operational|financial)$/),
            factor: expect.any(String),
            severity: expect.stringMatching(/^(low|medium|high|critical)$/),
            probability: expect.any(Number),
            impact: expect.any(String),
            mitigation: expect.any(String),
          }),
        ]),
        supplierRisk: expect.objectContaining({
          score: expect.any(Number),
          factors: expect.any(Array),
          recommendations: expect.any(Array),
        }),
        marketRisk: expect.objectContaining({
          priceVolatility: expect.any(Number),
          availabilityRisk: expect.any(String),
          competitionLevel: expect.any(String),
          marketTrends: expect.any(Array),
        }),
        complianceRisk: expect.objectContaining({
          regulatoryCompliance: expect.any(Object),
          certificationRequirements: expect.any(Array),
          auditRequirements: expect.any(Array),
        }),
        recommendations: expect.arrayContaining([
          expect.objectContaining({
            type: expect.any(String),
            description: expect.any(String),
            priority: expect.any(String),
            implementation: expect.any(String),
          }),
        ]),
      });
    });

    it('should evaluate procurement fraud risk', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/api/ai/evaluate-fraud-risk`,
        {
          branchId: TEST_BRANCH_ID,
          analysisType: 'procurement',
          timeframe: '6_months',
          includeAnomalyDetection: true,
        },
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        fraudRiskScore: expect.any(Number),
        riskLevel: expect.stringMatching(/^(low|medium|high|critical)$/),
        anomalies: expect.arrayContaining([
          expect.objectContaining({
            type: expect.any(String),
            description: expect.any(String),
            severity: expect.any(String),
            confidence: expect.any(Number),
            detectedAt: expect.any(String),
            relatedEntities: expect.any(Array),
          }),
        ]),
        riskIndicators: expect.arrayContaining([
          expect.objectContaining({
            indicator: expect.any(String),
            value: expect.any(Number),
            threshold: expect.any(Number),
            status: expect.stringMatching(/^(normal|warning|alert)$/),
          }),
        ]),
        preventiveControls: expect.arrayContaining([
          expect.objectContaining({
            control: expect.any(String),
            effectiveness: expect.any(String),
            recommendations: expect.any(String),
          }),
        ]),
      });
    });
  });

  describe('Inventory Risk Evaluation', () => {
    it('should evaluate inventory obsolescence risk', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/api/ai/evaluate-obsolescence-risk`,
        {
          branchId: TEST_BRANCH_ID,
          riskThresholds: {
            age: 180, // days
            turnover: 2, // times per year
            demandTrend: -0.1, // 10% decline
          },
          includeForecasting: true,
        },
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        obsolescenceRisk: expect.arrayContaining([
          expect.objectContaining({
            itemId: expect.any(String),
            riskScore: expect.any(Number),
            riskLevel: expect.stringMatching(/^(low|medium|high|critical)$/),
            factors: expect.objectContaining({
              age: expect.any(Number),
              turnoverRate: expect.any(Number),
              demandTrend: expect.any(Number),
              stockLevel: expect.any(Number),
              marketConditions: expect.any(String),
            }),
            recommendations: expect.arrayContaining([
              expect.objectContaining({
                action: expect.stringMatching(/^(discount|liquidate|return|monitor)$/),
                timeframe: expect.any(String),
                expectedRecovery: expect.any(Number),
              }),
            ]),
          }),
        ]),
        summary: expect.objectContaining({
          totalAtRisk: expect.any(Number),
          valueAtRisk: expect.any(Number),
          highRiskItems: expect.any(Number),
          estimatedLoss: expect.any(Number),
        }),
        forecastedRisk: expect.objectContaining({
          projectedObsolescence: expect.any(Array),
          riskTrends: expect.any(Object),
          preventiveActions: expect.any(Array),
        }),
      });
    });

    it('should assess stockout risk', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/api/ai/assess-stockout-risk`,
        {
          branchId: TEST_BRANCH_ID,
          forecastHorizon: '3_months',
          includeSeasonality: true,
          riskTolerance: 'medium',
        },
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        stockoutRisk: expect.arrayContaining([
          expect.objectContaining({
            itemId: expect.any(String),
            currentStock: expect.any(Number),
            projectedDemand: expect.any(Number),
            stockoutProbability: expect.any(Number),
            riskLevel: expect.stringMatching(/^(low|medium|high|critical)$/),
            daysUntilStockout: expect.any(Number),
            businessImpact: expect.objectContaining({
              revenueAtRisk: expect.any(Number),
              customerImpact: expect.any(String),
              operationalImpact: expect.any(String),
            }),
            recommendations: expect.any(Array),
          }),
        ]),
        aggregateRisk: expect.objectContaining({
          totalItemsAtRisk: expect.any(Number),
          totalRevenueAtRisk: expect.any(Number),
          averageRiskLevel: expect.any(String),
          priorityActions: expect.any(Array),
        }),
      });
    });
  });

  describe('Market Risk Analysis', () => {
    it('should analyze commodity price risk', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/api/ai/analyze-commodity-risk`,
        {
          commodities: ['steel', 'aluminum', 'copper'],
          timeframe: '12_months',
          includeVolatilityAnalysis: true,
          includeHedgingRecommendations: true,
        },
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        commodityRisks: expect.arrayContaining([
          expect.objectContaining({
            commodity: expect.any(String),
            currentPrice: expect.any(Number),
            volatilityScore: expect.any(Number),
            riskLevel: expect.stringMatching(/^(low|medium|high|critical)$/),
            priceForecasting: expect.objectContaining({
              projectedPrices: expect.any(Array),
              confidence: expect.any(Number),
              factors: expect.any(Array),
            }),
            hedgingOptions: expect.arrayContaining([
              expect.objectContaining({
                strategy: expect.any(String),
                cost: expect.any(Number),
                effectiveness: expect.any(String),
                suitability: expect.any(String),
              }),
            ]),
          }),
        ]),
        portfolio: expect.objectContaining({
          overallRisk: expect.any(Number),
          diversificationScore: expect.any(Number),
          correlationMatrix: expect.any(Object),
          recommendations: expect.any(Array),
        }),
      });
    });

    it('should evaluate supply chain disruption risk', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/api/ai/evaluate-disruption-risk`,
        {
          branchId: TEST_BRANCH_ID,
          analysisScope: 'full_supply_chain',
          includeGeopoliticalFactors: true,
          includeNaturalDisasters: true,
          includeEconomicFactors: true,
        },
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        disruptionRisk: expect.objectContaining({
          overallScore: expect.any(Number),
          riskLevel: expect.stringMatching(/^(low|medium|high|critical)$/),
          vulnerabilities: expect.any(Array),
        }),
        riskFactors: expect.arrayContaining([
          expect.objectContaining({
            category: expect.stringMatching(/^(geopolitical|natural|economic|operational|cyber)$/),
            factor: expect.any(String),
            probability: expect.any(Number),
            impact: expect.any(String),
            affectedSuppliers: expect.any(Array),
            mitigation: expect.any(String),
          }),
        ]),
        contingencyPlanning: expect.objectContaining({
          alternativeSuppliers: expect.any(Array),
          bufferStockRecommendations: expect.any(Array),
          diversificationStrategies: expect.any(Array),
        }),
        monitoring: expect.objectContaining({
          earlyWarningIndicators: expect.any(Array),
          alertSystem: expect.any(Object),
          responseProtocols: expect.any(Array),
        }),
      });
    });
  });

  describe('Financial Risk Assessment', () => {
    it('should assess procurement budget risk', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/api/ai/assess-budget-risk`,
        {
          branchId: TEST_BRANCH_ID,
          budgetPeriod: 'fiscal_year',
          includeForecasting: true,
          riskTolerance: 'medium',
        },
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        budgetRisk: expect.objectContaining({
          overallScore: expect.any(Number),
          riskLevel: expect.stringMatching(/^(low|medium|high|critical)$/),
          variance: expect.objectContaining({
            actual: expect.any(Number),
            budgeted: expect.any(Number),
            percentageVariance: expect.any(Number),
          }),
        }),
        riskFactors: expect.arrayContaining([
          expect.objectContaining({
            factor: expect.any(String),
            impact: expect.any(Number),
            probability: expect.any(Number),
            category: expect.any(String),
          }),
        ]),
        forecasting: expect.objectContaining({
          projectedSpending: expect.any(Array),
          riskAdjustedBudget: expect.any(Number),
          confidenceInterval: expect.any(Object),
        }),
        recommendations: expect.arrayContaining([
          expect.objectContaining({
            type: expect.stringMatching(/^(budget_adjustment|process_improvement|cost_control)$/),
            description: expect.any(String),
            estimatedImpact: expect.any(Number),
          }),
        ]),
      });
    });
  });

  describe('Parameter Validation', () => {
    it('should validate supplier risk assessment parameters', async () => {
      try {
        await axios.post(
          `${API_BASE_URL}/api/ai/assess-supplier-risk`,
          {
            // Missing required fields
          },
          { headers: getAuthHeaders() }
        );
        fail('Should have thrown 400 error');
      } catch (error: any) {
        expect(error.response?.status).toBe(400);
      }
    });

    it('should validate invalid risk assessment parameters', async () => {
      try {
        await axios.post(
          `${API_BASE_URL}/api/ai/analyze-purchase-risk`,
          {
            purchaseRequestId: 'invalid-id',
            riskThreshold: 1.5, // Invalid threshold
          },
          { headers: getAuthHeaders() }
        );
        fail('Should have thrown 400 error');
      } catch (error: any) {
        expect(error.response?.status).toBe(400);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent supplier in risk assessment', async () => {
      try {
        await axios.post(
          `${API_BASE_URL}/api/ai/assess-supplier-risk`,
          {
            supplierId: 'non-existent-supplier',
          },
          { headers: getAuthHeaders() }
        );
        fail('Should have thrown 404 error');
      } catch (error: any) {
        expect(error.response?.status).toBe(404);
      }
    });

    it('should handle insufficient data for risk analysis', async () => {
      try {
        await axios.post(
          `${API_BASE_URL}/api/ai/analyze-commodity-risk`,
          {
            commodities: ['unknown_commodity'],
          },
          { headers: getAuthHeaders() }
        );
        fail('Should have thrown 422 error');
      } catch (error: any) {
        expect(error.response?.status).toBe(422);
      }
    });
  });

  describe('Performance Testing', () => {
    it('should handle large-scale risk assessment', async () => {
      const startTime = Date.now();

      const response = await axios.post(
        `${API_BASE_URL}/api/ai/evaluate-inventory-risk`,
        {
          branchId: TEST_BRANCH_ID,
          riskTypes: ['obsolescence', 'stockout', 'theft', 'damage'],
          includeDetailedAnalysis: true,
        },
        { headers: getAuthHeaders() }
      );

      const endTime = Date.now();
      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(15000); // Should complete within 15 seconds
    });

    it('should handle concurrent risk assessments', async () => {
      const promises = [
        axios.post(
          `${API_BASE_URL}/api/ai/assess-budget-risk`,
          { branchId: TEST_BRANCH_ID },
          { headers: getAuthHeaders() }
        ),
        axios.post(
          `${API_BASE_URL}/api/ai/evaluate-obsolescence-risk`,
          { branchId: TEST_BRANCH_ID },
          { headers: getAuthHeaders() }
        ),
        axios.post(
          `${API_BASE_URL}/api/ai/assess-stockout-risk`,
          { branchId: TEST_BRANCH_ID },
          { headers: getAuthHeaders() }
        ),
      ];

      const responses = await Promise.all(promises);
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });
  });
});
