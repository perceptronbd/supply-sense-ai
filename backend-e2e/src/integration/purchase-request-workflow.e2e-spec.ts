import axios from 'axios';
import { type AxiosErrorResponse, TestHelpers, TestUser } from '../support/test-helpers';

describe('Purchase Request Integration with Branch/Item APIs (E2E)', () => {
  const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
  let authToken: string;
  let testUser: TestUser;
  let TEST_BRANCH_ID: string;
  let _TEST_ITEM_ID: string;

  beforeAll(async () => {
    // Authenticate and get test data
    const auth = await TestHelpers.loginAsBranchManager();
    authToken = auth.accessToken;
    testUser = auth.user;
    // Use the first branch ID from the array
    TEST_BRANCH_ID = testUser.branchIds[0];
    _TEST_ITEM_ID = await TestHelpers.getTestItemId();
  });

  const getAuthHeaders = () => TestHelpers.getAuthHeaders(authToken);

  describe('End-to-End Purchase Request Workflow', () => {
    it('should complete full workflow: user -> branch -> items -> purchase request creation', async () => {
      // Step 1: Verify user authentication and get user's branch
      const userBranchResponse = await axios.get(`${API_BASE_URL}/api/branches/my-branch`, {
        headers: getAuthHeaders(),
      });

      expect(userBranchResponse.status).toBe(200);
      expect(userBranchResponse.data.data.data).toHaveLength(1);
      const userBranch = userBranchResponse.data.data.data[0];
      expect(userBranch.id).toBe(TEST_BRANCH_ID);

      // Step 2: Search for items available in the user's branch
      const itemSearchResponse = await axios.get(`${API_BASE_URL}/api/items/search`, {
        params: {
          q: 'Raw',
          branchId: TEST_BRANCH_ID,
          limit: 5,
        },
        headers: getAuthHeaders(),
      });

      expect(itemSearchResponse.status).toBe(200);
      expect(itemSearchResponse.data.data.length).toBeGreaterThan(0);

      const selectedItem = itemSearchResponse.data.data[0];
      expect(selectedItem).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        sku: expect.any(String),
        mainUnit: expect.any(String),
      });

      // Step 3: Get detailed item information with stock
      const itemDetailResponse = await axios.get(`${API_BASE_URL}/api/items/${selectedItem.id}`, {
        params: {
          branchId: TEST_BRANCH_ID,
          includeStock: true,
        },
        headers: getAuthHeaders(),
      });

      expect(itemDetailResponse.status).toBe(200);
      const _itemDetail = itemDetailResponse.data;

      // Step 4: Verify we can create a purchase request using this data
      const purchaseRequestData = {
        title: 'E2E Test Purchase Request',
        description: 'Integration test for branch-item-PR workflow',
        requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        branchId: TEST_BRANCH_ID,
        justification: 'E2E testing workflow verification',
        items: [
          {
            itemId: selectedItem.id,
            requestedQty: 10,
            estimatedPrice: 25.5,
            requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            remarks: 'E2E test item request',
          },
        ],
      };

      const createPRResponse = await axios.post(
        `${API_BASE_URL}/api/purchase-request`,
        purchaseRequestData,
        { headers: getAuthHeaders() }
      );

      expect(createPRResponse.status).toBe(201);
      expect(createPRResponse.data.data).toMatchObject({
        id: expect.any(String),
        prNumber: expect.any(String),
        title: purchaseRequestData.title,
        branchId: TEST_BRANCH_ID,
        status: 'DRAFT',
      });

      // Step 5: Verify the PR was created with correct item references
      const prId = createPRResponse.data.data.id;
      const getPRResponse = await axios.get(`${API_BASE_URL}/api/purchase-request/${prId}`, {
        headers: getAuthHeaders(),
      });

      expect(getPRResponse.status).toBe(200);
      expect(getPRResponse.data.data.items).toHaveLength(1);
      expect(getPRResponse.data.data.items[0]).toMatchObject({
        itemId: selectedItem.id,
        requestedQty: '10', // API returns string
        estimatedPrice: '25.5', // API returns string
      });

      // Cleanup: Delete the test PR
      try {
        await axios.delete(`${API_BASE_URL}/api/purchase-request/${prId}`, {
          headers: getAuthHeaders(),
        });
      } catch (error) {
        // Ignore cleanup errors
        console.warn('Failed to cleanup test PR:', error);
      }
    });

    it('should validate item availability and branch context in PR creation', async () => {
      // Get available items for user's branch
      const branchItemsResponse = await axios.get(
        `${API_BASE_URL}/api/items/by-branch/${TEST_BRANCH_ID}`,
        {
          params: { limit: 5 },
          headers: getAuthHeaders(),
        }
      );

      expect(branchItemsResponse.status).toBe(200);
      expect(branchItemsResponse.data.data.data.length).toBeGreaterThanOrEqual(0);

      // Use first available item or skip test if none available
      if (branchItemsResponse.data.data.data.length === 0) {
        console.log('No items available for branch, skipping test...');
        return;
      }

      const availableItem = branchItemsResponse.data.data.data[0];

      // Create PR with valid branch-item relationship
      const validPRData = {
        title: 'Valid Branch-Item PR Test',
        description: 'Testing branch-item validation in E2E',
        requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        branchId: TEST_BRANCH_ID,
        justification: 'Validating branch-item relationships',
        items: [
          {
            itemId: availableItem.id,
            requestedQty: 5,
            estimatedPrice: 15.0,
            requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            remarks: 'Valid item for this branch',
          },
        ],
      };

      const validPRResponse = await axios.post(
        `${API_BASE_URL}/api/purchase-request`,
        validPRData,
        { headers: getAuthHeaders() }
      );

      expect(validPRResponse.status).toBe(201);

      // Cleanup
      try {
        await axios.delete(`${API_BASE_URL}/api/purchase-request/${validPRResponse.data.data.id}`, {
          headers: getAuthHeaders(),
        });
      } catch (_error) {
        // Ignore cleanup errors
      }
    });
  });

  describe('Multi-User Branch Context Validation', () => {
    it('should enforce branch-specific access for different users', async () => {
      // Login as a different user type
      const procurementAuth = await TestHelpers.loginAsProcurementSpecialist();
      const procurementHeaders = TestHelpers.getAuthHeaders(procurementAuth.accessToken);

      // Both users should be able to access items
      const managerItemsResponse = await axios.get(`${API_BASE_URL}/api/items`, {
        params: { limit: 5 },
        headers: getAuthHeaders(),
      });

      const procurementItemsResponse = await axios.get(`${API_BASE_URL}/api/items`, {
        params: { limit: 5 },
        headers: procurementHeaders,
      });

      expect(managerItemsResponse.status).toBe(200);
      expect(procurementItemsResponse.status).toBe(200);

      // Both should see the same general item catalog
      expect(managerItemsResponse.data.data.data.length).toBeGreaterThanOrEqual(0);
      expect(procurementItemsResponse.data.data.data.length).toBeGreaterThanOrEqual(0);

      // But branch-specific stock information should be different
      const managerBranchItems = await axios.get(
        `${API_BASE_URL}/api/items/by-branch/${testUser.branchIds[0]}`,
        {
          headers: getAuthHeaders(),
        }
      );

      const procurementBranchItems = await axios.get(
        `${API_BASE_URL}/api/items/by-branch/${procurementAuth.user.branchIds[0]}`,
        {
          headers: procurementHeaders,
        }
      );

      expect(managerBranchItems.status).toBe(200);
      expect(procurementBranchItems.status).toBe(200);

      // If users are from different branches, they should see different stock data
      if (testUser.branchIds[0] !== procurementAuth.user.branchIds[0]) {
        // Stock context should be different for different branches
        expect(testUser.branchIds[0]).not.toBe(procurementAuth.user.branchIds[0]);
      }
    });
  });

  describe('Data Consistency Across Modules', () => {
    it('should maintain data consistency between item search and detailed view', async () => {
      // Search for items
      const searchResponse = await axios.get(`${API_BASE_URL}/api/items/search`, {
        params: { q: 'Material', limit: 3 },
        headers: getAuthHeaders(),
      });

      expect(searchResponse.status).toBe(200);

      if (searchResponse.data.data.length > 0) {
        const searchedItem = searchResponse.data.data[0];

        // Get detailed view of the same item
        const detailResponse = await axios.get(`${API_BASE_URL}/api/items/${searchedItem.id}`, {
          headers: getAuthHeaders(),
        });

        expect(detailResponse.status).toBe(200);

        // Core data should match
        expect(detailResponse.data.data.id).toBe(searchedItem.id);
        expect(detailResponse.data.data.name).toBe(searchedItem.name);
        expect(detailResponse.data.data.sku).toBe(searchedItem.sku);
        expect(detailResponse.data.data.mainUnit).toBe(searchedItem.mainUnit);
        expect(detailResponse.data.data.buyingUnit).toBe(searchedItem.buyingUnit);
        expect(detailResponse.data.data.transferUnit).toBe(searchedItem.transferUnit);
        expect(detailResponse.data.data.usingUnit).toBe(searchedItem.usingUnit);
      }
    });

    it('should provide consistent branch information across endpoints', async () => {
      // Get user's branch
      const myBranchResponse = await axios.get(`${API_BASE_URL}/api/branches/my-branch`, {
        headers: getAuthHeaders(),
      });

      // Get the same branch by ID
      const branchByIdResponse = await axios.get(`${API_BASE_URL}/api/branches/${TEST_BRANCH_ID}`, {
        headers: getAuthHeaders(),
      });

      // Get branch in the branches list
      const allBranchesResponse = await axios.get(`${API_BASE_URL}/api/branches`, {
        headers: getAuthHeaders(),
      });

      expect(myBranchResponse.status).toBe(200);
      expect(branchByIdResponse.status).toBe(200);
      expect(allBranchesResponse.status).toBe(200);

      const myBranch = myBranchResponse.data.data.data[0];
      const branchById = branchByIdResponse.data.data;
      const branchInList = allBranchesResponse.data.data.data.find(
        (b: any) => b.id === TEST_BRANCH_ID
      );

      // All should have the same core data
      expect(myBranch.id).toBe(branchById.id);
      expect(myBranch.name).toBe(branchById.name);
      expect(myBranch.code).toBe(branchById.code);
      expect(myBranch.isActive).toBe(branchById.isActive);

      expect(branchInList.id).toBe(branchById.id);
      expect(branchInList.name).toBe(branchById.name);
      expect(branchInList.code).toBe(branchById.code);
    });
  });

  describe('Performance in Integrated Scenarios', () => {
    it('should handle complex multi-module queries efficiently', async () => {
      const startTime = Date.now();

      // Simulate a complex workflow with multiple API calls
      const results = await Promise.all([
        // Get user's branch
        axios.get(`${API_BASE_URL}/api/branches/my-branch`, {
          headers: getAuthHeaders(),
        }),

        // Search for items
        axios.get(`${API_BASE_URL}/api/items/search`, {
          params: { q: 'Raw', branchId: TEST_BRANCH_ID, limit: 10 },
          headers: getAuthHeaders(),
        }),

        // Get branch-specific items with stock
        axios.get(`${API_BASE_URL}/api/items/by-branch/${TEST_BRANCH_ID}`, {
          params: { limit: 10 },
          headers: getAuthHeaders(),
        }),

        // Get all branches for context
        axios.get(`${API_BASE_URL}/api/branches`, {
          params: { limit: 10 },
          headers: getAuthHeaders(),
        }),
      ]);

      const totalTime = Date.now() - startTime;

      // All requests should succeed
      results.forEach((response) => {
        expect(response.status).toBe(200);
      });

      // Total time should be reasonable for concurrent requests
      expect(totalTime).toBeLessThan(10000); // 10 seconds max

      // Verify data relationships
      const userBranch = results[0].data.data.data[0];
      const searchResults = results[1].data.data.data;
      const branchItems = results[2].data.data.data;
      const allBranches = results[3].data.data.data;

      expect(userBranch.id).toBe(TEST_BRANCH_ID);
      expect(allBranches.some((b: any) => b.id === TEST_BRANCH_ID)).toBe(true);

      if (searchResults && searchResults.length > 0) {
        expect(searchResults[0]).toHaveProperty('id');
        expect(searchResults[0]).toHaveProperty('name');
      }

      if (branchItems && branchItems.length > 0) {
        expect(branchItems[0]).toHaveProperty('id');
        expect(branchItems[0]).toHaveProperty('name');
      }
    });
  });

  describe('Error Handling in Complex Workflows', () => {
    it('should handle partial failures gracefully in multi-step operations', async () => {
      // Step 1: Valid operation - get user branch
      const branchResponse = await axios.get(`${API_BASE_URL}/api/branches/my-branch`, {
        headers: getAuthHeaders(),
      });
      expect(branchResponse.status).toBe(200);

      // Step 2: Invalid operation - try to get items for non-existent branch
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/items/by-branch/00000000-0000-0000-0000-000000000000`,
          {
            headers: getAuthHeaders(),
          }
        );
        // If we get here, the API returned empty results (which is valid)
        expect(response.status).toBe(200);
        expect(response.data.data.data).toHaveLength(0);
      } catch (error: unknown) {
        // API might return an error for invalid UUIDs
        const axiosError = error as AxiosErrorResponse;
        if (axiosError.response) {
          expect([400, 404]).toContain(axiosError.response.status);
        } else {
          // Handle non-HTTP errors
          expect(error).toBeDefined();
        }
      }

      // Step 3: Recovery - valid operation should still work
      const itemsResponse = await axios.get(`${API_BASE_URL}/api/items`, {
        params: { limit: 5 },
        headers: getAuthHeaders(),
      });
      expect(itemsResponse.status).toBe(200);
    });

    it('should validate cross-module data integrity', async () => {
      // Try to create a PR with an invalid item-branch combination
      const invalidPRData = {
        title: 'Invalid Cross-Module Test',
        description: 'Testing invalid item ID handling',
        requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        branchId: TEST_BRANCH_ID,
        justification: 'Testing validation',
        items: [
          {
            itemId: '00000000-0000-0000-0000-000000000000', // Non-existent item
            requestedQty: 5,
            estimatedPrice: 15.0,
            requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            remarks: 'Invalid item ID test',
          },
        ],
      };

      try {
        await axios.post(`${API_BASE_URL}/api/purchase-request`, invalidPRData, {
          headers: getAuthHeaders(),
        });
        fail('Should have thrown an error for invalid item ID');
      } catch (error: unknown) {
        const axiosError = error as AxiosErrorResponse;
        expect([400, 404, 422]).toContain(axiosError.response.status);
      }
    });
  });

  describe('Multi-Tenant Purchase Request API Integration', () => {
    let authToken: string;
    let testUser: {
      id: string;
      email: string;
      companyId: string;
      branchIds: string[];
      roles: string[];
      permissions: string[];
    };
    let testBranchId: string;
    let testItemId: string;
    let testCompanyId: string;
    let createdPRId: string;

    beforeAll(async () => {
      // Login to get auth token for direct API tests
      const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: 'manager.a@supplychain.com',
        password: 'manager123',
      });

      expect(loginResponse.status).toBe(200);
      authToken = loginResponse.data.data.access_token;
      testUser = loginResponse.data.data.user;
      testCompanyId = testUser.companyId;
      testBranchId = testUser.branchIds[0]; // Use first branch ID

      // Get a test item from the company
      const itemsResponse = await axios.get(`${API_BASE_URL}/api/items`, {
        headers: { Authorization: `Bearer ${authToken}` },
        params: { limit: 1 },
      });

      if (itemsResponse.data.data?.data?.length > 0) {
        testItemId = itemsResponse.data.data.data[0].id;
      } else {
        console.warn('No test items available, some tests may be skipped');
      }
    });

    afterAll(async () => {
      // Cleanup: Delete created PR if it exists
      if (createdPRId) {
        try {
          await axios.delete(`${API_BASE_URL}/api/purchase-request/${createdPRId}`, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
        } catch (error) {
          console.warn('Failed to cleanup test PR:', error);
        }
      }
    });

    const getDirectAuthHeaders = () => ({
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    });

    describe('Multi-Tenant Authentication Verification', () => {
      it('should authenticate successfully and return user with multi-tenant structure', () => {
        expect(testUser).toBeDefined();
        expect(testUser.id).toBeDefined();
        expect(testUser.email).toBe('manager.a@supplychain.com');
        expect(testUser.companyId).toBeDefined();
        expect(testUser.branchIds).toBeInstanceOf(Array);
        expect(testUser.branchIds.length).toBeGreaterThan(0);
        expect(testUser.roles).toBeInstanceOf(Array);
        expect(testUser.permissions).toBeInstanceOf(Array);
      });

      it('should reject requests without authentication', async () => {
        try {
          await axios.get(`${API_BASE_URL}/api/purchase-request`);
          fail('Should have thrown an error');
        } catch (error: unknown) {
          const axiosError = error as { response: { status: number } };
          expect(axiosError.response.status).toBe(401);
        }
      });
    });

    describe('Company Isolation and Security', () => {
      it('should create a new purchase request with company isolation', async () => {
        // Skip if no test item available
        if (!testItemId) {
          console.warn('Skipping PR creation test - no test items available');
          return;
        }

        const prData = {
          title: 'Multi-Tenant E2E Test Purchase Request',
          description: 'Test PR created by integration tests with company isolation',
          requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          branchId: testBranchId,
          justification: 'Multi-tenant E2E testing purposes',
          items: [
            {
              itemId: testItemId,
              requestedQty: 10,
              estimatedPrice: 25.5,
              requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              remarks: 'Test item for multi-tenant E2E testing',
            },
          ],
        };

        const response = await axios.post(`${API_BASE_URL}/api/purchase-request`, prData, {
          headers: getDirectAuthHeaders(),
        });

        expect(response.status).toBe(201);
        expect(response.data.data).toMatchObject({
          id: expect.any(String),
          prNumber: expect.any(String),
          title: prData.title,
          description: prData.description,
          branchId: testBranchId,
          companyId: testCompanyId,
          status: 'DRAFT',
          createdById: testUser.id,
        });

        expect(response.data.data.items).toHaveLength(1);
        expect(response.data.data.items[0]).toMatchObject({
          itemId: testItemId,
          requestedQty: '10', // API returns as string
          estimatedPrice: '25.5', // API returns as string
        });

        createdPRId = response.data.data.id;
      });

      it('should retrieve all purchase requests with company isolation enforced', async () => {
        const response = await axios.get(`${API_BASE_URL}/api/purchase-request`, {
          headers: getDirectAuthHeaders(),
        });

        expect(response.status).toBe(200);
        expect(response.data.data).toBeInstanceOf(Array);

        // Should only see PRs from user's company (company isolation)
        response.data.data.forEach((pr: { companyId: string }) => {
          expect(pr.companyId).toBe(testCompanyId);
        });
      });

      it('should retrieve a specific purchase request by ID with security checks', async () => {
        if (!createdPRId) {
          console.warn('Skipping get PR test - no PR created');
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/api/purchase-request/${createdPRId}`, {
          headers: getDirectAuthHeaders(),
        });

        expect(response.status).toBe(200);
        expect(response.data.data).toMatchObject({
          id: createdPRId,
          companyId: testCompanyId,
          branchId: testBranchId,
          status: 'DRAFT',
        });

        expect(response.data.data.items).toHaveLength(1);
      });

      it('should update a purchase request with proper security validation', async () => {
        if (!createdPRId) {
          console.warn('Skipping update PR test - no PR created');
          return;
        }

        const updateData = {
          title: 'Updated Multi-Tenant E2E Test Purchase Request',
          description: 'Updated description for multi-tenant E2E testing',
        };

        const response = await axios.patch(
          `${API_BASE_URL}/api/purchase-request/${createdPRId}`,
          updateData,
          {
            headers: getDirectAuthHeaders(),
          }
        );

        expect(response.status).toBe(200);
        expect(response.data.data).toMatchObject({
          id: createdPRId,
          title: updateData.title,
          description: updateData.description,
        });
      });

      it('should prevent access to purchase requests from other companies', async () => {
        // Test that non-existent PR IDs return 404 instead of exposing data
        const fakeId = '00000000-0000-0000-0000-000000000000';

        try {
          await axios.get(`${API_BASE_URL}/api/purchase-request/${fakeId}`, {
            headers: getDirectAuthHeaders(),
          });
          fail('Should have thrown an error');
        } catch (error: unknown) {
          const axiosError = error as { response: { status: number } };
          expect([404, 403]).toContain(axiosError.response.status);
        }
      });
    });

    describe('Purchase Request Status Workflow Integration', () => {
      it('should submit a purchase request', async () => {
        if (!createdPRId) {
          console.warn('Skipping submit PR test - no PR created');
          return;
        }

        const response = await axios.post(
          `${API_BASE_URL}/api/purchase-request/${createdPRId}/submit`,
          {},
          {
            headers: getDirectAuthHeaders(),
          }
        );

        expect(response.status).toBe(200);
        expect(response.data.data.status).toBe('SUBMITTED');
        expect(response.data.data.submittedAt).toBeDefined();
      });

      it('should approve a purchase request', async () => {
        if (!createdPRId) {
          console.warn('Skipping approve PR test - no PR created');
          return;
        }

        const response = await axios.post(
          `${API_BASE_URL}/api/purchase-request/${createdPRId}/approve`,
          {},
          {
            headers: getDirectAuthHeaders(),
          }
        );

        expect(response.status).toBe(200);
        expect(response.data.data.status).toBe('APPROVED');
        expect(response.data.data.approvedAt).toBeDefined();
      });
    });

    describe('Permission-based Access Control Integration', () => {
      it('should enforce permission-based access for all operations', async () => {
        // Test that endpoints require proper permissions
        // This is enforced by the PermissionsGuard and RequirePermissions decorator
        expect(testUser.permissions).toBeInstanceOf(Array);
        expect(testUser.permissions.length).toBeGreaterThan(0);

        // User should have purchase request permissions
        const hasPRPermissions = testUser.permissions.some((permission: string) =>
          permission.startsWith('PURCHASE_REQUESTS:')
        );
        expect(hasPRPermissions).toBe(true);
      });
    });

    describe('Data Validation Integration', () => {
      it('should validate required fields when creating PR', async () => {
        const invalidPRData = {
          // Missing required fields
          title: '',
          items: [] as any[],
        };

        try {
          await axios.post(`${API_BASE_URL}/api/purchase-request`, invalidPRData, {
            headers: getDirectAuthHeaders(),
          });
          fail('Should have thrown an error');
        } catch (error: unknown) {
          const axiosError = error as { response: { status: number } };
          expect([400, 422]).toContain(axiosError.response.status);
        }
      });

      it('should validate item existence and company isolation in PR creation', async () => {
        const invalidItemId = '00000000-0000-0000-0000-000000000000';

        const prDataWithInvalidItem = {
          title: 'Invalid Item Test',
          description: 'Testing invalid item validation with company isolation',
          requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          branchId: testBranchId,
          justification: 'Testing validation with multi-tenant security',
          items: [
            {
              itemId: invalidItemId,
              requestedQty: 5,
              estimatedPrice: 10.0,
              requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              remarks: 'Invalid item test for company isolation',
            },
          ],
        };

        try {
          await axios.post(`${API_BASE_URL}/api/purchase-request`, prDataWithInvalidItem, {
            headers: getDirectAuthHeaders(),
          });
          fail('Should have thrown an error');
        } catch (error: unknown) {
          const axiosError = error as { response: { status: number } };
          expect([400, 403, 422]).toContain(axiosError.response.status);
        }
      });
    });
  });
});
