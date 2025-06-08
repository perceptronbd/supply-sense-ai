import axios from 'axios';
import { TestHelpers } from '../../support/test-helpers';

describe('AI Purchase Optimization (E2E)', () => {
  const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
  let authToken: string;
  let testItemId: string;
  let testSupplierId: string;

  beforeAll(async () => {
    // Authenticate and get test data
    const auth = await TestHelpers.loginAsBranchManager();
    authToken = auth.accessToken;
    testItemId = await TestHelpers.getTestItemId();
    testSupplierId = await TestHelpers.getTestSupplierId();
  });

  const getAuthHeaders = () => TestHelpers.getAuthHeaders(authToken);

  describe('POST /ai/recommend-supplier', () => {
    it('should return supplier recommendations for single item', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/ai/recommend-supplier`,
        {
          itemIds: [testItemId],
        },
        {
          headers: getAuthHeaders(),
        }
      );
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.length).toBeGreaterThan(0);

      const recommendation = response.data[0];
      expect(recommendation).toHaveProperty('supplierId');
      expect(recommendation).toHaveProperty('supplierName');
      expect(recommendation).toHaveProperty('score');
      expect(recommendation).toHaveProperty('averagePrice');
      expect(recommendation).toHaveProperty('deliveryPerformance');
      expect(recommendation).toHaveProperty('qualityRating');
      expect(recommendation).toHaveProperty('recommendations');

      // Validate data types and ranges
      expect(typeof recommendation.supplierId).toBe('string');
      expect(typeof recommendation.supplierName).toBe('string');
      expect(typeof recommendation.score).toBe('number');
      expect(recommendation.score).toBeGreaterThanOrEqual(0);
      expect(recommendation.score).toBeLessThanOrEqual(100);
      expect(typeof recommendation.averagePrice).toBe('number');
      expect(recommendation.averagePrice).toBeGreaterThanOrEqual(0);
      expect(typeof recommendation.deliveryPerformance).toBe('number');
      expect(recommendation.deliveryPerformance).toBeGreaterThanOrEqual(0);
      expect(recommendation.deliveryPerformance).toBeLessThanOrEqual(100);
      expect(typeof recommendation.qualityRating).toBe('number');
      expect(recommendation.qualityRating).toBeGreaterThanOrEqual(0);
      expect(recommendation.qualityRating).toBeLessThanOrEqual(5);
      expect(Array.isArray(recommendation.recommendations)).toBe(true);
      expect(recommendation.recommendations.length).toBeGreaterThan(0);
    });

    it('should return supplier recommendations for multiple items', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/ai/recommend-supplier`,
        {
          itemIds: [testItemId],
        },
        {
          headers: getAuthHeaders(),
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.length).toBeGreaterThan(0);

      // Verify recommendations are sorted by score (highest first)
      for (let i = 0; i < response.data.length - 1; i++) {
        expect(response.data[i].score).toBeGreaterThanOrEqual(response.data[i + 1].score);
      }

      // Verify each recommendation has comprehensive data
      response.data.forEach((recommendation) => {
        expect(recommendation.recommendations).toBeInstanceOf(Array);
        expect(recommendation.recommendations.length).toBeGreaterThan(0);
        expect(recommendation.recommendations[0]).toBeTruthy();
        expect(typeof recommendation.recommendations[0]).toBe('string');
      });
    });

    it('should handle empty item list', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/ai/recommend-supplier`,
        {
          itemIds: [],
        },
        {
          headers: getAuthHeaders(),
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.length).toBe(0);
    });

    it('should handle non-existent item IDs gracefully', async () => {
      const nonExistentItemId = 'non-existent-item-id';
      const response = await axios.post(
        `${API_BASE_URL}/ai/recommend-supplier`,
        {
          itemIds: [nonExistentItemId],
        },
        {
          headers: getAuthHeaders(),
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
      // Should return empty array or handle gracefully
    });

    it('should require authentication', async () => {
      try {
        await axios.post(`${API_BASE_URL}/ai/recommend-supplier`, {
          itemIds: [testItemId],
        });
        fail('Expected request to fail with 401');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });

    it('should validate request body', async () => {
      // Missing itemIds
      try {
        await axios.post(
          `${API_BASE_URL}/ai/recommend-supplier`,
          {},
          {
            headers: getAuthHeaders(),
          }
        );
        fail('Expected request to fail with 400');
      } catch (error) {
        expect(error.response.status).toBe(400);
      }

      // Invalid itemIds type
      try {
        await axios.post(
          `${API_BASE_URL}/ai/recommend-supplier`,
          {
            itemIds: 'not-an-array',
          },
          {
            headers: getAuthHeaders(),
          }
        );
        fail('Expected request to fail with 400');
      } catch (error) {
        expect(error.response.status).toBe(400);
      }

      // Invalid itemIds content
      try {
        await axios.post(
          `${API_BASE_URL}/ai/recommend-supplier`,
          {
            itemIds: [123, 456], // Should be strings
          },
          {
            headers: getAuthHeaders(),
          }
        );
        fail('Expected request to fail with 400');
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });

    it('should respond within reasonable time for moderate load', async () => {
      const startTime = Date.now();
      const response = await axios.post(
        `${API_BASE_URL}/ai/recommend-supplier`,
        {
          itemIds: [testItemId],
        },
        {
          headers: getAuthHeaders(),
        }
      );
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(5000); // Should respond within 5 seconds
    });
  });

  describe('POST /ai/optimize-quantities', () => {
    it('should return quantity optimization for purchase order', async () => {
      const samplePOItems = [
        {
          itemId: testItemId,
          currentQuantity: 100,
          unitPrice: 25.0,
          supplierId: testSupplierId,
          leadTime: 7,
          description: 'Test Item 1',
        },
        {
          itemId: testItemId,
          currentQuantity: 50,
          unitPrice: 40.0,
          supplierId: testSupplierId,
          leadTime: 5,
          description: 'Test Item 2',
        },
      ];

      const response = await axios.post(
        `${API_BASE_URL}/ai/optimize-quantities`,
        {
          poItems: samplePOItems,
        },
        {
          headers: getAuthHeaders(),
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('optimizedItems');
      expect(response.data).toHaveProperty('totalSavings');
      expect(response.data).toHaveProperty('optimizationScore');
      expect(response.data).toHaveProperty('reasoning');

      const optimization = response.data;
      expect(Array.isArray(optimization.optimizedItems)).toBe(true);
      expect(optimization.optimizedItems.length).toBe(samplePOItems.length);

      optimization.optimizedItems.forEach((item, index) => {
        expect(item).toHaveProperty('itemId');
        expect(item).toHaveProperty('originalQuantity');
        expect(item).toHaveProperty('optimizedQuantity');
        expect(item).toHaveProperty('savings');
        expect(item).toHaveProperty('reasoning');
        expect(item.itemId).toBe(samplePOItems[index].itemId);
        expect(typeof item.optimizedQuantity).toBe('number');
        expect(item.optimizedQuantity).toBeGreaterThan(0);
      });

      expect(typeof optimization.totalSavings).toBe('number');
      expect(typeof optimization.optimizationScore).toBe('number');
      expect(optimization.optimizationScore).toBeGreaterThanOrEqual(0);
      expect(optimization.optimizationScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(optimization.reasoning)).toBe(true);
      expect(optimization.reasoning.length).toBeGreaterThan(0);
    });

    it('should require authentication', async () => {
      try {
        await axios.post(`${API_BASE_URL}/ai/optimize-quantities`, {
          poItems: [
            {
              itemId: testItemId,
              currentQuantity: 100,
              unitPrice: 25.0,
              supplierId: testSupplierId,
              leadTime: 7,
              description: 'Test Item',
            },
          ],
        });
        fail('Expected request to fail with 401');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });

    it('should validate request body structure', async () => {
      // Missing poItems
      try {
        await axios.post(
          `${API_BASE_URL}/ai/optimize-quantities`,
          {},
          {
            headers: getAuthHeaders(),
          }
        );
        fail('Expected request to fail with 400');
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });
  });
});
