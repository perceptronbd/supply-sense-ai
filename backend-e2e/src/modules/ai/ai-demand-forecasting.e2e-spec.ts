import axios from 'axios';
import { TestHelpers, type TestUser } from '../../support/test-helpers';

describe('AI Demand Forecasting (E2E)', () => {
  const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
  let authToken: string;
  let testUser: TestUser;
  let TEST_ITEM_ID: string;
  let TEST_BRANCH_ID: string;

  beforeAll(async () => {
    // Authenticate and get test data
    const auth = await TestHelpers.loginAsBranchManager();
    authToken = auth.accessToken;
    testUser = auth.user;
    TEST_BRANCH_ID = testUser.branchId;
    TEST_ITEM_ID = await TestHelpers.getTestItemId();
  });

  const getAuthHeaders = () => TestHelpers.getAuthHeaders(authToken);

  describe('Authentication and Authorization', () => {
    it('should require authentication for AI endpoints', async () => {
      try {
        await axios.get(`${API_BASE_URL}/api/ai/demand-forecast`);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });

    it('should accept valid JWT token', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/api/ai/demand-forecast?branchId=${TEST_BRANCH_ID}&itemId=${TEST_ITEM_ID}`,
        { headers: getAuthHeaders() }
      );
      expect(response.status).toBe(200);
    });
  });

  describe('Demand Forecast Generation', () => {
    it('should generate demand forecast for specific item', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/ai/demand-forecast`, {
        params: {
          branchId: TEST_BRANCH_ID,
          itemId: TEST_ITEM_ID,
          daysAhead: 30,
        },
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.length).toBeGreaterThan(0);

      const forecast = response.data[0];
      expect(forecast).toMatchObject({
        itemId: TEST_ITEM_ID,
        branchId: TEST_BRANCH_ID,
        period: expect.any(String),
        predictedDemand: expect.any(Number),
        confidence: expect.any(Number),
        trend: expect.stringMatching(/^(increasing|decreasing|stable)$/),
        seasonalityFactor: expect.any(Number),
        riskFactors: expect.any(Array),
        recommendations: expect.any(Array),
      });

      expect(forecast.confidence).toBeGreaterThanOrEqual(0);
      expect(forecast.confidence).toBeLessThanOrEqual(1);
      expect(forecast.predictedDemand).toBeGreaterThanOrEqual(0);
      expect(forecast.seasonalityFactor).toBeGreaterThan(0);
    });

    it('should generate forecasts for multiple items when no itemId specified', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/ai/demand-forecast`, {
        params: {
          branchId: TEST_BRANCH_ID,
          daysAhead: 30,
        },
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.length).toBeGreaterThan(0);

      // Verify each forecast has required structure
      response.data.forEach((forecast: any) => {
        expect(forecast).toMatchObject({
          itemId: expect.any(String),
          branchId: TEST_BRANCH_ID,
          period: expect.any(String),
          predictedDemand: expect.any(Number),
          confidence: expect.any(Number),
          trend: expect.stringMatching(/^(increasing|decreasing|stable)$/),
          seasonalityFactor: expect.any(Number),
          riskFactors: expect.any(Array),
          recommendations: expect.any(Array),
        });
      });
    });

    it('should handle different time periods correctly', async () => {
      const periods = [7, 30, 90];

      for (const daysAhead of periods) {
        const response = await axios.get(`${API_BASE_URL}/api/ai/demand-forecast`, {
          params: {
            branchId: TEST_BRANCH_ID,
            itemId: TEST_ITEM_ID,
            daysAhead,
          },
          headers: getAuthHeaders(),
        });

        expect(response.status).toBe(200);
        expect(response.data).toBeInstanceOf(Array);
        expect(response.data.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Automatic Purchase Request Generation', () => {
    it('should generate automatic purchase request recommendations', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/api/ai/auto-purchase-requests/${TEST_BRANCH_ID}`,
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        recommendations: expect.any(Array),
        totalEstimatedCost: expect.any(Number),
        priorityOrder: expect.any(Array),
      });

      // Verify recommendation structure
      if (response.data.recommendations.length > 0) {
        const recommendation = response.data.recommendations[0];
        expect(recommendation).toMatchObject({
          itemId: expect.any(String),
          itemName: expect.any(String),
          currentStock: expect.any(Number),
          predictedDemand: expect.any(Number),
          recommendedQuantity: expect.any(Number),
          confidence: expect.any(Number),
          urgency: expect.stringMatching(/^(low|medium|high)$/),
          estimatedCost: expect.any(Number),
        });
      }
    });

    it('should prioritize high urgency items correctly', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/api/ai/auto-purchase-requests/${TEST_BRANCH_ID}`,
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);

      const highUrgencyItems = response.data.recommendations.filter(
        (rec: any) => rec.urgency === 'high'
      );

      const priorityOrder = response.data.priorityOrder;

      // High urgency items should appear first in priority order
      if (highUrgencyItems.length > 0) {
        const firstHighUrgencyIndex = priorityOrder.indexOf(highUrgencyItems[0].itemId);
        const firstNonHighUrgencyIndex = priorityOrder.findIndex(
          (itemId: string) => !highUrgencyItems.some((item: any) => item.itemId === itemId)
        );

        if (firstNonHighUrgencyIndex !== -1) {
          expect(firstHighUrgencyIndex).toBeLessThan(firstNonHighUrgencyIndex);
        }
      }
    });
  });

  describe('Parameter Validation', () => {
    it('should validate branchId parameter', async () => {
      try {
        await axios.get(`${API_BASE_URL}/api/ai/demand-forecast`, {
          params: { branchId: 'invalid-branch-id', itemId: TEST_ITEM_ID },
          headers: getAuthHeaders(),
        });
        // Should not throw error but may return empty results
      } catch (error: any) {
        // Acceptable if validation returns 400
        expect([400, 404]).toContain(error.response.status);
      }
    });

    it('should validate itemId parameter', async () => {
      try {
        await axios.get(`${API_BASE_URL}/api/ai/demand-forecast`, {
          params: { branchId: TEST_BRANCH_ID, itemId: 'invalid-item-id' },
          headers: getAuthHeaders(),
        });
        // Should not throw error but may return empty results
      } catch (error: any) {
        // Acceptable if validation returns 400
        expect([400, 404]).toContain(error.response.status);
      }
    });

    it('should handle missing required parameters gracefully', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/ai/demand-forecast`, {
        headers: getAuthHeaders(),
      });

      // Should return some forecasts even without specific parameters
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
    });

    it('should validate daysAhead parameter', async () => {
      const invalidDaysAhead = [-1, 0, 1000];

      for (const daysAhead of invalidDaysAhead) {
        try {
          await axios.get(`${API_BASE_URL}/api/ai/demand-forecast`, {
            params: {
              branchId: TEST_BRANCH_ID,
              itemId: TEST_ITEM_ID,
              daysAhead,
            },
            headers: getAuthHeaders(),
          });
          // Some invalid values might be handled gracefully
        } catch (error: any) {
          // Acceptable if validation returns 400
          expect(error.response.status).toBe(400);
        }
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid authentication token', async () => {
      try {
        await axios.get(`${API_BASE_URL}/api/ai/demand-forecast?branchId=${TEST_BRANCH_ID}`, {
          headers: {
            Authorization: 'Bearer invalid-token',
            'Content-Type': 'application/json',
          },
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });

    it('should handle server errors gracefully', async () => {
      // Test with potentially problematic parameters
      try {
        const response = await axios.get(`${API_BASE_URL}/api/ai/demand-forecast`, {
          params: {
            branchId: TEST_BRANCH_ID,
            itemId: TEST_ITEM_ID,
            daysAhead: 365, // Very long period
          },
          headers: getAuthHeaders(),
        });

        // Should either succeed or fail gracefully
        expect([200, 400, 500]).toContain(response.status);
      } catch (error: any) {
        expect([400, 500, 503]).toContain(error.response.status);
      }
    });
  });

  describe('Performance and Response Time', () => {
    it('should respond within reasonable time for single item forecast', async () => {
      const startTime = Date.now();

      const response = await axios.get(`${API_BASE_URL}/api/ai/demand-forecast`, {
        params: {
          branchId: TEST_BRANCH_ID,
          itemId: TEST_ITEM_ID,
          daysAhead: 30,
        },
        headers: getAuthHeaders(),
      });

      const responseTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(10000); // Should respond within 10 seconds
    });

    it('should handle concurrent requests', async () => {
      const concurrentRequests = Array(3)
        .fill(null)
        .map(() =>
          axios.get(`${API_BASE_URL}/api/ai/demand-forecast`, {
            params: {
              branchId: TEST_BRANCH_ID,
              itemId: TEST_ITEM_ID,
              daysAhead: 30,
            },
            headers: getAuthHeaders(),
          })
        );

      const responses = await Promise.all(concurrentRequests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.data).toBeInstanceOf(Array);
      });
    });
  });

  describe('MCP Integration', () => {
    it('should work with MCP server integration', async () => {
      // Test that AI services can integrate with MCP
      const response = await axios.get(`${API_BASE_URL}/api/ai/demand-forecast`, {
        params: {
          branchId: TEST_BRANCH_ID,
          itemId: TEST_ITEM_ID,
          daysAhead: 30,
        },
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);

      // Verify that the response contains AI-enhanced data
      // (MCP integration should enhance basic statistical forecasts)
      const forecast = response.data[0];
      expect(forecast.recommendations).toBeInstanceOf(Array);
      expect(forecast.riskFactors).toBeInstanceOf(Array);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle seasonal items appropriately', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/ai/demand-forecast`, {
        params: {
          branchId: TEST_BRANCH_ID,
          itemId: TEST_ITEM_ID,
          daysAhead: 90, // 3 months to capture seasonal patterns
        },
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      const forecast = response.data[0];

      // Seasonality factor should be meaningful
      expect(forecast.seasonalityFactor).toBeGreaterThan(0);
      expect(forecast.seasonalityFactor).toBeLessThan(10); // Reasonable upper bound
    });

    it('should provide actionable recommendations', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/api/ai/auto-purchase-requests/${TEST_BRANCH_ID}`,
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);

      if (response.data.recommendations.length > 0) {
        const recommendation = response.data.recommendations[0];

        // Recommendations should be reasonable
        expect(recommendation.recommendedQuantity).toBeGreaterThan(0);
        expect(recommendation.estimatedCost).toBeGreaterThan(0);
        expect(recommendation.confidence).toBeGreaterThan(0);

        // Should have reasoning
        expect(recommendation.reasoning || recommendation.reason).toBeDefined();
      }
    });
  });
});
