import axios from 'axios';
import { TestHelpers, type TestUser } from '../../support/test-helpers';

describe('AI Inventory Optimization (E2E)', () => {
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
    it('should require authentication for quantity optimization', async () => {
      try {
        await axios.post(`${API_BASE_URL}/api/ai/optimize-quantities`, {
          items: [{ itemId: TEST_ITEM_ID, currentStock: 100, demandForecast: 200 }],
          constraints: { budget: 10000, storageCapacity: 1000 },
        });
        fail('Should have thrown 401 error');
      } catch (error: any) {
        expect(error.response?.status).toBe(401);
      }
    });

    it('should require authentication for reorder recommendations', async () => {
      try {
        await axios.get(`${API_BASE_URL}/api/ai/reorder-recommendations/${TEST_BRANCH_ID}`);
        fail('Should have thrown 401 error');
      } catch (error: any) {
        expect(error.response?.status).toBe(401);
      }
    });

    it('should require authentication for stock predictions', async () => {
      try {
        await axios.get(`${API_BASE_URL}/api/ai/stock-prediction/${TEST_BRANCH_ID}`);
        fail('Should have thrown 401 error');
      } catch (error: any) {
        expect(error.response?.status).toBe(401);
      }
    });
  });

  describe('Inventory Optimization Analysis', () => {
    it('should optimize quantities for multiple items', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/api/ai/optimize-quantities`,
        {
          items: [
            {
              itemId: TEST_ITEM_ID,
              currentStock: 100,
              demandForecast: 200,
              unitCost: 50,
              leadTime: 7,
            },
          ],
          constraints: {
            budget: 10000,
            storageCapacity: 1000,
          },
        },
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
    });

    it('should get reorder recommendations for branch', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/api/ai/reorder-recommendations/${TEST_BRANCH_ID}`,
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
    });

    it('should get stock predictions for branch', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/api/ai/stock-prediction/${TEST_BRANCH_ID}`,
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
    });

    it('should get stock report for branch', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/ai/stock-report/${TEST_BRANCH_ID}`, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
    });
  });

  describe('Parameter Validation', () => {
    it('should validate quantity optimization parameters', async () => {
      try {
        await axios.post(
          `${API_BASE_URL}/api/ai/optimize-quantities`,
          {
            items: [],
            constraints: { budget: -1000 },
          },
          { headers: getAuthHeaders() }
        );
        fail('Should have thrown 400 error');
      } catch (error: any) {
        expect(error.response?.status).toBe(400);
      }
    });

    it('should validate branch ID in reorder recommendations', async () => {
      try {
        await axios.get(`${API_BASE_URL}/api/ai/reorder-recommendations/invalid-branch-id`, {
          headers: getAuthHeaders(),
        });
        fail('Should have thrown 400 error');
      } catch (error: any) {
        expect(error.response?.status).toBe(400);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent branch ID', async () => {
      try {
        await axios.get(
          `${API_BASE_URL}/api/ai/reorder-recommendations/550e8400-e29b-41d4-a716-446655440000`,
          { headers: getAuthHeaders() }
        );
        expect(true).toBe(true);
      } catch (error: any) {
        expect([400, 404]).toContain(error.response?.status);
      }
    });
    it('should handle non-existent item IDs in optimization', async () => {
      try {
        await axios.post(
          `${API_BASE_URL}/api/ai/optimize-quantities`,
          {
            items: [
              {
                itemId: '550e8400-e29b-41d4-a716-446655440000',
                currentStock: 100,
                demandForecast: 200,
              },
            ],
            constraints: { budget: 10000 },
          },
          { headers: getAuthHeaders() }
        );
        expect(true).toBe(true);
      } catch (error: any) {
        expect([400, 404]).toContain(error.response?.status);
      }
    });
  });

  describe('Performance Testing', () => {
    it('should handle quantity optimization for multiple items within reasonable time', async () => {
      const startTime = Date.now();

      const response = await axios.post(
        `${API_BASE_URL}/api/ai/optimize-quantities`,
        {
          items: Array.from({ length: 5 }, (_, i) => ({
            itemId: TEST_ITEM_ID,
            currentStock: 100 + i * 10,
            demandForecast: 200 + i * 20,
            unitCost: 50 + i * 5,
            leadTime: 7,
          })),
          constraints: {
            budget: 50000,
            storageCapacity: 5000,
          },
        },
        { headers: getAuthHeaders() }
      );

      const endTime = Date.now();
      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(10000);
    });
  });
});
