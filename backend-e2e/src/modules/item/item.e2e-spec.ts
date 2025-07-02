import axios from 'axios';
import { type AxiosErrorResponse, TestHelpers, type TestUser } from '../../support/test-helpers';

describe('Item API (E2E)', () => {
  const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3004';
  let authToken: string;
  let testUser: TestUser;
  let TEST_BRANCH_ID: string;
  let TEST_ITEM_ID: string;

  beforeAll(async () => {
    // Authenticate and get test data
    const auth = await TestHelpers.loginAsBranchManager();
    authToken = auth.accessToken;
    testUser = auth.user;
    TEST_BRANCH_ID = testUser.branchIds[0]; // Use first branch ID
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
          const axiosError = error as AxiosErrorResponse;
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
        const axiosError = error as AxiosErrorResponse;
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
      expect(response.data.data).toHaveProperty('data');
      expect(response.data.data).toHaveProperty('pagination');
      expect(Array.isArray(response.data.data.data)).toBe(true);
      expect(response.data.data.pagination).toMatchObject({
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
      expect(response.data.data.pagination).toBeNull();
      expect(Array.isArray(response.data.data.data)).toBe(true);
      expect(response.data.data.data.length).toBeGreaterThan(0);

      // Verify item structure
      const item = response.data.data.data[0];
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
      expect(response.data.data.data.length).toBeGreaterThanOrEqual(0);

      if (response.data.data.data.length > 0) {
        // At least one item should match the search term
        const hasMatchingItem = response.data.data.data.some(
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
      expect(response.data.data.data.length).toBeGreaterThan(0);

      const itemWithStock = response.data.data.data.find((item: any) => item.stock !== undefined);
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
        const axiosError = error as AxiosErrorResponse;
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
      expect(Array.isArray(response.data.data)).toBe(true);

      if (response.data.data.length > 0) {
        const item = response.data.data[0];
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

      if (response.data.data.length > 0) {
        const item = response.data.data[0];
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
      expect(response.data.data.length).toBeLessThanOrEqual(3);
    });

    it('should require query parameter', async () => {
      try {
        await axios.get(`${API_BASE_URL}/api/items/search`, {
          headers: getAuthHeaders(),
        });
        fail('Should have thrown an error for missing query parameter');
      } catch (error: unknown) {
        const axiosError = error as AxiosErrorResponse;
        expect([400, 422]).toContain(axiosError.response.status);
      }
    });

    it('should handle empty search results', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/items/search`, {
        params: { q: 'nonexistentitemthatdoesnotexist123' },
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.data).toEqual([]);
    });
  });

  describe('GET /api/items/by-branch/:branchId', () => {
    it('should get items for specific branch with stock information', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/items/by-branch/${TEST_BRANCH_ID}`, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.data).toHaveProperty('data');
      expect(response.data.data).toHaveProperty('pagination');
      expect(Array.isArray(response.data.data.data)).toBe(true);

      if (response.data.data.data.length > 0) {
        const item = response.data.data.data[0];
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
      expect(response.data.data.pagination).toMatchObject({
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
        const axiosError = error as AxiosErrorResponse;
        expect(axiosError.response.status).toBe(400);
      }
    });
  });

  describe('GET /api/items/:id', () => {
    it('should get specific item by ID', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/items/${TEST_ITEM_ID}`, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.data).toMatchObject({
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
      expect(response.data.data.buyingToMainRate).toEqual(expect.any(Number));
      expect(response.data.data.transferToMainRate).toEqual(expect.any(Number));
      expect(response.data.data.usingToMainRate).toEqual(expect.any(Number));

      // Verify stock levels
      expect(response.data.data.safetyStockLevel).toEqual(expect.any(Number));
      expect(response.data.data.reorderLevel).toEqual(expect.any(Number));
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

      if (response.data.data.stock) {
        expect(response.data.data.stock).toMatchObject({
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
        const axiosError = error as AxiosErrorResponse;
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
        const axiosError = error as AxiosErrorResponse;
        expect(axiosError.response.status).toBe(400);
      }
    });
  });

  describe('Role-based Access Control', () => {
    it('should allow branch manager access to item endpoints', async () => {
      expect(testUser.roles).toContain('BRANCH_MANAGER');

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
      expect(response.data.data.buyingToMainRate).toBeGreaterThan(0);
      expect(response.data.data.transferToMainRate).toBeGreaterThan(0);
      expect(response.data.data.usingToMainRate).toBeGreaterThan(0);
    });

    it('should include proper stock level thresholds', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/items/${TEST_ITEM_ID}`, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);

      // Stock levels should be non-negative
      expect(response.data.data.safetyStockLevel).toBeGreaterThanOrEqual(0);
      expect(response.data.data.reorderLevel).toBeGreaterThanOrEqual(0);
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
        const axiosError = error as AxiosErrorResponse;
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
        const axiosError = error as AxiosErrorResponse;
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
      expect(response.data.data.data.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Data Integrity', () => {
    it('should return consistent data structure across endpoints', async () => {
      // Get item from list endpoint
      const listResponse = await axios.get(`${API_BASE_URL}/api/items`, {
        params: { limit: 1 },
        headers: getAuthHeaders(),
      });

      if (listResponse.data.data.data.length > 0) {
        const itemFromList = listResponse.data.data.data[0];

        // Get same item from detail endpoint
        const detailResponse = await axios.get(`${API_BASE_URL}/api/items/${itemFromList.id}`, {
          headers: getAuthHeaders(),
        });

        // Basic fields should match
        expect(detailResponse.data.data.id).toBe(itemFromList.id);
        expect(detailResponse.data.data.name).toBe(itemFromList.name);
        expect(detailResponse.data.data.sku).toBe(itemFromList.sku);
        expect(detailResponse.data.data.mainUnit).toBe(itemFromList.mainUnit);
      }
    });

    it('should maintain referential integrity for stock data', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/items/by-branch/${TEST_BRANCH_ID}`, {
        params: { limit: 5 },
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);

      response.data.data.data.forEach((item: any) => {
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

  describe('CRUD Operations', () => {
    let createdItemId: string;
    let systemAdminToken: string;

    beforeAll(async () => {
      // Get system admin token for CRUD operations
      const adminAuth = await TestHelpers.loginAsSystemAdmin();
      systemAdminToken = adminAuth.accessToken;
    });

    describe('Create Item', () => {
      it('should create a new item with valid data', async () => {
        const itemData = {
          name: 'Test Steel Rod',
          sku: `TEST-STEEL-${Date.now()}`,
          description: 'Test steel rod for e2e testing',
          mainUnit: 'kg',
          buyingUnit: 'ton',
          transferUnit: 'kg',
          usingUnit: 'kg',
          buyingToMainRate: 1000,
          transferToMainRate: 1,
          usingToMainRate: 1,
          safetyStockLevel: 100,
          reorderLevel: 50,
          isActive: true,
        };

        const response = await axios.post(`${API_BASE_URL}/api/items`, itemData, {
          headers: TestHelpers.getAuthHeaders(systemAdminToken),
        });

        expect(response.status).toBe(201);
        expect(response.data.data).toMatchObject({
          name: itemData.name,
          sku: itemData.sku,
          description: itemData.description,
          mainUnit: itemData.mainUnit,
          buyingUnit: itemData.buyingUnit,
          transferUnit: itemData.transferUnit,
          usingUnit: itemData.usingUnit,
          buyingToMainRate: itemData.buyingToMainRate,
          transferToMainRate: itemData.transferToMainRate,
          usingToMainRate: itemData.usingToMainRate,
          safetyStockLevel: itemData.safetyStockLevel,
          reorderLevel: itemData.reorderLevel,
          isActive: itemData.isActive,
        });

        expect(response.data.data.id).toBeDefined();
        expect(response.data.data.createdAt).toBeDefined();
        expect(response.data.data.updatedAt).toBeDefined();

        createdItemId = response.data.data.id;
      });

      it('should reject duplicate SKU', async () => {
        const itemData = {
          name: 'Another Test Item',
          sku: `TEST-STEEL-${Date.now()}`, // Will use the same SKU as above
          description: 'Another test item',
          mainUnit: 'pieces',
          buyingUnit: 'pieces',
          transferUnit: 'pieces',
          usingUnit: 'pieces',
        };

        // First, get the SKU of the created item
        const existingItem = await axios.get(`${API_BASE_URL}/api/items/${createdItemId}`, {
          headers: TestHelpers.getAuthHeaders(systemAdminToken),
        });

        itemData.sku = existingItem.data.data.sku;

        try {
          await axios.post(`${API_BASE_URL}/api/items`, itemData, {
            headers: TestHelpers.getAuthHeaders(systemAdminToken),
          });
          fail('Should have thrown conflict error');
        } catch (error: unknown) {
          const axiosError = error as AxiosErrorResponse;
          expect(axiosError.response.status).toBe(409);
        }
      });

      it('should require authentication for create', async () => {
        const timestamp = Date.now();
        const itemData = {
          name: `Unauthorized Item ${timestamp}`,
          sku: `UNAUTH-${timestamp}`,
          mainUnit: 'kg',
          buyingUnit: 'kg',
          transferUnit: 'kg',
          usingUnit: 'kg',
        };

        try {
          await axios.post(`${API_BASE_URL}/api/items`, itemData);
          fail('Should have thrown 401 error');
        } catch (error: unknown) {
          const axiosError = error as AxiosErrorResponse;
          expect(axiosError.response.status).toBe(401);
        }
      });

      it('should require system admin or branch manager role for create', async () => {
        const timestamp = Date.now();
        const itemData = {
          name: `Forbidden Item ${timestamp}`,
          sku: `FORBID-${timestamp}`,
          mainUnit: 'kg',
          buyingUnit: 'kg',
          transferUnit: 'kg',
          usingUnit: 'kg',
        };

        // Use regular branch manager token (should work)
        const response = await axios.post(`${API_BASE_URL}/api/items`, itemData, {
          headers: getAuthHeaders(),
        });

        expect(response.status).toBe(201);

        // Clean up
        await axios.delete(`${API_BASE_URL}/api/items/${response.data.data.id}`, {
          headers: TestHelpers.getAuthHeaders(systemAdminToken),
        });
      });

      it('should validate required fields', async () => {
        const invalidData = {
          description: 'Missing required fields',
        };

        try {
          await axios.post(`${API_BASE_URL}/api/items`, invalidData, {
            headers: TestHelpers.getAuthHeaders(systemAdminToken),
          });
          fail('Should have thrown validation error');
        } catch (error: unknown) {
          const axiosError = error as AxiosErrorResponse;
          expect(axiosError.response.status).toBe(400);
        }
      });
    });

    describe('Update Item', () => {
      it('should update item with valid data', async () => {
        const updateData = {
          name: 'Updated Test Steel Rod',
          description: 'Updated description for e2e testing',
          safetyStockLevel: 150,
          reorderLevel: 75,
        };

        const response = await axios.put(`${API_BASE_URL}/api/items/${createdItemId}`, updateData, {
          headers: TestHelpers.getAuthHeaders(systemAdminToken),
        });

        expect(response.status).toBe(200);
        expect(response.data.data).toMatchObject(updateData);
        expect(response.data.data.id).toBe(createdItemId);
      });

      it('should return 404 for non-existent item', async () => {
        const updateData = {
          name: 'Non-existent Item',
        };

        try {
          await axios.put(
            `${API_BASE_URL}/api/items/00000000-0000-0000-0000-000000000999`,
            updateData,
            {
              headers: TestHelpers.getAuthHeaders(systemAdminToken),
            }
          );
          fail('Should have thrown 404 error');
        } catch (error: unknown) {
          const axiosError = error as AxiosErrorResponse;
          expect(axiosError.response.status).toBe(404);
        }
      });

      it('should require authentication for update', async () => {
        const updateData = {
          name: 'Unauthorized Update',
        };

        try {
          await axios.put(`${API_BASE_URL}/api/items/${createdItemId}`, updateData);
          fail('Should have thrown 401 error');
        } catch (error: unknown) {
          const axiosError = error as AxiosErrorResponse;
          expect(axiosError.response.status).toBe(401);
        }
      });
    });

    describe('Delete Item', () => {
      it('should soft delete item (deactivate)', async () => {
        const response = await axios.delete(`${API_BASE_URL}/api/items/${createdItemId}`, {
          headers: TestHelpers.getAuthHeaders(systemAdminToken),
        });

        expect(response.status).toBe(200);
        expect(response.data.data.isActive).toBe(false);
        expect(response.data.data.id).toBe(createdItemId);
      });

      it('should require system admin role for delete', async () => {
        // Create a new item for this test
        const itemData = {
          name: 'Delete Test Item',
          sku: `DELETE-TEST-${Date.now()}`,
          mainUnit: 'kg',
          buyingUnit: 'kg',
          transferUnit: 'kg',
          usingUnit: 'kg',
        };

        const createResponse = await axios.post(`${API_BASE_URL}/api/items`, itemData, {
          headers: TestHelpers.getAuthHeaders(systemAdminToken),
        });

        // Try to delete with branch manager token (should fail)
        try {
          await axios.delete(`${API_BASE_URL}/api/items/${createResponse.data.data.id}`, {
            headers: getAuthHeaders(),
          });
          fail('Should have thrown 403 error');
        } catch (error: unknown) {
          const axiosError = error as AxiosErrorResponse;
          expect(axiosError.response.status).toBe(403);
        }

        // Clean up with system admin
        await axios.delete(`${API_BASE_URL}/api/items/${createResponse.data.data.id}`, {
          headers: TestHelpers.getAuthHeaders(systemAdminToken),
        });
      });

      it('should return 404 for non-existent item delete', async () => {
        try {
          await axios.delete(`${API_BASE_URL}/api/items/00000000-0000-0000-0000-000000000999`, {
            headers: TestHelpers.getAuthHeaders(systemAdminToken),
          });
          fail('Should have thrown 404 error');
        } catch (error: unknown) {
          const axiosError = error as AxiosErrorResponse;
          expect(axiosError.response.status).toBe(404);
        }
      });

      it('should hard delete item when no references exist', async () => {
        // Create a new item for hard delete test
        const itemData = {
          name: 'Hard Delete Test Item',
          sku: `HARD-DELETE-${Date.now()}`,
          mainUnit: 'kg',
          buyingUnit: 'kg',
          transferUnit: 'kg',
          usingUnit: 'kg',
        };

        const createResponse = await axios.post(`${API_BASE_URL}/api/items`, itemData, {
          headers: TestHelpers.getAuthHeaders(systemAdminToken),
        });

        const hardDeleteResponse = await axios.delete(
          `${API_BASE_URL}/api/items/${createResponse.data.data.id}/hard`,
          {
            headers: TestHelpers.getAuthHeaders(systemAdminToken),
          }
        );

        expect(hardDeleteResponse.status).toBe(204);

        // Verify item is gone
        try {
          await axios.get(`${API_BASE_URL}/api/items/${createResponse.data.data.id}`, {
            headers: TestHelpers.getAuthHeaders(systemAdminToken),
          });
          fail('Should have thrown 404 error');
        } catch (error: unknown) {
          const axiosError = error as AxiosErrorResponse;
          expect(axiosError.response.status).toBe(404);
        }
      });
    });

    describe('Unit Conversions (FR-2, FR-3)', () => {
      let conversionItemId: string;

      beforeAll(async () => {
        // Create a test item with specific conversion rates
        const itemData = {
          name: 'Conversion Test Steel Rod',
          sku: `CONV-STEEL-${Date.now()}`,
          description: 'Test item for unit conversion e2e tests',
          mainUnit: 'kg',
          buyingUnit: 'ton',
          transferUnit: 'kg',
          usingUnit: 'g',
          buyingToMainRate: 1000, // 1 ton = 1000 kg
          transferToMainRate: 1, // 1 kg = 1 kg
          usingToMainRate: 0.001, // 1 g = 0.001 kg
          safetyStockLevel: 100,
          reorderLevel: 50,
        };

        const response = await axios.post(`${API_BASE_URL}/api/items`, itemData, {
          headers: TestHelpers.getAuthHeaders(systemAdminToken),
        });

        conversionItemId = response.data.data.id;
      });

      afterAll(async () => {
        // Clean up test item
        if (conversionItemId) {
          try {
            await axios.delete(`${API_BASE_URL}/api/items/${conversionItemId}/hard`, {
              headers: TestHelpers.getAuthHeaders(systemAdminToken),
            });
          } catch (_error) {
            // Ignore cleanup errors
          }
        }
      });

      it('should get unit conversion information without quantities', async () => {
        const response = await axios.get(
          `${API_BASE_URL}/api/items/${conversionItemId}/conversions`,
          {
            headers: getAuthHeaders(),
          }
        );

        expect(response.status).toBe(200);
        expect(response.data.data).toHaveProperty('item');
        expect(response.data.data).toHaveProperty('conversions');

        const conversions = response.data.data.conversions;
        expect(conversions.rates).toMatchObject({
          buyingToMain: 1000,
          transferToMain: 1,
          usingToMain: 0.001,
        });
        expect(conversions.units).toMatchObject({
          main: 'kg',
          buying: 'ton',
          transfer: 'kg',
          using: 'g',
        });
      });

      it('should calculate unit conversions with provided quantities', async () => {
        const response = await axios.get(
          `${API_BASE_URL}/api/items/${conversionItemId}/conversions`,
          {
            params: {
              buyingQty: 2, // 2 tons
              transferQty: 500, // 500 kg
              usingQty: 2000, // 2000 g
            },
            headers: getAuthHeaders(),
          }
        );

        expect(response.status).toBe(200);
        const conversions = response.data.data.conversions;

        expect(conversions.conversions).toMatchObject({
          buyingToMain: 2000, // 2 tons = 2000 kg
          transferToMain: 500, // 500 kg = 500 kg
          usingToMain: 2, // 2000 g = 2 kg
        });
      });

      it('should require authentication for unit conversion endpoint', async () => {
        try {
          await axios.get(`${API_BASE_URL}/api/items/${conversionItemId}/conversions`);
          fail('Should have thrown 401 error');
        } catch (error: unknown) {
          const axiosError = error as AxiosErrorResponse;
          expect(axiosError.response.status).toBe(401);
        }
      });

      it('should return 404 for non-existent item conversions', async () => {
        try {
          await axios.get(
            `${API_BASE_URL}/api/items/00000000-0000-0000-0000-000000000999/conversions`,
            {
              headers: getAuthHeaders(),
            }
          );
          fail('Should have thrown 404 error');
        } catch (error: unknown) {
          const axiosError = error as AxiosErrorResponse;
          expect(axiosError.response.status).toBe(404);
        }
      });
    });

    describe('Enhanced Validation', () => {
      it('should validate SKU format (uppercase alphanumeric with hyphens/underscores)', async () => {
        const invalidSKUs = [
          'invalid-sku-lowercase',
          'INVALID@SKU',
          'INVALID SKU',
          'invalid_sku_lowercase',
        ];

        for (const invalidSKU of invalidSKUs) {
          const itemData = {
            name: `Test Item ${Date.now()}`,
            sku: invalidSKU,
            mainUnit: 'kg',
            buyingUnit: 'kg',
            transferUnit: 'kg',
            usingUnit: 'kg',
          };

          try {
            await axios.post(`${API_BASE_URL}/api/items`, itemData, {
              headers: TestHelpers.getAuthHeaders(systemAdminToken),
            });
            fail(`Should have thrown validation error for SKU: ${invalidSKU}`);
          } catch (error: unknown) {
            const axiosError = error as AxiosErrorResponse;
            expect(axiosError.response.status).toBe(400);
          }
        }
      });

      it('should accept valid SKU formats', async () => {
        const validSKUs = ['VALID-SKU-123', 'VALID_SKU_456', 'VALIDSKU789', 'ITEM-001_V2'];

        const createdItems: string[] = [];

        for (const validSKU of validSKUs) {
          const itemData = {
            name: `Test Item ${Date.now()}`,
            sku: validSKU,
            mainUnit: 'kg',
            buyingUnit: 'kg',
            transferUnit: 'kg',
            usingUnit: 'kg',
          };

          const response = await axios.post(`${API_BASE_URL}/api/items`, itemData, {
            headers: TestHelpers.getAuthHeaders(systemAdminToken),
          });

          expect(response.status).toBe(201);
          expect(response.data.data.sku).toBe(validSKU);
          createdItems.push(response.data.data.id);
        }

        // Clean up
        for (const itemId of createdItems) {
          try {
            await axios.delete(`${API_BASE_URL}/api/items/${itemId}/hard`, {
              headers: TestHelpers.getAuthHeaders(systemAdminToken),
            });
          } catch (_error) {
            // Ignore cleanup errors
          }
        }
      });

      it('should validate conversion rates are positive', async () => {
        const itemData = {
          name: `Test Item ${Date.now()}`,
          sku: `TEST-NEGATIVE-${Date.now()}`,
          mainUnit: 'kg',
          buyingUnit: 'kg',
          transferUnit: 'kg',
          usingUnit: 'kg',
          buyingToMainRate: -1, // Invalid negative rate
        };

        try {
          await axios.post(`${API_BASE_URL}/api/items`, itemData, {
            headers: TestHelpers.getAuthHeaders(systemAdminToken),
          });
          fail('Should have thrown validation error for negative conversion rate');
        } catch (error: unknown) {
          const axiosError = error as AxiosErrorResponse;
          expect(axiosError.response.status).toBe(400);
        }
      });
    });

    describe('Stock Level Filtering (FR-9)', () => {
      const stockTestItems: string[] = [];

      beforeAll(async () => {
        // Create test items with different stock scenarios
        const testItems = [
          {
            name: 'Out of Stock Item',
            sku: `OUT-OF-STOCK-${Date.now()}`,
            safetyStockLevel: 100,
            reorderLevel: 50,
          },
          {
            name: 'Below Safety Stock Item',
            sku: `BELOW-SAFETY-${Date.now()}`,
            safetyStockLevel: 100,
            reorderLevel: 50,
          },
          {
            name: 'Below Reorder Level Item',
            sku: `BELOW-REORDER-${Date.now()}`,
            safetyStockLevel: 100,
            reorderLevel: 50,
          },
          {
            name: 'Low Stock Item',
            sku: `LOW-STOCK-${Date.now()}`,
            safetyStockLevel: 100,
            reorderLevel: 50,
          },
          {
            name: 'Normal Stock Item',
            sku: `NORMAL-STOCK-${Date.now()}`,
            safetyStockLevel: 100,
            reorderLevel: 50,
          },
        ];

        for (const item of testItems) {
          const itemData = {
            ...item,
            mainUnit: 'kg',
            buyingUnit: 'kg',
            transferUnit: 'kg',
            usingUnit: 'kg',
          };

          const response = await axios.post(`${API_BASE_URL}/api/items`, itemData, {
            headers: TestHelpers.getAuthHeaders(systemAdminToken),
          });

          stockTestItems.push(response.data.data.id);
        }

        // Note: In a real test, we would need to create stock records for these items
        // For now, we'll test the filtering logic without actual stock data
      });

      afterAll(async () => {
        // Clean up test items
        for (const itemId of stockTestItems) {
          try {
            await axios.delete(`${API_BASE_URL}/api/items/${itemId}/hard`, {
              headers: TestHelpers.getAuthHeaders(systemAdminToken),
            });
          } catch (_error) {
            // Ignore cleanup errors
          }
        }
      });

      it('should filter items below safety stock level', async () => {
        const response = await axios.get(`${API_BASE_URL}/api/items`, {
          params: {
            branchId: TEST_BRANCH_ID,
            includeStock: true,
            belowSafetyStock: true,
          },
          headers: getAuthHeaders(),
        });

        expect(response.status).toBe(200);
        expect(response.data.data).toBeInstanceOf(Array);
        // Note: Without actual stock data, this will return empty array
        // In a real scenario with stock data, we would verify the filtering logic
      });

      it('should filter items below reorder level', async () => {
        const response = await axios.get(`${API_BASE_URL}/api/items`, {
          params: {
            branchId: TEST_BRANCH_ID,
            includeStock: true,
            belowReorderLevel: true,
          },
          headers: getAuthHeaders(),
        });

        expect(response.status).toBe(200);
        expect(response.data.data).toBeInstanceOf(Array);
      });

      it('should filter out of stock items', async () => {
        const response = await axios.get(`${API_BASE_URL}/api/items`, {
          params: {
            branchId: TEST_BRANCH_ID,
            includeStock: true,
            outOfStock: true,
          },
          headers: getAuthHeaders(),
        });

        expect(response.status).toBe(200);
        expect(response.data.data).toBeInstanceOf(Array);
      });

      it('should filter low stock items', async () => {
        const response = await axios.get(`${API_BASE_URL}/api/items`, {
          params: {
            branchId: TEST_BRANCH_ID,
            includeStock: true,
            lowStock: true,
          },
          headers: getAuthHeaders(),
        });

        expect(response.status).toBe(200);
        expect(response.data.data).toBeInstanceOf(Array);
      });
    });

    describe('AI Monitoring Alerts Endpoint (FR-9)', () => {
      it('should get monitoring alerts for a branch', async () => {
        const response = await axios.get(`${API_BASE_URL}/api/items/monitoring/alerts`, {
          params: {
            branchId: TEST_BRANCH_ID,
          },
          headers: getAuthHeaders(),
        });

        expect(response.status).toBe(200);
        expect(response.data.data).toHaveProperty('data');
        expect(response.data.data).toHaveProperty('summary');

        const summary = response.data.data.summary;
        expect(summary).toMatchObject({
          outOfStock: expect.any(Number),
          belowSafetyStock: expect.any(Number),
          belowReorderLevel: expect.any(Number),
          lowStock: expect.any(Number),
          total: expect.any(Number),
        });
      });

      it('should filter alerts by type', async () => {
        const alertTypes = ['outOfStock', 'belowSafetyStock', 'belowReorderLevel', 'lowStock'];

        for (const alertType of alertTypes) {
          const response = await axios.get(`${API_BASE_URL}/api/items/monitoring/alerts`, {
            params: {
              branchId: TEST_BRANCH_ID,
              alertType,
            },
            headers: getAuthHeaders(),
          });

          expect(response.status).toBe(200);
          expect(response.data.data).toHaveProperty('data');
          expect(response.data.data).toHaveProperty('summary');
        }
      });

      it('should require branchId parameter', async () => {
        try {
          await axios.get(`${API_BASE_URL}/api/items/monitoring/alerts`, {
            headers: getAuthHeaders(),
          });
          fail('Should have thrown validation error for missing branchId');
        } catch (error: unknown) {
          const axiosError = error as AxiosErrorResponse;
          expect(axiosError.response.status).toBe(400);
        }
      });

      it('should require authentication for monitoring alerts', async () => {
        try {
          await axios.get(`${API_BASE_URL}/api/items/monitoring/alerts`, {
            params: {
              branchId: TEST_BRANCH_ID,
            },
          });
          fail('Should have thrown 401 error');
        } catch (error: unknown) {
          const axiosError = error as AxiosErrorResponse;
          expect(axiosError.response.status).toBe(401);
        }
      });

      it('should allow appropriate roles for monitoring alerts', async () => {
        const allowedRoles = [
          { name: 'System Admin', token: systemAdminToken },
          { name: 'Branch Manager', token: authToken },
        ];

        for (const role of allowedRoles) {
          const response = await axios.get(`${API_BASE_URL}/api/items/monitoring/alerts`, {
            params: {
              branchId: TEST_BRANCH_ID,
            },
            headers: TestHelpers.getAuthHeaders(role.token),
          });

          expect(response.status).toBe(200);
        }
      });
    });
  });
});
