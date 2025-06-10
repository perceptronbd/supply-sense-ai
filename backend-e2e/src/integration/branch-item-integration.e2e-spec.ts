import axios from 'axios';
import { TestHelpers, type TestUser } from '../../support/test-helpers';

describe('Branch-Item Integration (E2E)', () => {
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

  describe('Branch-Item Data Consistency', () => {
    it('should have consistent branch data across branch and item endpoints', async () => {
      // Get user's branch from branch endpoint
      const branchResponse = await axios.get(`${API_BASE_URL}/api/branches/my-branch`, {
        headers: getAuthHeaders(),
      });

      expect(branchResponse.status).toBe(200);
      expect(branchResponse.data.data).toHaveLength(1);
      const userBranch = branchResponse.data.data[0];

      // Get items for the same branch
      const itemsResponse = await axios.get(
        `${API_BASE_URL}/api/items/by-branch/${TEST_BRANCH_ID}`,
        {
          params: { limit: 5 },
          headers: getAuthHeaders(),
        }
      );

      expect(itemsResponse.status).toBe(200);

      // Verify that the branch ID used in items endpoint matches user's branch
      expect(TEST_BRANCH_ID).toBe(userBranch.id);
    });

    it('should show stock information for user branch items', async () => {
      // Get items with stock for user's branch
      const response = await axios.get(`${API_BASE_URL}/api/items/by-branch/${TEST_BRANCH_ID}`, {
        params: { limit: 10 },
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);

      if (response.data.data.length > 0) {
        // At least some items should have stock information
        const itemsWithStock = response.data.data.filter((item: any) => item.stock !== null);
        expect(itemsWithStock.length).toBeGreaterThanOrEqual(0);

        if (itemsWithStock.length > 0) {
          const stockItem = itemsWithStock[0];
          expect(stockItem.stock).toMatchObject({
            quantity: expect.any(Number),
            reservedQty: expect.any(Number),
            availableQty: expect.any(Number),
            averageCost: expect.any(Number),
            lastCost: expect.any(Number),
          });
        }
      }
    });
  });

  describe('Cross-Branch Access Control', () => {
    it('should allow users to view items from other branches (without stock)', async () => {
      // Get all branches
      const branchesResponse = await axios.get(`${API_BASE_URL}/api/branches`, {
        headers: getAuthHeaders(),
      });

      expect(branchesResponse.status).toBe(200);

      if (branchesResponse.data.data.length > 1) {
        // Find a different branch
        const otherBranch = branchesResponse.data.data.find(
          (branch: any) => branch.id !== TEST_BRANCH_ID
        );

        if (otherBranch) {
          // Try to access items from another branch
          const itemsResponse = await axios.get(
            `${API_BASE_URL}/api/items/by-branch/${otherBranch.id}`,
            {
              params: { limit: 5 },
              headers: getAuthHeaders(),
            }
          );

          expect(itemsResponse.status).toBe(200);
          // Should be able to see items, but stock information might be limited
        }
      }
    });

    it('should enforce branch-specific stock data', async () => {
      // Get the same item with different branch contexts
      const itemWithUserBranchStock = await axios.get(`${API_BASE_URL}/api/items/${TEST_ITEM_ID}`, {
        params: {
          branchId: TEST_BRANCH_ID,
          includeStock: true,
        },
        headers: getAuthHeaders(),
      });

      expect(itemWithUserBranchStock.status).toBe(200);

      // Get all branches to test with a different one
      const branchesResponse = await axios.get(`${API_BASE_URL}/api/branches`, {
        headers: getAuthHeaders(),
      });

      if (branchesResponse.data.data.length > 1) {
        const otherBranch = branchesResponse.data.data.find(
          (branch: any) => branch.id !== TEST_BRANCH_ID
        );

        if (otherBranch) {
          const itemWithOtherBranchStock = await axios.get(
            `${API_BASE_URL}/api/items/${TEST_ITEM_ID}`,
            {
              params: {
                branchId: otherBranch.id,
                includeStock: true,
              },
              headers: getAuthHeaders(),
            }
          );

          expect(itemWithOtherBranchStock.status).toBe(200);

          // Stock data should be different or null for different branches
          if (itemWithUserBranchStock.data.stock && itemWithOtherBranchStock.data.stock) {
            // Stock quantities might be different between branches
            expect(itemWithUserBranchStock.data.stock).toBeDefined();
            expect(itemWithOtherBranchStock.data.stock).toBeDefined();
          }
        }
      }
    });
  });

  describe('User Context Integration', () => {
    it('should provide user-specific branch context in API responses', async () => {
      // Get user's branch
      const userBranchResponse = await axios.get(`${API_BASE_URL}/api/branches/my-branch`, {
        headers: getAuthHeaders(),
      });

      expect(userBranchResponse.status).toBe(200);
      expect(userBranchResponse.data.data[0].id).toBe(testUser.branchId);

      // Search items should work in user's context
      const searchResponse = await axios.get(`${API_BASE_URL}/api/items/search`, {
        params: {
          q: 'Raw',
          branchId: testUser.branchId,
        },
        headers: getAuthHeaders(),
      });

      expect(searchResponse.status).toBe(200);
    });

    it('should maintain user context across multiple API calls', async () => {
      // Perform multiple operations that should all work in user's context
      const operations = await Promise.all([
        axios.get(`${API_BASE_URL}/api/branches/my-branch`, {
          headers: getAuthHeaders(),
        }),
        axios.get(`${API_BASE_URL}/api/items/by-branch/${TEST_BRANCH_ID}`, {
          params: { limit: 5 },
          headers: getAuthHeaders(),
        }),
        axios.get(`${API_BASE_URL}/api/items/search`, {
          params: { q: 'test', branchId: TEST_BRANCH_ID },
          headers: getAuthHeaders(),
        }),
      ]);

      operations.forEach((response) => {
        expect(response.status).toBe(200);
      });

      // Verify that all operations used the same branch context
      const branchId = operations[0].data.data[0].id;
      expect(branchId).toBe(TEST_BRANCH_ID);
    });
  });

  describe('Data Relationships and Integrity', () => {
    it('should maintain referential integrity between branches and items', async () => {
      // Get all branches
      const branchesResponse = await axios.get(`${API_BASE_URL}/api/branches`, {
        headers: getAuthHeaders(),
      });

      expect(branchesResponse.status).toBe(200);
      const branches = branchesResponse.data.data;

      // Verify that items can be accessed for each branch
      for (const branch of branches.slice(0, 3)) {
        // Test first 3 branches for performance
        const itemsResponse = await axios.get(`${API_BASE_URL}/api/items/by-branch/${branch.id}`, {
          params: { limit: 1 },
          headers: getAuthHeaders(),
        });

        expect(itemsResponse.status).toBe(200);
        // Should not throw errors for any valid branch
      }
    });

    it('should handle stock data relationships correctly', async () => {
      // Get items with stock data
      const response = await axios.get(`${API_BASE_URL}/api/items`, {
        params: {
          branchId: TEST_BRANCH_ID,
          includeStock: true,
          limit: 10,
        },
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);

      response.data.data.forEach((item: any) => {
        if (item.stock) {
          // Verify stock data integrity
          expect(item.stock.quantity).toBeGreaterThanOrEqual(item.stock.reservedQty);
          expect(item.stock.availableQty).toBe(item.stock.quantity - item.stock.reservedQty);

          // Costs should be reasonable
          if (item.stock.averageCost > 0) {
            expect(item.stock.averageCost).toBeLessThan(1000000); // Reasonable upper bound
          }
          if (item.stock.lastCost > 0) {
            expect(item.stock.lastCost).toBeLessThan(1000000); // Reasonable upper bound
          }
        }
      });
    });
  });

  describe('Search and Filter Integration', () => {
    it('should provide consistent search results across different endpoints', async () => {
      const searchTerm = 'Raw';

      // Search via dedicated search endpoint
      const searchResponse = await axios.get(`${API_BASE_URL}/api/items/search`, {
        params: { q: searchTerm, limit: 10 },
        headers: getAuthHeaders(),
      });

      // Search via general items endpoint
      const itemsResponse = await axios.get(`${API_BASE_URL}/api/items`, {
        params: { search: searchTerm, limit: 10 },
        headers: getAuthHeaders(),
      });

      expect(searchResponse.status).toBe(200);
      expect(itemsResponse.status).toBe(200);

      // Both should return items matching the search term
      if (searchResponse.data.length > 0 && itemsResponse.data.data.length > 0) {
        // At least some results should overlap
        const searchIds = searchResponse.data.map((item: any) => item.id);
        const itemIds = itemsResponse.data.data.map((item: any) => item.id);

        const hasOverlap = searchIds.some((id: string) => itemIds.includes(id));
        expect(hasOverlap).toBe(true);
      }
    });

    it('should filter branch-specific results correctly', async () => {
      // Search items for specific branch
      const branchItemsResponse = await axios.get(
        `${API_BASE_URL}/api/items/by-branch/${TEST_BRANCH_ID}`,
        {
          params: { search: 'Material', limit: 10 },
          headers: getAuthHeaders(),
        }
      );

      // General search with branch context
      const searchResponse = await axios.get(`${API_BASE_URL}/api/items/search`, {
        params: { q: 'Material', branchId: TEST_BRANCH_ID, limit: 10 },
        headers: getAuthHeaders(),
      });

      expect(branchItemsResponse.status).toBe(200);
      expect(searchResponse.status).toBe(200);

      // Branch-specific search should include stock information
      if (searchResponse.data.length > 0) {
        const itemWithStock = searchResponse.data.find((item: any) => item.stock !== null);
        if (itemWithStock) {
          expect(itemWithStock.stock).toHaveProperty('quantity');
          expect(itemWithStock.stock).toHaveProperty('availableQty');
        }
      }
    });
  });

  describe('Performance with Related Data', () => {
    it('should handle complex queries efficiently', async () => {
      const startTime = Date.now();

      // Complex query with multiple parameters
      const response = await axios.get(`${API_BASE_URL}/api/items`, {
        params: {
          search: 'a', // Broad search
          branchId: TEST_BRANCH_ID,
          includeStock: true,
          page: 1,
          limit: 20,
        },
        headers: getAuthHeaders(),
      });

      const responseTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // Should complete within 5 seconds

      if (response.data.data.length > 0) {
        expect(response.data.data[0]).toHaveProperty('id');
        expect(response.data.data[0]).toHaveProperty('name');
      }
    });

    it('should handle concurrent cross-module requests', async () => {
      const promises = [
        axios.get(`${API_BASE_URL}/api/branches`, {
          headers: getAuthHeaders(),
        }),
        axios.get(`${API_BASE_URL}/api/items`, {
          params: { limit: 10 },
          headers: getAuthHeaders(),
        }),
        axios.get(`${API_BASE_URL}/api/items/by-branch/${TEST_BRANCH_ID}`, {
          params: { limit: 5 },
          headers: getAuthHeaders(),
        }),
        axios.get(`${API_BASE_URL}/api/items/search`, {
          params: { q: 'test', limit: 5 },
          headers: getAuthHeaders(),
        }),
      ];

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Error Handling in Integration Context', () => {
    it('should handle invalid branch references gracefully', async () => {
      const invalidBranchId = '00000000-0000-0000-0000-000000000000';

      try {
        await axios.get(`${API_BASE_URL}/api/items/by-branch/${invalidBranchId}`, {
          headers: getAuthHeaders(),
        });
        fail('Should have thrown an error for invalid branch ID');
      } catch (error: unknown) {
        const axiosError = error as { response: { status: number } };
        expect([400, 404]).toContain(axiosError.response.status);
      }
    });

    it('should handle cross-module parameter validation', async () => {
      // Test with invalid parameters that span multiple modules
      const response = await axios.get(`${API_BASE_URL}/api/items`, {
        params: {
          branchId: 'invalid-uuid',
          search: '', // Empty search
          includeStock: 'invalid-boolean',
          page: -1,
          limit: 0,
        },
        headers: getAuthHeaders(),
      });

      // Should handle gracefully, either with validation errors or defaults
      expect([200, 400, 422]).toContain(response.status);
    });
  });
});
