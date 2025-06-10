import axios from 'axios';
import { TestHelpers, type TestUser } from '../../support/test-helpers';

describe('Item API (E2E)', () => {
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
    it('should require authentication for item endpoints', async () => {
      const endpoints = [
        '/api/items',
        '/api/items/search?q=test',
        `/api/items/by-branch/${TEST_BRANCH_ID}`,
        `/api/items/${TEST_ITEM_ID}`,
      ];

      for (const endpoint of endpoints) {
        try {
          await axios.get(`${API_BASE_URL}${endpoint}`);
          fail(`Should have thrown 401 error for ${endpoint}`);
        } catch (error: unknown) {
          const axiosError = error as { response: { status: number } };
          expect(axiosError.response.status).toBe(401);
        }
      }
    });

    it('should reject invalid authentication tokens', async () => {
      try {
        await axios.get(`${API_BASE_URL}/api/items`, {
          headers: {
            Authorization: 'Bearer invalid-token',
          },
        });
        fail('Should have thrown 401 error');
      } catch (error: unknown) {
        const axiosError = error as { response: { status: number } };
        expect(axiosError.response.status).toBe(401);
      }
    });
  });

  describe('GET /api/items', () => {
    it('should get all items with pagination when params provided', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/items`, {
        params: { page: 1, limit: 10 },
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      expect(response.data).toHaveProperty('pagination');
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: expect.any(Number),
        totalPages: expect.any(Number),
        hasNext: expect.any(Boolean),
        hasPrev: expect.any(Boolean),
      });
    });

    it('should get all items without pagination when no params provided', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/items`, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      expect(response.data.pagination).toBeNull();
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeGreaterThan(0);

      // Verify item structure
      const item = response.data.data[0];
      expect(item).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        sku: expect.any(String),
        mainUnit: expect.any(String),
        buyingUnit: expect.any(String),
        transferUnit: expect.any(String),
        usingUnit: expect.any(String),
        isActive: expect.any(Boolean),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should filter items by search term', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/items`, {
        params: { search: 'Material' },
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.data.length).toBeGreaterThanOrEqual(0);

      if (response.data.data.length > 0) {
        // At least one item should match the search term
        const hasMatchingItem = response.data.data.some(
          (item: any) =>
            item.name.toLowerCase().includes('material') ||
            item.sku.toLowerCase().includes('material') ||
            item.description?.toLowerCase().includes('material')
        );
        expect(hasMatchingItem).toBe(true);
      }
    });

    it('should include stock information when requested with branchId', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/items`, {
        params: {
          branchId: TEST_BRANCH_ID,
          includeStock: true,
          limit: 5, // Limit for performance
        },
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.data.length).toBeGreaterThan(0);

      const itemWithStock = response.data.data.find((item: any) => item.stock !== undefined);
      if (itemWithStock) {
        expect(itemWithStock.stock).toMatchObject({
          quantity: expect.any(Number),
          reservedQty: expect.any(Number),
          availableQty: expect.any(Number),
          averageCost: expect.any(Number),
          lastCost: expect.any(Number),
        });
      }
    });

    it('should include inactive items when requested', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/items`, {
        params: { includeInactive: true },
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
    });
    it('should handle invalid pagination parameters gracefully', async () => {
      try {
        await axios.get(`${API_BASE_URL}/api/items`, {
          params: { page: -1, limit: 0 },
          headers: getAuthHeaders(),
        });
        fail('Should have thrown 400 error for invalid parameters');
      } catch (error: unknown) {
        const axiosError = error as { response: { status: number } };
        expect(axiosError.response.status).toBe(400);
      }
    });
  });

  describe('GET /api/items/search', () => {
    it('should search items by query parameter', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/items/search`, {
        params: { q: 'Raw' },
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);

      if (response.data.length > 0) {
        const item = response.data[0];
        expect(item).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          sku: expect.any(String),
          mainUnit: expect.any(String),
          buyingUnit: expect.any(String),
          transferUnit: expect.any(String),
          usingUnit: expect.any(String),
          stock: null, // Default when no branchId provided
        });
      }
    });

    it('should include stock information when branchId provided', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/items/search`, {
        params: {
          q: 'Raw',
          branchId: TEST_BRANCH_ID,
        },
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);

      if (response.data.length > 0) {
        const item = response.data[0];
        // Stock may be null if no stock record exists for this branch
        if (item.stock) {
          expect(item.stock).toMatchObject({
            quantity: expect.any(Number),
            availableQty: expect.any(Number),
          });
        }
      }
    });

    it('should limit results when limit parameter provided', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/items/search`, {
        params: {
          q: 'a', // Broad search to get many results
          limit: 3,
        },
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.length).toBeLessThanOrEqual(3);
    });

    it('should require query parameter', async () => {
      try {
        await axios.get(`${API_BASE_URL}/api/items/search`, {
          headers: getAuthHeaders(),
        });
        fail('Should have thrown an error for missing query parameter');
      } catch (error: unknown) {
        const axiosError = error as { response: { status: number } };
        expect([400, 422]).toContain(axiosError.response.status);
      }
    });

    it('should handle empty search results', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/items/search`, {
        params: { q: 'nonexistentitemthatdoesnotexist123' },
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data).toEqual([]);
    });
  });

  describe('GET /api/items/by-branch/:branchId', () => {
    it('should get items for specific branch with stock information', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/items/by-branch/${TEST_BRANCH_ID}`, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      expect(response.data).toHaveProperty('pagination');
      expect(Array.isArray(response.data.data)).toBe(true);

      if (response.data.data.length > 0) {
        const item = response.data.data[0];
        expect(item).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          sku: expect.any(String),
          mainUnit: expect.any(String),
        });

        // Should include stock information for the specified branch
        if (item.stock) {
          expect(item.stock).toMatchObject({
            quantity: expect.any(Number),
            reservedQty: expect.any(Number),
            availableQty: expect.any(Number),
            averageCost: expect.any(Number),
            lastCost: expect.any(Number),
          });
        }
      }
    });

    it('should support pagination for branch items', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/items/by-branch/${TEST_BRANCH_ID}`, {
        params: { page: 1, limit: 5 },
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.pagination).toMatchObject({
        page: 1,
        limit: 5,
        total: expect.any(Number),
        totalPages: expect.any(Number),
        hasNext: expect.any(Boolean),
        hasPrev: expect.any(Boolean),
      });
    });
    it('should return 400 for invalid branch UUID', async () => {
      const invalidBranchId = 'invalid-uuid';

      try {
        await axios.get(`${API_BASE_URL}/api/items/by-branch/${invalidBranchId}`, {
          headers: getAuthHeaders(),
        });
        fail('Should have thrown 400 error');
      } catch (error: unknown) {
        const axiosError = error as { response?: { status: number } };
        expect(axiosError.response?.status).toBe(400);
      }
    });
  });

  describe('GET /api/items/:id', () => {
    it('should get specific item by ID', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/items/${TEST_ITEM_ID}`, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        id: TEST_ITEM_ID,
        name: expect.any(String),
        sku: expect.any(String),
        mainUnit: expect.any(String),
        buyingUnit: expect.any(String),
        transferUnit: expect.any(String),
        usingUnit: expect.any(String),
        isActive: expect.any(Boolean),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      // Verify conversion rates
      expect(response.data.buyingToMainRate).toEqual(expect.any(Number));
      expect(response.data.transferToMainRate).toEqual(expect.any(Number));
      expect(response.data.usingToMainRate).toEqual(expect.any(Number));

      // Verify stock levels
      expect(response.data.safetyStockLevel).toEqual(expect.any(Number));
      expect(response.data.reorderLevel).toEqual(expect.any(Number));
    });

    it('should include stock information when requested with branchId', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/items/${TEST_ITEM_ID}`, {
        params: {
          branchId: TEST_BRANCH_ID,
          includeStock: true,
        },
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);

      if (response.data.stock) {
        expect(response.data.stock).toMatchObject({
          quantity: expect.any(Number),
          reservedQty: expect.any(Number),
          availableQty: expect.any(Number),
          averageCost: expect.any(Number),
          lastCost: expect.any(Number),
        });
      }
    });

    it('should return 404 for non-existent item', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      try {
        await axios.get(`${API_BASE_URL}/api/items/${nonExistentId}`, {
          headers: getAuthHeaders(),
        });
        fail('Should have thrown 404 error');
      } catch (error: unknown) {
        const axiosError = error as { response: { status: number } };
        expect(axiosError.response.status).toBe(404);
      }
    });
    it('should return 400 for invalid UUID format', async () => {
      const invalidId = 'invalid-uuid';

      try {
        await axios.get(`${API_BASE_URL}/api/items/${invalidId}`, {
          headers: getAuthHeaders(),
        });
        fail('Should have thrown 400 error');
      } catch (error: unknown) {
        const axiosError = error as { response: { status: number } };
        expect(axiosError.response.status).toBe(400);
      }
    });
  });

  describe('Role-based Access Control', () => {
    it('should allow branch manager access to item endpoints', async () => {
      expect(testUser.role).toBe('BRANCH_MANAGER');

      const response = await axios.get(`${API_BASE_URL}/api/items`, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
    });

    it('should allow procurement specialist access', async () => {
      const procurementAuth = await TestHelpers.loginAsProcurementSpecialist();

      const response = await axios.get(`${API_BASE_URL}/api/items`, {
        headers: TestHelpers.getAuthHeaders(procurementAuth.accessToken),
      });

      expect(response.status).toBe(200);
    });
  });

  describe('Unit Conversion and Stock Management', () => {
    it('should return valid unit conversion rates', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/items/${TEST_ITEM_ID}`, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);

      // All rates should be positive numbers
      expect(response.data.buyingToMainRate).toBeGreaterThan(0);
      expect(response.data.transferToMainRate).toBeGreaterThan(0);
      expect(response.data.usingToMainRate).toBeGreaterThan(0);
    });

    it('should include proper stock level thresholds', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/items/${TEST_ITEM_ID}`, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);

      // Stock levels should be non-negative
      expect(response.data.safetyStockLevel).toBeGreaterThanOrEqual(0);
      expect(response.data.reorderLevel).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      try {
        await axios.get(`${API_BASE_URL}/api/items`, {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/xml',
          },
        });
      } catch (error: unknown) {
        const axiosError = error as { response: { status: number } };
        expect([200, 400, 406, 415]).toContain(axiosError.response.status);
      }
    });
    it('should validate query parameters correctly', async () => {
      try {
        await axios.get(`${API_BASE_URL}/api/items`, {
          params: {
            page: 'invalid',
            limit: 'also-invalid',
            includeInactive: 'not-boolean',
            includeStock: 'not-boolean',
          },
          headers: getAuthHeaders(),
        });
        fail('Should have thrown 400 error for invalid parameters');
      } catch (error: unknown) {
        const axiosError = error as { response: { status: number } };
        expect(axiosError.response.status).toBe(400);
      }
    });
  });

  describe('Performance and Load', () => {
    it('should handle concurrent requests', async () => {
      const promises = Array.from({ length: 5 }, () =>
        axios.get(`${API_BASE_URL}/api/items`, {
          params: { limit: 10 }, // Limit for performance
          headers: getAuthHeaders(),
        })
      );

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('data');
      });
    });

    it('should respond within reasonable time', async () => {
      const startTime = Date.now();

      const response = await axios.get(`${API_BASE_URL}/api/items`, {
        params: { limit: 20 },
        headers: getAuthHeaders(),
      });

      const responseTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(3000); // Should respond within 3 seconds
    });

    it('should handle large result sets efficiently', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/items`, {
        params: {
          search: 'a', // Broad search
          limit: 100,
        },
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.data.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Data Integrity', () => {
    it('should return consistent data structure across endpoints', async () => {
      // Get item from list endpoint
      const listResponse = await axios.get(`${API_BASE_URL}/api/items`, {
        params: { limit: 1 },
        headers: getAuthHeaders(),
      });

      if (listResponse.data.data.length > 0) {
        const itemFromList = listResponse.data.data[0];

        // Get same item from detail endpoint
        const detailResponse = await axios.get(`${API_BASE_URL}/api/items/${itemFromList.id}`, {
          headers: getAuthHeaders(),
        });

        // Basic fields should match
        expect(detailResponse.data.id).toBe(itemFromList.id);
        expect(detailResponse.data.name).toBe(itemFromList.name);
        expect(detailResponse.data.sku).toBe(itemFromList.sku);
        expect(detailResponse.data.mainUnit).toBe(itemFromList.mainUnit);
      }
    });

    it('should maintain referential integrity for stock data', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/items/by-branch/${TEST_BRANCH_ID}`, {
        params: { limit: 5 },
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);

      response.data.data.forEach((item: any) => {
        if (item.stock) {
          // Available quantity should not exceed total quantity
          expect(item.stock.availableQty).toBeLessThanOrEqual(item.stock.quantity);

          // Reserved quantity should be non-negative
          expect(item.stock.reservedQty).toBeGreaterThanOrEqual(0);

          // Costs should be non-negative
          expect(item.stock.averageCost).toBeGreaterThanOrEqual(0);
          expect(item.stock.lastCost).toBeGreaterThanOrEqual(0);
        }
      });
    });
  });
});
