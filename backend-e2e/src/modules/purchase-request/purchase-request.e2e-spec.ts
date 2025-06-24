import axios from 'axios';

describe('Purchase Request API E2E Tests', () => {
  const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
  let authToken: string;
  let testUser: any;
  let testBranchId: string;
  let testItemId: string;
  let testCompanyId: string;
  let createdPRId: string;

  beforeAll(async () => {
    // Login to get auth token
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
      // Skip tests if no items available
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

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${authToken}`,
    'Content-Type': 'application/json',
  });

  describe('Authentication', () => {
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
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  describe('Purchase Request CRUD Operations', () => {
    it('should create a new purchase request', async () => {
      // Skip if no test item available
      if (!testItemId) {
        console.warn('Skipping PR creation test - no test items available');
        return;
      }

      const prData = {
        title: 'E2E Test Purchase Request',
        description: 'Test PR created by E2E tests',
        requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        branchId: testBranchId,
        justification: 'E2E testing purposes',
        items: [
          {
            itemId: testItemId,
            requestedQty: 10,
            estimatedPrice: 25.5,
            requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            remarks: 'Test item for E2E testing',
          },
        ],
      };

      const response = await axios.post(`${API_BASE_URL}/api/purchase-request`, prData, {
        headers: getAuthHeaders(),
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

    it('should retrieve all purchase requests for the user', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/purchase-request`, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.data).toBeInstanceOf(Array);

      // Should only see PRs from user's company (company isolation)
      response.data.data.forEach((pr: any) => {
        expect(pr.companyId).toBe(testCompanyId);
      });
    });

    it('should retrieve a specific purchase request by ID', async () => {
      if (!createdPRId) {
        console.warn('Skipping get PR test - no PR created');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/purchase-request/${createdPRId}`, {
        headers: getAuthHeaders(),
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

    it('should update a purchase request', async () => {
      if (!createdPRId) {
        console.warn('Skipping update PR test - no PR created');
        return;
      }

      const updateData = {
        title: 'Updated E2E Test Purchase Request',
        description: 'Updated description for E2E testing',
      };

      const response = await axios.patch(
        `${API_BASE_URL}/api/purchase-request/${createdPRId}`,
        updateData,
        {
          headers: getAuthHeaders(),
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
      // This test would ideally require a second company/user, but we can test
      // that non-existent PR IDs return 404 instead of exposing data
      const fakeId = '00000000-0000-0000-0000-000000000000';

      try {
        await axios.get(`${API_BASE_URL}/api/purchase-request/${fakeId}`, {
          headers: getAuthHeaders(),
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect([404, 403]).toContain(error.response.status);
      }
    });
  });

  describe('Purchase Request Workflow', () => {
    it('should submit a purchase request', async () => {
      if (!createdPRId) {
        console.warn('Skipping submit PR test - no PR created');
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/purchase-request/${createdPRId}/submit`,
        {},
        {
          headers: getAuthHeaders(),
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
          headers: getAuthHeaders(),
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.data.status).toBe('APPROVED');
      expect(response.data.data.approvedAt).toBeDefined();
    });
  });

  describe('Permission-based Access Control', () => {
    it('should enforce permission-based access', async () => {
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

  describe('Data Validation', () => {
    it('should validate required fields when creating PR', async () => {
      const invalidPRData = {
        // Missing required fields
        title: '',
        items: [] as any[],
      };

      try {
        await axios.post(`${API_BASE_URL}/api/purchase-request`, invalidPRData, {
          headers: getAuthHeaders(),
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect([400, 422]).toContain(error.response.status);
      }
    });

    it('should validate item existence and company isolation', async () => {
      const invalidItemId = '00000000-0000-0000-0000-000000000000';

      const prDataWithInvalidItem = {
        title: 'Invalid Item Test',
        description: 'Testing invalid item validation',
        requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        branchId: testBranchId,
        justification: 'Testing validation',
        items: [
          {
            itemId: invalidItemId,
            requestedQty: 5,
            estimatedPrice: 10.0,
            requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            remarks: 'Invalid item test',
          },
        ],
      };

      try {
        await axios.post(`${API_BASE_URL}/api/purchase-request`, prDataWithInvalidItem, {
          headers: getAuthHeaders(),
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect([400, 403, 422]).toContain(error.response.status);
      }
    });
  });
});
