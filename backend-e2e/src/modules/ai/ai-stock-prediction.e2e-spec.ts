import axios from 'axios';
import { TestHelpers, type TestUser } from '../../support/test-helpers';

describe('AI Stock Prediction (E2E)', () => {
  const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
  let authToken: string;
  let testUser: TestUser;
  let TEST_BRANCH_ID: string;
  let TEST_ITEM_ID: string;

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
    it('should require authentication for stock prediction endpoints', async () => {
      const endpoints = [
        `/api/ai/stock-prediction/${TEST_BRANCH_ID}`,
        `/api/ai/reorder-recommendations/${TEST_BRANCH_ID}`,
        `/api/ai/stock-report/${TEST_BRANCH_ID}`,
      ];

      for (const endpoint of endpoints) {
        try {
          await axios.get(`${API_BASE_URL}${endpoint}`);
          fail(`Should have thrown an error for ${endpoint}`);
        } catch (error: any) {
          expect(error.response.status).toBe(401);
        }
      }
    });

    it('should accept valid JWT token for all stock prediction endpoints', async () => {
      const endpoints = [
        `/api/ai/stock-prediction/${TEST_BRANCH_ID}`,
        `/api/ai/reorder-recommendations/${TEST_BRANCH_ID}`,
        `/api/ai/stock-report/${TEST_BRANCH_ID}`,
      ];

      for (const endpoint of endpoints) {
        const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
          headers: getAuthHeaders(),
        });
        expect(response.status).toBe(200);
      }
    });
  });

  describe('Stock Level Predictions', () => {
    it('should predict stock levels for all items in branch', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/api/ai/stock-prediction/${TEST_BRANCH_ID}`,
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);

      if (response.data.length > 0) {
        const prediction = response.data[0];
        expect(prediction).toHaveProperty('itemId');
        expect(prediction).toHaveProperty('itemName');
        expect(prediction).toHaveProperty('currentStock');
        expect(prediction).toHaveProperty('predictedStock');
        expect(prediction).toHaveProperty('stockoutRisk');
        expect(prediction).toHaveProperty('stockoutDate');
        expect(prediction).toHaveProperty('recommendedAction');
        expect(prediction).toHaveProperty('confidence');

        // Validate data types and values
        expect(typeof prediction.itemId).toBe('string');
        expect(typeof prediction.itemName).toBe('string');
        expect(typeof prediction.currentStock).toBe('number');
        expect(prediction.currentStock).toBeGreaterThanOrEqual(0);
        expect(prediction.predictedStock).toBeInstanceOf(Array);
        expect(['low', 'medium', 'high']).toContain(prediction.stockoutRisk);
        expect(typeof prediction.recommendedAction).toBe('string');
        expect(typeof prediction.confidence).toBe('number');
        expect(prediction.confidence).toBeGreaterThanOrEqual(0);
        expect(prediction.confidence).toBeLessThanOrEqual(100);
      }
    });

    it('should predict stock levels for specific item', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/api/ai/stock-prediction/${TEST_BRANCH_ID}`,
        {
          params: { itemId: TEST_ITEM_ID },
          headers: getAuthHeaders(),
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);

      if (response.data.length > 0) {
        const prediction = response.data[0];
        expect(prediction.itemId).toBe(TEST_ITEM_ID);
        expect(prediction.predictedStock.length).toBeGreaterThan(0);
        expect(prediction.predictedStock.length).toBeLessThanOrEqual(30);
      }
    });
  });
  // Helper functions to reduce complexity
  const validatePredictionResponse = (response: any, expectedDays?: number) => {
    expect(response.status).toBe(200);
    if (response.data.length > 0 && expectedDays) {
      expect(response.data[0].predictedStock.length).toBeLessThanOrEqual(expectedDays);
    }
  };

  const validateShortTermPrediction = (response: any) => {
    if (response.data.length > 0) {
      expect(response.data[0].confidence).toBeGreaterThan(80);
    }
  };

  const validateLongTermPrediction = (response: any) => {
    if (response.data.length > 0) {
      expect(response.data[0].confidence).toBeLessThan(90);
    }
  };

  const testInvalidDaysAhead = async (invalidDays: any) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/ai/stock-prediction/${TEST_BRANCH_ID}`,
        {
          params: { daysAhead: invalidDays },
          headers: getAuthHeaders(),
        }
      );

      if (response.status === 200 && response.data.length > 0) {
        expect(response.data[0].predictedStock.length).toBeLessThan(365);
      }
    } catch (error: any) {
      expect([400, 500]).toContain(error.response.status);
    }
  };

  describe('Parameter Validation', () => {
    it('should validate daysAhead parameter', async () => {
      const invalidDaysAhead = [-1, 0, 1000, 'invalid'];

      for (const invalidDays of invalidDaysAhead) {
        await testInvalidDaysAhead(invalidDays);
      }
    });

    it('should handle prediction requests with extreme days ahead', async () => {
      const extremeDaysAhead = [1, 365];

      for (const days of extremeDaysAhead) {
        const response = await axios.get(
          `${API_BASE_URL}/api/ai/stock-prediction/${TEST_BRANCH_ID}`,
          {
            params: { daysAhead: days },
            headers: getAuthHeaders(),
          }
        );

        validatePredictionResponse(response, days);

        if (days === 1) {
          validateShortTermPrediction(response);
        }

        if (days === 365) {
          validateLongTermPrediction(response);
        }
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle items with zero stock', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/api/ai/stock-prediction/${TEST_BRANCH_ID}`,
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);

      const zeroStockItems = response.data.filter((item: any) => item.currentStock === 0);

      zeroStockItems.forEach((item: any) => {
        expect(item.stockoutRisk).toBe('high');
        const hasUrgentAction =
          item.recommendedAction.includes('immediate') ||
          item.recommendedAction.includes('urgent') ||
          item.recommendedAction.includes('order');
        expect(hasUrgentAction).toBe(true);
      });
    });

    it('should handle very large stock quantities', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/api/ai/stock-prediction/${TEST_BRANCH_ID}`,
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);

      const largeStockItems = response.data.filter((item: any) => item.currentStock > 1000);

      largeStockItems.forEach((item: any) => {
        expect(item.stockoutRisk).not.toBe('high');
        expect(item.predictedStock[0]).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance Testing', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();

      const response = await axios.get(
        `${API_BASE_URL}/api/ai/stock-prediction/${TEST_BRANCH_ID}`,
        { headers: getAuthHeaders() }
      );

      const responseTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(30000);
    });

    it('should handle concurrent prediction requests', async () => {
      const requests = Array(3)
        .fill(null)
        .map(() =>
          axios.get(`${API_BASE_URL}/api/ai/stock-prediction/${TEST_BRANCH_ID}`, {
            headers: getAuthHeaders(),
          })
        );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });
  });
});
