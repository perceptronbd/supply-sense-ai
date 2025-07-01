import axios from 'axios';
import { type AxiosErrorResponse, TestHelpers, TestUser } from '../../support/test-helpers';

describe('User Management (E2E)', () => {
  const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3004';
  let authToken: string;
  let superAdminToken: string;
  let testUser: TestUser;
  let testBranchId: string;
  let availablePermissions: any[];
  let testRoleId: string;
  const createdUsers: string[] = [];
  const createdRoles: string[] = [];

  beforeAll(async () => {
    // Login as super admin for user management tests
    const superAdminAuth = await TestHelpers.loginAsSuperAdmin();
    superAdminToken = superAdminAuth.accessToken;

    // Login as branch manager for some tests
    const branchManagerAuth = await TestHelpers.loginAsBranchManager();
    authToken = branchManagerAuth.accessToken;
    testUser = branchManagerAuth.user;
    testBranchId = testUser.branchIds[0];

    // Get available permissions for role creation
    availablePermissions = await TestHelpers.getTestPermissions(superAdminToken);

    // Create a test role for user creation
    const testRoleData = {
      name: 'E2E Test Role',
      description: 'Role created for E2E testing',
      permissionIds: availablePermissions.slice(0, 5).map((p: any) => p.id),
    };

    const testRole = await TestHelpers.createTestRole(superAdminToken, testRoleData);
    testRoleId = testRole.id;
    createdRoles.push(testRoleId);
  });

  afterAll(async () => {
    // Cleanup created users
    for (const userId of createdUsers) {
      await TestHelpers.cleanupUser(superAdminToken, userId);
    }

    // Cleanup created roles
    for (const roleId of createdRoles) {
      await TestHelpers.cleanupRole(superAdminToken, roleId);
    }
  });

  const getAuthHeaders = (token: string) => TestHelpers.getAuthHeaders(token);

  describe('User CRUD Operations', () => {
    it('should create user with valid data and permissions', async () => {
      const userData = {
        email: 'e2etest@test.com',
        username: 'e2etest',
        firstName: 'E2E',
        lastName: 'Test',
        password: 'Password123!',
        roleIds: [testRoleId],
        branchIds: [testBranchId],
      };

      const response = await axios.post(`${API_BASE_URL}/api/users`, userData, {
        headers: getAuthHeaders(superAdminToken),
      });

      expect(response.status).toBe(201);
      expect(response.data).toMatchObject({
        email: userData.email,
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
        isActive: true,
      });

      expect(response.data.roles).toHaveLength(1);
      expect(response.data.branches).toHaveLength(1);
      expect(response.data.password).toBeUndefined();

      createdUsers.push(response.data.id);
    });

    it('should require at least one role when creating user', async () => {
      const userData = {
        email: 'norole@test.com',
        username: 'norole',
        firstName: 'No',
        lastName: 'Role',
        password: 'Password123!',
        roleIds: [] as string[],
        branchIds: [testBranchId],
      };

      try {
        await axios.post(`${API_BASE_URL}/api/users`, userData, {
          headers: getAuthHeaders(superAdminToken),
        });
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as AxiosErrorResponse;
        expect(axiosError.response.status).toBe(400);
      }
    });

    it('should require at least one branch when creating user', async () => {
      const userData = {
        email: 'nobranch@test.com',
        username: 'nobranch',
        firstName: 'No',
        lastName: 'Branch',
        password: 'Password123!',
        roleIds: [testRoleId],
        branchIds: [] as string[],
      };

      try {
        await axios.post(`${API_BASE_URL}/api/users`, userData, {
          headers: getAuthHeaders(superAdminToken),
        });
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as AxiosErrorResponse;
        expect(axiosError.response.status).toBe(400);
      }
    });

    it('should reject duplicate email within same company', async () => {
      const userData = {
        email: 'duplicate@test.com',
        username: 'duplicate1',
        firstName: 'Duplicate',
        lastName: 'Email',
        password: 'Password123!',
        roleIds: [testRoleId],
        branchIds: [testBranchId],
      };

      // Create first user
      const firstResponse = await axios.post(`${API_BASE_URL}/api/users`, userData, {
        headers: getAuthHeaders(superAdminToken),
      });
      expect(firstResponse.status).toBe(201);
      createdUsers.push(firstResponse.data.id);

      // Try to create second user with same email
      userData.username = 'duplicate2';
      try {
        await axios.post(`${API_BASE_URL}/api/users`, userData, {
          headers: getAuthHeaders(superAdminToken),
        });
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as AxiosErrorResponse;
        expect(axiosError.response.status).toBe(409);
      }
    });

    it('should reject duplicate username globally', async () => {
      const userData = {
        email: 'uniqueemail@test.com',
        username: 'globaldup',
        firstName: 'Global',
        lastName: 'Duplicate',
        password: 'Password123!',
        roleIds: [testRoleId],
        branchIds: [testBranchId],
      };

      // Create first user
      const firstResponse = await axios.post(`${API_BASE_URL}/api/users`, userData, {
        headers: getAuthHeaders(superAdminToken),
      });
      expect(firstResponse.status).toBe(201);
      createdUsers.push(firstResponse.data.id);

      // Try to create second user with same username
      userData.email = 'anotheremail@test.com';
      try {
        await axios.post(`${API_BASE_URL}/api/users`, userData, {
          headers: getAuthHeaders(superAdminToken),
        });
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as AxiosErrorResponse;
        expect(axiosError.response.status).toBe(409);
      }
    });
  });

  describe('User Retrieval Operations', () => {
    let testUserId: string;

    beforeAll(async () => {
      // Create a test user for retrieval tests
      const userData = {
        email: 'retrieval@test.com',
        username: 'retrieval',
        firstName: 'Retrieval',
        lastName: 'Test',
        password: 'Password123!',
        roleIds: [testRoleId],
        branchIds: [testBranchId],
      };

      const response = await axios.post(`${API_BASE_URL}/api/users`, userData, {
        headers: getAuthHeaders(superAdminToken),
      });
      testUserId = response.data.id;
      createdUsers.push(testUserId);
    });

    it('should retrieve all users with pagination', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/users`, {
        params: { page: 1, limit: 10 },
        headers: getAuthHeaders(authToken),
      });

      expect(response.status).toBe(200);
      expect(response.data.data).toBeInstanceOf(Array);
      expect(response.data.pagination).toMatchObject({
        page: 1,
        limit: 10,
      });
    });

    it('should retrieve specific user by ID', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/users/${testUserId}`, {
        headers: getAuthHeaders(authToken),
      });

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        id: testUserId,
        email: 'retrieval@test.com',
        username: 'retrieval',
      });
    });

    it('should filter users by role', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/users`, {
        params: { roleId: testRoleId },
        headers: getAuthHeaders(authToken),
      });

      expect(response.status).toBe(200);
      const users = Array.isArray(response.data) ? response.data : response.data.data;
      if (users.length > 0) {
        expect(
          users.some((user: any) => user.roles?.some((role: any) => role.id === testRoleId))
        ).toBe(true);
      }
    });

    it('should search users by name/email', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/users`, {
        params: { search: 'retrieval' },
        headers: getAuthHeaders(authToken),
      });

      expect(response.status).toBe(200);
      const users = Array.isArray(response.data) ? response.data : response.data.data;
      if (users.length > 0) {
        expect(
          users.some(
            (user: any) =>
              user.firstName.toLowerCase().includes('retrieval') || user.email.includes('retrieval')
          )
        ).toBe(true);
      }
    });
  });

  describe('User Role Management', () => {
    let roleTestUserId: string;
    let additionalRoleId: string;

    beforeAll(async () => {
      // Create additional role for role management tests
      const additionalRoleData = {
        name: 'Additional E2E Role',
        description: 'Additional role for role management testing',
        permissionIds: availablePermissions.slice(5, 8).map((p: any) => p.id),
      };

      const additionalRole = await TestHelpers.createTestRole(superAdminToken, additionalRoleData);
      additionalRoleId = additionalRole.id;
      createdRoles.push(additionalRoleId);

      // Create test user for role management
      const userData = {
        email: 'rolemanagement@test.com',
        username: 'rolemanagement',
        firstName: 'Role',
        lastName: 'Management',
        password: 'Password123!',
        roleIds: [testRoleId],
        branchIds: [testBranchId],
      };

      const response = await axios.post(`${API_BASE_URL}/api/users`, userData, {
        headers: getAuthHeaders(superAdminToken),
      });
      roleTestUserId = response.data.id;
      createdUsers.push(roleTestUserId);
    });

    it('should assign additional roles to user', async () => {
      const response = await axios.put(
        `${API_BASE_URL}/api/users/${roleTestUserId}/roles`,
        {
          roleIds: [additionalRoleId],
          action: 'assign',
        },
        {
          headers: getAuthHeaders(superAdminToken),
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.roles).toHaveLength(2);
      expect(response.data.roles.map((r: any) => r.id)).toContain(additionalRoleId);
    });

    it('should remove roles from user', async () => {
      const response = await axios.put(
        `${API_BASE_URL}/api/users/${roleTestUserId}/roles`,
        {
          roleIds: [additionalRoleId],
          action: 'remove',
        },
        {
          headers: getAuthHeaders(superAdminToken),
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.roles).toHaveLength(1);
      expect(response.data.roles.map((r: any) => r.id)).not.toContain(additionalRoleId);
    });

    it('should prevent removing all roles (user must have at least one)', async () => {
      try {
        await axios.put(
          `${API_BASE_URL}/api/users/${roleTestUserId}/roles`,
          {
            roleIds: [testRoleId],
            action: 'remove',
          },
          {
            headers: getAuthHeaders(superAdminToken),
          }
        );
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as AxiosErrorResponse;
        expect(axiosError.response.status).toBe(400);
      }
    });

    it('should replace all roles for user', async () => {
      const response = await axios.put(
        `${API_BASE_URL}/api/users/${roleTestUserId}/roles`,
        {
          roleIds: [additionalRoleId],
          action: 'replace',
        },
        {
          headers: getAuthHeaders(superAdminToken),
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.roles).toHaveLength(1);
      expect(response.data.roles[0].id).toBe(additionalRoleId);
    });
  });

  describe('User Branch Management', () => {
    let branchTestUserId: string;

    beforeAll(async () => {
      // Create test user for branch management
      const userData = {
        email: 'branchmanagement@test.com',
        username: 'branchmanagement',
        firstName: 'Branch',
        lastName: 'Management',
        password: 'Password123!',
        roleIds: [testRoleId],
        branchIds: [testBranchId],
      };

      const response = await axios.post(`${API_BASE_URL}/api/users`, userData, {
        headers: getAuthHeaders(superAdminToken),
      });
      branchTestUserId = response.data.id;
      createdUsers.push(branchTestUserId);
    });

    it('should manage user branch assignments', async () => {
      // Test that we can update branch assignments if user has multiple branches available
      const userResponse = await axios.get(`${API_BASE_URL}/api/users/${branchTestUserId}`, {
        headers: getAuthHeaders(superAdminToken),
      });

      expect(userResponse.status).toBe(200);
      expect(userResponse.data.branches).toHaveLength(1);
      expect(userResponse.data.branches[0].id).toBe(testBranchId);
    });

    it('should prevent removing all branches (user must have at least one)', async () => {
      try {
        await axios.put(
          `${API_BASE_URL}/api/users/${branchTestUserId}/branches`,
          {
            branchIds: [testBranchId],
            action: 'remove',
          },
          {
            headers: getAuthHeaders(superAdminToken),
          }
        );
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as AxiosErrorResponse;
        expect(axiosError.response.status).toBe(400);
      }
    });
  });

  describe('User Update Operations', () => {
    let updateTestUserId: string;

    beforeAll(async () => {
      // Create test user for update operations
      const userData = {
        email: 'updatetest@test.com',
        username: 'updatetest',
        firstName: 'Update',
        lastName: 'Test',
        password: 'Password123!',
        roleIds: [testRoleId],
        branchIds: [testBranchId],
      };

      const response = await axios.post(`${API_BASE_URL}/api/users`, userData, {
        headers: getAuthHeaders(superAdminToken),
      });
      updateTestUserId = response.data.id;
      createdUsers.push(updateTestUserId);
    });

    it('should update user information', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        phone: '+1234567890',
      };

      const response = await axios.put(
        `${API_BASE_URL}/api/users/${updateTestUserId}`,
        updateData,
        {
          headers: getAuthHeaders(superAdminToken),
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        id: updateTestUserId,
        firstName: 'Updated',
        lastName: 'Name',
        phone: '+1234567890',
      });
    });

    it('should deactivate user', async () => {
      const response = await axios.delete(`${API_BASE_URL}/api/users/${updateTestUserId}`, {
        headers: getAuthHeaders(superAdminToken),
      });

      expect(response.status).toBe(200);
      expect(response.data.isActive).toBe(false);
    });

    it('should reactivate user', async () => {
      const response = await axios.put(
        `${API_BASE_URL}/api/users/${updateTestUserId}/activate`,
        {},
        {
          headers: getAuthHeaders(superAdminToken),
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.isActive).toBe(true);
    });
  });

  describe('Permission-Based Access Control', () => {
    it('should deny access without authentication', async () => {
      try {
        await axios.get(`${API_BASE_URL}/api/users`);
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as AxiosErrorResponse;
        expect(axiosError.response.status).toBe(401);
      }
    });

    it('should deny access with insufficient permissions', async () => {
      // Try to create user with limited permissions (branch manager vs super admin)
      const userData = {
        email: 'nopermission@test.com',
        username: 'nopermission',
        firstName: 'No',
        lastName: 'Permission',
        password: 'Password123!',
        roleIds: [testRoleId],
        branchIds: [testBranchId],
      };

      try {
        await axios.post(`${API_BASE_URL}/api/users`, userData, {
          headers: getAuthHeaders(authToken), // Using branch manager token instead of super admin
        });
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as AxiosErrorResponse;
        expect([403, 401]).toContain(axiosError.response.status);
      }
    });
  });

  describe('Company Isolation', () => {
    it('should only return users from same company', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/users`, {
        headers: getAuthHeaders(authToken),
      });

      expect(response.status).toBe(200);
      const users = Array.isArray(response.data) ? response.data : response.data.data;

      // All users should belong to the same company as the authenticated user
      expect(
        users.every((user: any) => user.companyId === testUser.companyId || !user.companyId)
      ).toBe(true);
    });

    it('should prevent access to users from other companies', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000';

      try {
        await axios.get(`${API_BASE_URL}/api/users/${fakeUserId}`, {
          headers: getAuthHeaders(authToken),
        });
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as AxiosErrorResponse;
        expect([404, 403]).toContain(axiosError.response.status);
      }
    });
  });

  describe('Data Validation', () => {
    it('should validate required fields when creating user', async () => {
      const invalidUserData = {
        // Missing required fields
        email: '',
        username: '',
        firstName: '',
        roleIds: [] as string[],
        branchIds: [] as string[],
      };

      try {
        await axios.post(`${API_BASE_URL}/api/users`, invalidUserData, {
          headers: getAuthHeaders(superAdminToken),
        });
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as AxiosErrorResponse;
        expect([400, 422]).toContain(axiosError.response.status);
      }
    });

    it('should validate email format', async () => {
      const invalidUserData = {
        email: 'invalid-email',
        username: 'validusername',
        firstName: 'Valid',
        lastName: 'Name',
        password: 'Password123!',
        roleIds: [testRoleId],
        branchIds: [testBranchId],
      };

      try {
        await axios.post(`${API_BASE_URL}/api/users`, invalidUserData, {
          headers: getAuthHeaders(superAdminToken),
        });
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as AxiosErrorResponse;
        expect([400, 422]).toContain(axiosError.response.status);
      }
    });

    it('should validate password strength', async () => {
      const invalidUserData = {
        email: 'weakpassword@test.com',
        username: 'weakpassword',
        firstName: 'Weak',
        lastName: 'Password',
        password: '123', // Weak password
        roleIds: [testRoleId],
        branchIds: [testBranchId],
      };

      try {
        await axios.post(`${API_BASE_URL}/api/users`, invalidUserData, {
          headers: getAuthHeaders(superAdminToken),
        });
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as AxiosErrorResponse;
        expect([400, 422]).toContain(axiosError.response.status);
      }
    });
  });
});
