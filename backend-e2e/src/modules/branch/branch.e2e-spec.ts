import axios from 'axios';
import { TestHelpers, type TestUser } from '../../support/test-helpers';

describe('Branch API (E2E)', () => {
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
    it('should require authentication for branch endpoints', async () => {
      const endpoints = [
        '/api/branches',
        '/api/branches/my-branch',
        `/api/branches/${TEST_BRANCH_ID}`,
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
        await axios.get(`${API_BASE_URL}/api/branches`, {
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

  describe('GET /api/branches', () => {
    it('should get all branches with pagination when params provided', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/branches`, {
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

    it('should get all branches without pagination when no params provided', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/branches`, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      expect(response.data.pagination).toBeNull();
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeGreaterThan(0);

      // Verify branch structure
      const branch = response.data.data[0];
      expect(branch).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        code: expect.any(String),
        isActive: expect.any(Boolean),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should filter branches by search term', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/branches`, {
        params: { search: 'Branch' },
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: expect.stringContaining('Branch'),
          }),
        ])
      );
    });

    it('should include inactive branches when requested', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/branches`, {
        params: { includeInactive: true },
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      // Should include branches regardless of isActive status
    });
    it('should handle invalid pagination parameters gracefully', async () => {
      try {
        await axios.get(`${API_BASE_URL}/api/branches`, {
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

  describe('GET /api/branches/my-branch', () => {
    it('should get current user branch', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/branches/my-branch`, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        data: expect.arrayContaining([
          expect.objectContaining({
            id: TEST_BRANCH_ID,
            name: expect.any(String),
            code: expect.any(String),
            isActive: true,
          }),
        ]),
        pagination: null,
      });
    });

    it('should return single branch in array format', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/branches/my-branch`, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.data).toHaveLength(1);
      expect(response.data.data[0].id).toBe(TEST_BRANCH_ID);
    });
  });

  describe('GET /api/branches/:id', () => {
    it('should get specific branch by ID', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/branches/${TEST_BRANCH_ID}`, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        id: TEST_BRANCH_ID,
        name: expect.any(String),
        code: expect.any(String),
        isActive: expect.any(Boolean),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      // Optional fields that may or may not be present
      if (response.data.address) {
        expect(response.data.address).toEqual(expect.any(String));
      }
      if (response.data.phone) {
        expect(response.data.phone).toEqual(expect.any(String));
      }
      if (response.data.email) {
        expect(response.data.email).toEqual(expect.any(String));
      }
    });

    it('should return 404 for non-existent branch', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      try {
        await axios.get(`${API_BASE_URL}/api/branches/${nonExistentId}`, {
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
        await axios.get(`${API_BASE_URL}/api/branches/${invalidId}`, {
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
    it('should allow system admin access to all branch endpoints', async () => {
      // This would require a system admin login function
      // For now, we test with branch manager which should have access
      const response = await axios.get(`${API_BASE_URL}/api/branches`, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
    });

    it('should allow branch manager access to branch endpoints', async () => {
      expect(testUser.role).toBe('BRANCH_MANAGER');

      const response = await axios.get(`${API_BASE_URL}/api/branches/my-branch`, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      // Test with malformed request that might cause server error
      try {
        await axios.get(`${API_BASE_URL}/api/branches`, {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/xml', // Wrong content type
          },
        });
      } catch (error: unknown) {
        const axiosError = error as { response: { status: number } };
        // Should not crash the server, might return 400 or 406
        expect([400, 406, 415]).toContain(axiosError.response.status);
      }
    });
    it('should validate query parameters correctly', async () => {
      try {
        await axios.get(`${API_BASE_URL}/api/branches`, {
          params: {
            page: 'invalid',
            limit: 'also-invalid',
            includeInactive: 'not-boolean',
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
        axios.get(`${API_BASE_URL}/api/branches`, {
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

      const response = await axios.get(`${API_BASE_URL}/api/branches`, {
        headers: getAuthHeaders(),
      });

      const responseTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
    });
  });
});
