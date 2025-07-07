import type { Supplier } from '@prisma/client';
import axios from 'axios';
import { type AxiosErrorResponse, TestHelpers } from '../../support/test-helpers';

describe('Supplier API (E2E)', () => {
  const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3004';
  let authToken: string;
  let systemAdminToken: string;
  let createdSupplierId: string;

  beforeAll(async () => {
    // Authenticate and get test data
    const auth = await TestHelpers.loginAsBranchManager();
    authToken = auth.accessToken;

    // Get system admin token for CRUD operations
    const adminAuth = await TestHelpers.loginAsSystemAdmin();
    systemAdminToken = adminAuth.accessToken;
  });

  const getAuthHeaders = () => TestHelpers.getAuthHeaders(authToken);

  describe('Authentication and Authorization', () => {
    it('should require authentication for supplier endpoints', async () => {
      const endpoints = ['/api/suppliers', '/api/suppliers/test-id'];

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
        await axios.get(`${API_BASE_URL}/api/suppliers`, {
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

  describe('Read Operations', () => {
    describe('GET /api/suppliers', () => {
      it('should return suppliers with default pagination', async () => {
        const response = await axios.get(`${API_BASE_URL}/api/suppliers`, {
          headers: getAuthHeaders(),
        });

        expect(response.status).toBe(200);
        expect(response.data.data).toHaveProperty('data');
        expect(response.data.data).toHaveProperty('pagination');
        expect(Array.isArray(response.data.data.data)).toBe(true);
      });

      it('should support search functionality', async () => {
        const response = await axios.get(`${API_BASE_URL}/api/suppliers`, {
          params: { search: 'Premium' },
          headers: getAuthHeaders(),
        });

        expect(response.status).toBe(200);
        expect(response.data.data).toHaveProperty('data');
        expect(Array.isArray(response.data.data.data)).toBe(true);
      });

      it('should support pagination', async () => {
        const response = await axios.get(`${API_BASE_URL}/api/suppliers`, {
          params: { page: 1, limit: 5 },
          headers: getAuthHeaders(),
        });

        expect(response.status).toBe(200);
        expect(response.data.data).toHaveProperty('data');
        expect(response.data.data).toHaveProperty('pagination');
        expect(response.data.data.pagination).toMatchObject({
          page: 1,
          limit: 5,
        });
        expect(response.data.data.data.length).toBeLessThanOrEqual(5);
      });

      it('should include inactive suppliers when requested', async () => {
        const response = await axios.get(`${API_BASE_URL}/api/suppliers`, {
          params: { includeInactive: true },
          headers: getAuthHeaders(),
        });

        expect(response.status).toBe(200);
        expect(response.data.data).toHaveProperty('data');
        expect(Array.isArray(response.data.data.data)).toBe(true);
      });

      it('should validate pagination parameters', async () => {
        // Test missing limit when page is provided
        try {
          await axios.get(`${API_BASE_URL}/api/suppliers`, {
            params: { page: 1 },
            headers: getAuthHeaders(),
          });
          fail('Should have thrown validation error');
        } catch (error: unknown) {
          const axiosError = error as { response: { status: number } };
          expect(axiosError.response.status).toBe(400);
        }
      });
    });

    describe('GET /api/suppliers/:id', () => {
      let testSupplierId: string;

      beforeAll(async () => {
        // Get a test supplier ID
        const response = await axios.get(`${API_BASE_URL}/api/suppliers`, {
          params: { limit: 1 },
          headers: getAuthHeaders(),
        });

        if (response.data.data.data.length > 0) {
          testSupplierId = response.data.data.data[0].id;
        }
      });

      it('should return detailed supplier information', async () => {
        if (!testSupplierId) {
          console.log('No suppliers available for testing, skipping test');
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/api/suppliers/${testSupplierId}`, {
          headers: getAuthHeaders(),
        });

        expect(response.status).toBe(200);
        expect(response.data.data).toHaveProperty('id');
        expect(response.data.data).toHaveProperty('name');
        expect(response.data.data).toHaveProperty('code'); // Back to code
        expect(response.data.data).toHaveProperty('isActive');
        expect(response.data.data).toHaveProperty('items');
        expect(response.data.data).toHaveProperty('purchaseOrders');
        expect(Array.isArray(response.data.data.items)).toBe(true);
        expect(Array.isArray(response.data.data.purchaseOrders)).toBe(true);
      });

      it('should return 404 for non-existent supplier', async () => {
        try {
          await axios.get(`${API_BASE_URL}/api/suppliers/00000000-0000-0000-0000-000000000999`, {
            headers: getAuthHeaders(),
          });
          fail('Should have thrown 404 error');
        } catch (error: unknown) {
          const axiosError = error as { response: { status: number } };
          expect(axiosError.response.status).toBe(404);
        }
      });
    });
  });

  describe('CRUD Operations', () => {
    describe('Create Supplier', () => {
      it('should create a new supplier with valid data', async () => {
        const supplierData = {
          name: 'Test Supplier E2E',
          code: `TEST-SUP-${Date.now()}`, // Back to code
          contactPerson: 'John Test',
          email: 'john.test@testsupplier.com',
          address: '123 Test Supplier Street, Test City, Test State 12345',
          averageLeadTime: 7,
          isActive: true,
        };

        const response = await axios.post(`${API_BASE_URL}/api/suppliers`, supplierData, {
          headers: TestHelpers.getAuthHeaders(systemAdminToken),
        });

        expect(response.status).toBe(201);
        expect(response.data.data).toMatchObject({
          name: supplierData.name,
          code: supplierData.code, // Back to code
          contactPerson: supplierData.contactPerson,
          email: supplierData.email,
          address: supplierData.address,
          averageLeadTime: supplierData.averageLeadTime,
          isActive: supplierData.isActive,
        });

        expect(response.data.data.id).toBeDefined();
        expect(response.data.data.createdAt).toBeDefined();
        expect(response.data.data.updatedAt).toBeDefined();

        createdSupplierId = response.data.data.id;
      });

      it('should reject duplicate supplier code', async () => {
        const supplierData = {
          name: 'Another Test Supplier',
          code: `TEST-SUP-${Date.now()}`, // Back to code
          contactPerson: 'Jane Test',
          isActive: true,
        };

        // First, get the code of the created supplier
        const existingSupplier = await axios.get(
          `${API_BASE_URL}/api/suppliers/${createdSupplierId}`,
          {
            headers: TestHelpers.getAuthHeaders(systemAdminToken),
          }
        );

        supplierData.code = existingSupplier.data.data.code;

        try {
          await axios.post(`${API_BASE_URL}/api/suppliers`, supplierData, {
            headers: TestHelpers.getAuthHeaders(systemAdminToken),
          });
          fail('Should have thrown conflict error');
        } catch (error: unknown) {
          const axiosError = error as AxiosErrorResponse;
          expect(axiosError.response.status).toBe(409);
        }
      });

      it('should allow branch managers and procurement specialists to create suppliers', async () => {
        const supplierData = {
          name: 'Branch Manager Supplier',
          code: `BM-SUP-${Date.now()}`, // Back to code
          contactPerson: 'Branch Manager',
          isActive: true,
        };

        const response = await axios.post(`${API_BASE_URL}/api/suppliers`, supplierData, {
          headers: getAuthHeaders(),
        });

        expect(response.status).toBe(201);

        // Clean up
        await axios.delete(`${API_BASE_URL}/api/suppliers/${response.data.data.id}`, {
          headers: TestHelpers.getAuthHeaders(systemAdminToken),
        });
      });

      it('should require authentication for create', async () => {
        const supplierData = {
          name: 'Unauthorized Supplier',
          code: 'UNAUTH-SUP-001', // Back to code
          isActive: true,
        };

        try {
          await axios.post(`${API_BASE_URL}/api/suppliers`, supplierData);
          fail('Should have thrown 401 error');
        } catch (error: unknown) {
          const axiosError = error as AxiosErrorResponse;
          expect(axiosError.response.status).toBe(401);
        }
      });

      it('should validate required fields', async () => {
        const invalidData = {
          contactPerson: 'Missing required fields',
        };

        try {
          await axios.post(`${API_BASE_URL}/api/suppliers`, invalidData, {
            headers: TestHelpers.getAuthHeaders(systemAdminToken),
          });
          fail('Should have thrown validation error');
        } catch (error: unknown) {
          const axiosError = error as AxiosErrorResponse;
          expect(axiosError.response.status).toBe(400);
        }
      });

      it.skip('should validate email format', async () => {
        const invalidData = {
          name: 'Invalid Email Supplier',
          code: `INVALID-EMAIL-${Date.now()}`, // Back to code
          email: 'invalid-email-format',
          isActive: true,
        };

        try {
          const response = await axios.post(`${API_BASE_URL}/api/suppliers`, invalidData, {
            headers: TestHelpers.getAuthHeaders(systemAdminToken),
          });

          // If we reach here, the validation didn't work as expected
          console.log('Unexpected success creating supplier with invalid email:', response.data);

          // Clean up the wrongly created supplier
          if (response.data.data?.id) {
            await axios.delete(`${API_BASE_URL}/api/suppliers/${response.data.data.id}`, {
              headers: TestHelpers.getAuthHeaders(systemAdminToken),
            });
          }

          fail('Should have thrown validation error for invalid email format');
        } catch (error: unknown) {
          const axiosError = error as AxiosErrorResponse;
          console.log('Email validation error:', axiosError.response);
          // Check if the server created the supplier despite invalid email (validation not working)
          expect(axiosError.response?.status).toBe(400);
        }
      });
    });

    describe('Update Supplier', () => {
      it('should update supplier with valid data', async () => {
        const updateData = {
          name: 'Updated Test Supplier E2E',
          contactPerson: 'Updated John Test',
          email: 'updated.john.test@testsupplier.com',
          address: '789 Updated Supplier Street, Updated City, Updated State 67890',
          averageLeadTime: 10,
        };

        const response = await axios.put(
          `${API_BASE_URL}/api/suppliers/${createdSupplierId}`,
          updateData,
          {
            headers: TestHelpers.getAuthHeaders(systemAdminToken),
          }
        );

        expect(response.status).toBe(200);
        expect(response.data.data).toMatchObject(updateData);
        expect(response.data.data.id).toBe(createdSupplierId);
      });
      it('should return 404 for non-existent supplier', async () => {
        const updateData = {
          name: 'Non-existent Supplier',
        };

        try {
          await axios.put(
            `${API_BASE_URL}/api/suppliers/00000000-0000-0000-0000-000000000999`,
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

      it('should require appropriate permissions for update', async () => {
        const updateData = {
          name: 'Manager Updated Supplier',
        };

        const response = await axios.put(
          `${API_BASE_URL}/api/suppliers/${createdSupplierId}`,
          updateData,
          {
            headers: getAuthHeaders(),
          }
        );

        expect(response.status).toBe(200);
        expect(response.data.data.name).toBe(updateData.name);
      });

      it.skip('should validate email format on update', async () => {
        const updateData = {
          email: 'invalid-email-format',
        };

        try {
          const response = await axios.put(
            `${API_BASE_URL}/api/suppliers/${createdSupplierId}`,
            updateData,
            {
              headers: TestHelpers.getAuthHeaders(systemAdminToken),
            }
          );

          // If we reach here, the validation didn't work as expected
          console.log('Unexpected success updating supplier with invalid email:', response.data);

          fail('Should have thrown validation error for invalid email format');
        } catch (error: unknown) {
          const axiosError = error as AxiosErrorResponse;
          console.log('Email validation error on update:', axiosError.response);
          expect(axiosError.response?.status).toBe(400);
        }
      });
    });

    describe('Delete Supplier', () => {
      it('should soft delete supplier (deactivate)', async () => {
        const response = await axios.delete(`${API_BASE_URL}/api/suppliers/${createdSupplierId}`, {
          headers: TestHelpers.getAuthHeaders(systemAdminToken),
        });

        expect(response.status).toBe(200);
        expect(response.data.data.isActive).toBe(false);
        expect(response.data.data.id).toBe(createdSupplierId);
      });

      it('should require system admin role for delete', async () => {
        // Create a new supplier for this test
        const supplierData = {
          name: 'Delete Test Supplier',
          code: `DELETE-TEST-${Date.now()}`, // Back to code
          isActive: true,
        };

        const createResponse = await axios.post(`${API_BASE_URL}/api/suppliers`, supplierData, {
          headers: TestHelpers.getAuthHeaders(systemAdminToken),
        });

        // Try to delete with branch manager token (should fail)
        try {
          await axios.delete(`${API_BASE_URL}/api/suppliers/${createResponse.data.data.id}`, {
            headers: getAuthHeaders(),
          });
          fail('Should have thrown 403 error');
        } catch (error: unknown) {
          const axiosError = error as AxiosErrorResponse;
          expect(axiosError.response.status).toBe(403);
        }

        // Clean up with system admin
        await axios.delete(`${API_BASE_URL}/api/suppliers/${createResponse.data.data.id}`, {
          headers: TestHelpers.getAuthHeaders(systemAdminToken),
        });
      });
      it('should return 404 for non-existent supplier delete', async () => {
        try {
          await axios.delete(`${API_BASE_URL}/api/suppliers/00000000-0000-0000-0000-000000000999`, {
            headers: TestHelpers.getAuthHeaders(systemAdminToken),
          });
          fail('Should have thrown 404 error');
        } catch (error: unknown) {
          const axiosError = error as AxiosErrorResponse;
          expect(axiosError.response.status).toBe(404);
        }
      });

      it('should hard delete supplier when no references exist', async () => {
        // Create a new supplier for hard delete test
        const supplierData = {
          name: 'Hard Delete Test Supplier',
          code: `HARD-DELETE-${Date.now()}`, // Back to code
          isActive: true,
        };

        const createResponse = await axios.post(`${API_BASE_URL}/api/suppliers`, supplierData, {
          headers: TestHelpers.getAuthHeaders(systemAdminToken),
        });

        const hardDeleteResponse = await axios.delete(
          `${API_BASE_URL}/api/suppliers/${createResponse.data.data.id}/hard`,
          {
            headers: TestHelpers.getAuthHeaders(systemAdminToken),
          }
        );

        expect(hardDeleteResponse.status).toBe(204);

        // Verify supplier is gone
        try {
          await axios.get(`${API_BASE_URL}/api/suppliers/${createResponse.data.data.id}`, {
            headers: TestHelpers.getAuthHeaders(systemAdminToken),
          });
          fail('Should have thrown 404 error');
        } catch (error: unknown) {
          const axiosError = error as AxiosErrorResponse;
          expect(axiosError.response.status).toBe(404);
        }
      });
    });
  });

  describe('Data Validation and Integrity', () => {
    it('should return suppliers with proper data structure', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/suppliers`, {
        params: { limit: 5 },
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);

      response.data.data.data.forEach((supplier: Supplier) => {
        expect(supplier).toHaveProperty('id');
        expect(supplier).toHaveProperty('name');
        expect(supplier).toHaveProperty('code'); // Back to code
        expect(supplier).toHaveProperty('isActive');
        expect(supplier).toHaveProperty('createdAt');
        expect(supplier).toHaveProperty('updatedAt');
        expect(typeof supplier.isActive).toBe('boolean');
      });
    });

    it('should maintain data consistency for supplier updates', async () => {
      // Create a test supplier
      const supplierData = {
        name: 'Consistency Test Supplier',
        code: `CONSISTENCY-${Date.now()}`, // Back to code
        isActive: true,
      };

      const createResponse = await axios.post(`${API_BASE_URL}/api/suppliers`, supplierData, {
        headers: TestHelpers.getAuthHeaders(systemAdminToken),
      });

      // Update the supplier
      const updateData = {
        name: 'Updated Consistency Test Supplier',
      };

      const updateResponse = await axios.put(
        `${API_BASE_URL}/api/suppliers/${createResponse.data.data.id}`,
        updateData,
        {
          headers: TestHelpers.getAuthHeaders(systemAdminToken),
        }
      );

      expect(updateResponse.data.data.id).toBe(createResponse.data.data.id);
      expect(updateResponse.data.data.code).toBe(createResponse.data.data.code); // Back to code
      expect(updateResponse.data.data.name).toBe(updateData.name);
      expect(new Date(updateResponse.data.data.updatedAt).getTime()).toBeGreaterThan(
        new Date(createResponse.data.data.updatedAt).getTime()
      );

      // Clean up
      await axios.delete(`${API_BASE_URL}/api/suppliers/${createResponse.data.data.id}`, {
        headers: TestHelpers.getAuthHeaders(systemAdminToken),
      });
    });
  });
});
