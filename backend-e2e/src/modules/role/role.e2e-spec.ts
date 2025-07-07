import axios from 'axios';
import { type AxiosErrorResponse, TestHelpers, TestUser } from '../support/test-helpers';

describe('Role Management (E2E)', () => {
  const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3004';
  let authToken: string;
  let superAdminToken: string;
  let testUser: TestUser;
  let availablePermissions: any[];
  const createdRoles: string[] = [];

  beforeAll(async () => {
    // Login as super admin for role management tests
    const superAdminAuth = await TestHelpers.loginAsSuperAdmin();
    superAdminToken = superAdminAuth.accessToken;

    // Login as branch manager for permission tests
    const branchManagerAuth = await TestHelpers.loginAsBranchManager();
    authToken = branchManagerAuth.accessToken;
    testUser = branchManagerAuth.user;

    // Get available permissions for role creation
    availablePermissions = await TestHelpers.getTestPermissions(superAdminToken);
  });

  afterAll(async () => {
    // Cleanup created roles
    for (const roleId of createdRoles) {
      await TestHelpers.cleanupRole(superAdminToken, roleId);
    }
  });

  const getAuthHeaders = (token: string) => TestHelpers.getAuthHeaders(token);

  describe('Role CRUD Operations', () => {
    it('should create role with Discord-style permission assignment', async () => {
      const roleData = {
        name: 'E2E Test Manager Role',
        description: 'Discord-style role created for E2E testing',
        permissionIds: availablePermissions.slice(0, 8).map((p: any) => p.id),
      };

      const response = await axios.post(`${API_BASE_URL}/api/roles`, roleData, {
        headers: getAuthHeaders(superAdminToken),
      });

      expect(response.status).toBe(201);
      expect(response.data).toMatchObject({
        name: roleData.name,
        description: roleData.description,
        isActive: true,
      });

      expect(response.data.permissions).toHaveLength(8);
      expect(response.data.userCount).toBe(0);

      createdRoles.push(response.data.id);
    });

    it('should require at least one permission when creating role', async () => {
      const roleData = {
        name: 'Empty Role',
        description: 'Role with no permissions',
        permissionIds: [],
      };

      try {
        await axios.post(`${API_BASE_URL}/api/roles`, roleData, {
          headers: getAuthHeaders(superAdminToken),
        });
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as AxiosErrorResponse;
        expect(axiosError.response.status).toBe(400);
      }
    });

    it('should reject duplicate role name within same company', async () => {
      const roleData = {
        name: 'Duplicate Role Name',
        description: 'First role with this name',
        permissionIds: availablePermissions.slice(0, 3).map((p: any) => p.id),
      };

      // Create first role
      const firstResponse = await axios.post(`${API_BASE_URL}/api/roles`, roleData, {
        headers: getAuthHeaders(superAdminToken),
      });
      expect(firstResponse.status).toBe(201);
      createdRoles.push(firstResponse.data.id);

      // Try to create second role with same name
      roleData.description = 'Second role with duplicate name';
      try {
        await axios.post(`${API_BASE_URL}/api/roles`, roleData, {
          headers: getAuthHeaders(superAdminToken),
        });
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as AxiosErrorResponse;
        expect(axiosError.response.status).toBe(409);
      }
    });

    it('should validate that permissions exist', async () => {
      const roleData = {
        name: 'Invalid Permissions Role',
        description: 'Role with non-existent permissions',
        permissionIds: [
          '00000000-0000-0000-0000-000000000000',
          '11111111-1111-1111-1111-111111111111',
        ],
      };

      try {
        await axios.post(`${API_BASE_URL}/api/roles`, roleData, {
          headers: getAuthHeaders(superAdminToken),
        });
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as AxiosErrorResponse;
        expect(axiosError.response.status).toBe(400);
      }
    });
  });

  describe('Role Retrieval Operations', () => {
    let testRoleId: string;

    beforeAll(async () => {
      // Create a test role for retrieval tests
      const roleData = {
        name: 'Retrieval Test Role',
        description: 'Role created for retrieval testing',
        permissionIds: availablePermissions.slice(0, 5).map((p: any) => p.id),
      };

      const response = await axios.post(`${API_BASE_URL}/api/roles`, roleData, {
        headers: getAuthHeaders(superAdminToken),
      });
      testRoleId = response.data.id;
      createdRoles.push(testRoleId);
    });

    it('should retrieve all roles for company', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/roles`, {
        headers: getAuthHeaders(authToken),
      });

      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.length).toBeGreaterThan(0);

      // Should include our test role
      const testRole = response.data.find((role: any) => role.id === testRoleId);
      expect(testRole).toBeDefined();
      expect(testRole.name).toBe('Retrieval Test Role');
    });

    it('should retrieve specific role by ID', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/roles/${testRoleId}`, {
        headers: getAuthHeaders(authToken),
      });

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        id: testRoleId,
        name: 'Retrieval Test Role',
        description: 'Role created for retrieval testing',
      });

      expect(response.data.permissions).toHaveLength(5);
      expect(response.data.userCount).toBe(0);
    });

    it('should return 404 for non-existent role', async () => {
      const fakeRoleId = '00000000-0000-0000-0000-000000000000';

      try {
        await axios.get(`${API_BASE_URL}/api/roles/${fakeRoleId}`, {
          headers: getAuthHeaders(authToken),
        });
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as AxiosErrorResponse;
        expect([404, 403]).toContain(axiosError.response.status);
      }
    });
  });

  describe('Permission Management Operations', () => {
    it('should retrieve all available permissions', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/roles/permissions/all`, {
        headers: getAuthHeaders(authToken),
      });

      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.length).toBeGreaterThan(0);

      // Check permission structure
      const permission = response.data[0];
      expect(permission).toMatchObject({
        id: expect.any(String),
        module: expect.any(String),
        action: expect.any(String),
        permission: expect.any(String),
      });

      expect(permission.permission).toBe(`${permission.module}:${permission.action}`);
    });

    it('should retrieve permissions organized by module', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/roles/permissions`, {
        headers: getAuthHeaders(authToken),
      });

      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('object');

      // Should have at least some modules
      const modules = Object.keys(response.data);
      expect(modules.length).toBeGreaterThan(0);

      // Check that each module has permissions
      for (const module of modules) {
        expect(response.data[module]).toBeInstanceOf(Array);
        expect(response.data[module].length).toBeGreaterThan(0);

        // Check permission structure within module
        const permission = response.data[module][0];
        expect(permission).toMatchObject({
          id: expect.any(String),
          module: module,
          action: expect.any(String),
          permission: expect.any(String),
        });
      }
    });
  });

  describe('Role Permission Management (Discord-style)', () => {
    let permissionTestRoleId: string;

    beforeAll(async () => {
      // Create test role for permission management
      const roleData = {
        name: 'Permission Management Test Role',
        description: 'Role for testing Discord-style permission management',
        permissionIds: availablePermissions.slice(0, 3).map((p: any) => p.id),
      };

      const response = await axios.post(`${API_BASE_URL}/api/roles`, roleData, {
        headers: getAuthHeaders(superAdminToken),
      });
      permissionTestRoleId = response.data.id;
      createdRoles.push(permissionTestRoleId);
    });

    it('should assign additional permissions to role', async () => {
      const newPermissionIds = availablePermissions.slice(3, 6).map((p: any) => p.id);

      const response = await axios.put(
        `${API_BASE_URL}/api/roles/${permissionTestRoleId}/permissions`,
        {
          permissionIds: newPermissionIds,
          action: 'assign',
        },
        {
          headers: getAuthHeaders(superAdminToken),
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.permissions).toHaveLength(6); // 3 original + 3 new

      // Check that new permissions are included
      const permissionIds = response.data.permissions.map((p: any) => p.id);
      for (const newPermId of newPermissionIds) {
        expect(permissionIds).toContain(newPermId);
      }
    });

    it('should remove permissions from role', async () => {
      const permissionsToRemove = availablePermissions.slice(3, 5).map((p: any) => p.id);

      const response = await axios.put(
        `${API_BASE_URL}/api/roles/${permissionTestRoleId}/permissions`,
        {
          permissionIds: permissionsToRemove,
          action: 'remove',
        },
        {
          headers: getAuthHeaders(superAdminToken),
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.permissions).toHaveLength(4); // 6 - 2 removed

      // Check that removed permissions are not included
      const permissionIds = response.data.permissions.map((p: any) => p.id);
      for (const removedPermId of permissionsToRemove) {
        expect(permissionIds).not.toContain(removedPermId);
      }
    });

    it('should prevent removing all permissions (role must have at least one)', async () => {
      // Get current permissions
      const roleResponse = await axios.get(`${API_BASE_URL}/api/roles/${permissionTestRoleId}`, {
        headers: getAuthHeaders(superAdminToken),
      });

      const allPermissionIds = roleResponse.data.permissions.map((p: any) => p.id);

      try {
        await axios.put(
          `${API_BASE_URL}/api/roles/${permissionTestRoleId}/permissions`,
          {
            permissionIds: allPermissionIds,
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

    it('should replace all permissions for role (Discord-style)', async () => {
      const newPermissionIds = availablePermissions.slice(10, 15).map((p: any) => p.id);

      const response = await axios.put(
        `${API_BASE_URL}/api/roles/${permissionTestRoleId}/permissions`,
        {
          permissionIds: newPermissionIds,
          action: 'replace',
        },
        {
          headers: getAuthHeaders(superAdminToken),
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.permissions).toHaveLength(5);

      // Check that only new permissions are present
      const permissionIds = response.data.permissions.map((p: any) => p.id);
      for (const newPermId of newPermissionIds) {
        expect(permissionIds).toContain(newPermId);
      }
    });
  });

  describe('Role Update Operations', () => {
    let updateTestRoleId: string;

    beforeAll(async () => {
      // Create test role for update operations
      const roleData = {
        name: 'Update Test Role',
        description: 'Role for testing update operations',
        permissionIds: availablePermissions.slice(0, 3).map((p: any) => p.id),
      };

      const response = await axios.post(`${API_BASE_URL}/api/roles`, roleData, {
        headers: getAuthHeaders(superAdminToken),
      });
      updateTestRoleId = response.data.id;
      createdRoles.push(updateTestRoleId);
    });

    it('should update role information', async () => {
      const updateData = {
        name: 'Updated Role Name',
        description: 'Updated role description',
      };

      const response = await axios.put(
        `${API_BASE_URL}/api/roles/${updateTestRoleId}`,
        updateData,
        {
          headers: getAuthHeaders(superAdminToken),
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        id: updateTestRoleId,
        name: 'Updated Role Name',
        description: 'Updated role description',
      });
    });

    it('should prevent duplicate name when updating', async () => {
      // Create another role first
      const anotherRoleData = {
        name: 'Another Unique Role',
        description: 'Another role',
        permissionIds: availablePermissions.slice(0, 2).map((p: any) => p.id),
      };

      const anotherResponse = await axios.post(`${API_BASE_URL}/api/roles`, anotherRoleData, {
        headers: getAuthHeaders(superAdminToken),
      });
      createdRoles.push(anotherResponse.data.id);

      // Try to update our test role to have the same name
      try {
        await axios.put(
          `${API_BASE_URL}/api/roles/${updateTestRoleId}`,
          { name: 'Another Unique Role' },
          {
            headers: getAuthHeaders(superAdminToken),
          }
        );
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as AxiosErrorResponse;
        expect(axiosError.response.status).toBe(409);
      }
    });

    it('should deactivate role', async () => {
      const response = await axios.delete(`${API_BASE_URL}/api/roles/${updateTestRoleId}`, {
        headers: getAuthHeaders(superAdminToken),
      });

      expect(response.status).toBe(200);
      expect(response.data.isActive).toBe(false);
    });

    it('should reactivate role', async () => {
      const response = await axios.put(
        `${API_BASE_URL}/api/roles/${updateTestRoleId}/activate`,
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
        await axios.get(`${API_BASE_URL}/api/roles`);
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as AxiosErrorResponse;
        expect(axiosError.response.status).toBe(401);
      }
    });

    it('should deny role creation with insufficient permissions', async () => {
      const roleData = {
        name: 'Unauthorized Role',
        description: 'Role created without proper permissions',
        permissionIds: availablePermissions.slice(0, 2).map((p: any) => p.id),
      };

      try {
        await axios.post(`${API_BASE_URL}/api/roles`, roleData, {
          headers: getAuthHeaders(authToken), // Using branch manager token instead of super admin
        });
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as AxiosErrorResponse;
        expect([403, 401]).toContain(axiosError.response.status);
      }
    });

    it('should allow super admin to manage all roles', async () => {
      const roleData = {
        name: 'Super Admin Created Role',
        description: 'Role created by super admin',
        permissionIds: availablePermissions.slice(0, 5).map((p: any) => p.id),
      };

      const response = await axios.post(`${API_BASE_URL}/api/roles`, roleData, {
        headers: getAuthHeaders(superAdminToken),
      });

      expect(response.status).toBe(201);
      expect(response.data.name).toBe('Super Admin Created Role');
      createdRoles.push(response.data.id);
    });
  });

  describe('Company Isolation', () => {
    it('should only return roles from same company', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/roles`, {
        headers: getAuthHeaders(authToken),
      });

      expect(response.status).toBe(200);

      // All roles should belong to the same company as the authenticated user
      expect(
        response.data.every((role: any) => role.companyId === testUser.companyId || !role.companyId)
      ).toBe(true);
    });

    it('should prevent access to roles from other companies', async () => {
      const fakeRoleId = '00000000-0000-0000-0000-000000000000';

      try {
        await axios.get(`${API_BASE_URL}/api/roles/${fakeRoleId}`, {
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
    it('should validate required fields when creating role', async () => {
      const invalidRoleData = {
        // Missing required fields
        name: '',
        permissionIds: [],
      };

      try {
        await axios.post(`${API_BASE_URL}/api/roles`, invalidRoleData, {
          headers: getAuthHeaders(superAdminToken),
        });
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as AxiosErrorResponse;
        expect([400, 422]).toContain(axiosError.response.status);
      }
    });

    it('should validate role name length', async () => {
      const invalidRoleData = {
        name: 'a'.repeat(101), // Exceeds max length
        description: 'Valid description',
        permissionIds: availablePermissions.slice(0, 2).map((p: any) => p.id),
      };

      try {
        await axios.post(`${API_BASE_URL}/api/roles`, invalidRoleData, {
          headers: getAuthHeaders(superAdminToken),
        });
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as AxiosErrorResponse;
        expect([400, 422]).toContain(axiosError.response.status);
      }
    });

    it('should validate permission IDs are valid UUIDs', async () => {
      const invalidRoleData = {
        name: 'Invalid Permission IDs Role',
        description: 'Role with invalid permission IDs',
        permissionIds: ['not-a-uuid', 'also-not-a-uuid'],
      };

      try {
        await axios.post(`${API_BASE_URL}/api/roles`, invalidRoleData, {
          headers: getAuthHeaders(superAdminToken),
        });
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as AxiosErrorResponse;
        expect([400, 422]).toContain(axiosError.response.status);
      }
    });
  });

  describe('Integration with User Management', () => {
    let integrationRoleId: string;
    let testUserId: string;

    beforeAll(async () => {
      // Create a role for integration testing
      const roleData = {
        name: 'Integration Test Role',
        description: 'Role for testing integration with user management',
        permissionIds: availablePermissions.slice(0, 3).map((p: any) => p.id),
      };

      const roleResponse = await axios.post(`${API_BASE_URL}/api/roles`, roleData, {
        headers: getAuthHeaders(superAdminToken),
      });
      integrationRoleId = roleResponse.data.id;
      createdRoles.push(integrationRoleId);

      // Create a user with this role
      const userData = {
        email: 'integration@test.com',
        username: 'integration',
        firstName: 'Integration',
        lastName: 'Test',
        password: 'Password123!',
        roleIds: [integrationRoleId],
        branchIds: [testUser.branchIds[0]],
      };

      const userResponse = await axios.post(`${API_BASE_URL}/api/users`, userData, {
        headers: getAuthHeaders(superAdminToken),
      });
      testUserId = userResponse.data.id;
    });

    afterAll(async () => {
      // Cleanup test user
      if (testUserId) {
        await TestHelpers.cleanupUser(superAdminToken, testUserId);
      }
    });

    it('should show user count for roles', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/roles/${integrationRoleId}`, {
        headers: getAuthHeaders(superAdminToken),
      });

      expect(response.status).toBe(200);
      expect(response.data.userCount).toBe(1);
    });

    it('should prevent deletion of role assigned to users', async () => {
      try {
        await axios.delete(`${API_BASE_URL}/api/roles/${integrationRoleId}`, {
          headers: getAuthHeaders(superAdminToken),
        });
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as AxiosErrorResponse;
        expect(axiosError.response.status).toBe(403);
        expect(axiosError.response.data.message).toContain('user(s)');
      }
    });

    it('should allow deletion after removing users from role', async () => {
      // Remove user from role first
      await axios.put(
        `${API_BASE_URL}/api/users/${testUserId}/roles`,
        {
          roleIds: [integrationRoleId],
          action: 'remove',
        },
        {
          headers: getAuthHeaders(superAdminToken),
        }
      );

      // Now deletion should work
      const response = await axios.delete(`${API_BASE_URL}/api/roles/${integrationRoleId}`, {
        headers: getAuthHeaders(superAdminToken),
      });

      expect(response.status).toBe(200);
      expect(response.data.isActive).toBe(false);
    });
  });
});
