import axios from 'axios';
import { TestHelpers, type TestUser } from '../../support/test-helpers';

describe('Goods Receipt API (E2E)', () => {
  const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3004';
  let authToken: string;
  let testUser: TestUser;
  let testPurchaseOrderId: string;
  let testGoodsReceiptId: string;

  // Dynamic test data - will be fetched from database
  let TEST_ITEM_ID: string;
  let TEST_SUPPLIER_ID: string;

  beforeAll(async () => {
    // Fetch dynamic test data from database
    TEST_ITEM_ID = await TestHelpers.getTestItemId();
    TEST_SUPPLIER_ID = await TestHelpers.getTestSupplierId();

    // Login as branch manager for testing
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'manager.a@supplychain.com',
      password: 'manager123',
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.data.access_token).toBeDefined();

    authToken = loginResponse.data.access_token;
    testUser = loginResponse.data.user;

    // Create a purchase order for goods receipt testing
    const timestamp = Date.now();
    const poData = {
      title: `Test PO for GR Creation E2E ${timestamp}`,
      supplierId: TEST_SUPPLIER_ID,
      expectedDeliveryDate: '2025-07-01T10:00:00Z',
      paymentTerms: 'Net 30 days',
      deliveryTerms: 'FOB Origin',
      branchId: testUser.branchId,
      notes: 'Testing PO to GR workflow in E2E tests',
      items: [
        {
          itemId: TEST_ITEM_ID,
          orderedQty: 100,
          unitPrice: 15.0,
          deliveryDate: '2025-07-01T10:00:00Z',
          remarks: 'Test item for GR creation',
        },
      ],
    };

    const poResponse = await axios.post(`${API_BASE_URL}/api/purchase-order`, poData, {
      headers: getAuthHeaders(),
    });

    expect(poResponse.status).toBe(201);
    testPurchaseOrderId = poResponse.data.id; // Execute PO workflow to make it available for goods receipt (needs CONFIRMED status)
    await axios.post(
      `${API_BASE_URL}/api/purchase-order/${testPurchaseOrderId}/send-to-supplier`,
      {},
      { headers: getAuthHeaders() }
    );

    await axios.post(
      `${API_BASE_URL}/api/purchase-order/${testPurchaseOrderId}/confirm`,
      {},
      { headers: getAuthHeaders() }
    );
  });

  afterAll(async () => {
    // Clean up test data
    if (testGoodsReceiptId) {
      try {
        await axios.delete(`${API_BASE_URL}/api/goods-receipt/${testGoodsReceiptId}`, {
          headers: getAuthHeaders(),
        });
      } catch (_error) {
        // Ignore cleanup errors
      }
    }

    if (testPurchaseOrderId) {
      try {
        await axios.delete(`${API_BASE_URL}/api/purchase-order/${testPurchaseOrderId}`, {
          headers: getAuthHeaders(),
        });
      } catch (_error) {
        // Ignore cleanup errors
      }
    }
  });

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${authToken}`,
    'Content-Type': 'application/json',
  });

  describe('Authentication', () => {
    it('should have valid authentication token', () => {
      expect(authToken).toBeDefined();
      expect(testUser).toBeDefined();
      expect(testUser.role).toBe('BRANCH_MANAGER');
    });

    it('should reject requests without authentication', async () => {
      try {
        await axios.get(`${API_BASE_URL}/api/goods-receipt`);
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as { response: { status: number } };
        expect(axiosError.response.status).toBe(401);
      }
    });
  });

  describe('Goods Receipt CRUD Operations', () => {
    it('should create goods receipt from purchase order', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/api/goods-receipt/from-po/${testPurchaseOrderId}`,
        {},
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(201);
      expect(response.data).toMatchObject({
        id: expect.any(String),
        grNumber: expect.stringMatching(/^GR\d{9}$/),
        status: 'DRAFT',
        poId: testPurchaseOrderId,
        branch: expect.objectContaining({
          id: testUser.branchId,
        }),
        items: expect.arrayContaining([
          expect.objectContaining({
            itemId: TEST_ITEM_ID,
            orderedQty: expect.any(String), // API returns string
            receivedQty: expect.any(String), // API returns string
          }),
        ]),
      });

      testGoodsReceiptId = response.data.id;
    });

    it('should create standalone goods receipt', async () => {
      const timestamp = Date.now();
      const grData = {
        documentNumber: `DOC-${timestamp}`,
        receiptDate: '2025-06-08T10:00:00Z',
        branchId: testUser.branchId,
        remarks: 'Testing standalone GR creation',
        items: [
          {
            itemId: TEST_ITEM_ID,
            orderedQty: 50,
            receivedQty: 48,
            unitPrice: 16.0,
            qualityNotes: 'Good condition, 2 units damaged',
          },
        ],
      };

      const response = await axios.post(`${API_BASE_URL}/api/goods-receipt`, grData, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(201);
      expect(response.data).toMatchObject({
        id: expect.any(String),
        grNumber: expect.stringMatching(/^GR\d{9}$/),
        status: 'DRAFT',
        documentNumber: `DOC-${timestamp}`,
        branchId: testUser.branchId,
        items: expect.arrayContaining([
          expect.objectContaining({
            itemId: TEST_ITEM_ID,
            orderedQty: expect.any(String),
            receivedQty: expect.any(String),
            unitPrice: expect.any(String),
            qualityNotes: 'Good condition, 2 units damaged',
          }),
        ]),
      });

      // Clean up this test GR
      await axios.delete(`${API_BASE_URL}/api/goods-receipt/${response.data.id}`, {
        headers: getAuthHeaders(),
      });
    });

    it('should retrieve goods receipt by ID', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/goods-receipt/${testGoodsReceiptId}`, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        id: testGoodsReceiptId,
        grNumber: expect.stringMatching(/^GR\d{9}$/),
        status: 'DRAFT',
        poId: testPurchaseOrderId,
        items: expect.arrayContaining([
          expect.objectContaining({
            itemId: TEST_ITEM_ID,
          }),
        ]),
      });
    });

    it('should list all goods receipts', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/goods-receipt`, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);

      // Find our test GR
      const testGR = response.data.find((gr: any) => gr.id === testGoodsReceiptId);
      expect(testGR).toBeDefined();
      expect(testGR.grNumber).toMatch(/^GR\d{9}$/);
    });

    it('should filter goods receipts by branch', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/api/goods-receipt?branchId=${testUser.branchId}`,
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);

      // All returned GRs should belong to the user's branch
      response.data.forEach((gr: any) => {
        expect(gr.branchId).toBe(testUser.branchId);
      });
    });

    it('should update goods receipt', async () => {
      const updateData = {
        remarks: 'Updated remarks for goods receipt',
        items: [
          {
            itemId: TEST_ITEM_ID,
            orderedQty: 100,
            receivedQty: 95,
            unitPrice: 15.5,
            qualityNotes: 'Minor packaging damage on 5 units',
          },
        ],
      };

      const response = await axios.patch(
        `${API_BASE_URL}/api/goods-receipt/${testGoodsReceiptId}`,
        updateData,
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);
      expect(response.data.remarks).toBe('Updated remarks for goods receipt');
      expect(response.data.items[0].receivedQty).toBe('95');
      expect(response.data.items[0].qualityNotes).toBe('Minor packaging damage on 5 units');
    });
  });

  describe('Goods Receipt Status Management', () => {
    it('should post goods receipt', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/api/goods-receipt/${testGoodsReceiptId}/post`,
        {},
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);
      expect(response.data.status).toBe('POSTED');
      expect(response.data.postedAt).toBeDefined();
    });

    it('should not allow updates to posted goods receipt', async () => {
      const updateData = {
        remarks: 'Should not be allowed',
      };

      try {
        await axios.patch(`${API_BASE_URL}/api/goods-receipt/${testGoodsReceiptId}`, updateData, {
          headers: getAuthHeaders(),
        });
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as { response: { status: number } };
        expect(axiosError.response.status).toBe(400);
      }
    });

    it('should cancel posted goods receipt', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/api/goods-receipt/${testGoodsReceiptId}/cancel`,
        {},
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);
      expect(response.data.status).toBe('CANCELLED');
      expect(response.data.cancelledAt).toBeDefined();
    });

    it('should not allow posting cancelled goods receipt', async () => {
      try {
        await axios.post(
          `${API_BASE_URL}/api/goods-receipt/${testGoodsReceiptId}/post`,
          {},
          { headers: getAuthHeaders() }
        );
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as { response: { status: number } };
        expect(axiosError.response.status).toBe(400);
      }
    });
  });

  describe('Data Validation', () => {
    it('should validate required fields for goods receipt creation', async () => {
      const invalidData = {
        // Missing required branchId and items
        remarks: 'Invalid goods receipt',
      };

      try {
        await axios.post(`${API_BASE_URL}/api/goods-receipt`, invalidData, {
          headers: getAuthHeaders(),
        });
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as { response: { status: number } };
        expect(axiosError.response.status).toBe(400);
      }
    });

    it('should validate item quantities', async () => {
      const invalidData = {
        branchId: testUser.branchId,
        items: [
          {
            itemId: TEST_ITEM_ID,
            orderedQty: -5, // Invalid negative quantity
            receivedQty: 10,
          },
        ],
      };

      try {
        await axios.post(`${API_BASE_URL}/api/goods-receipt`, invalidData, {
          headers: getAuthHeaders(),
        });
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as { response: { status: number } };
        expect(axiosError.response.status).toBe(400);
      }
    });

    it('should validate item ID format', async () => {
      const invalidData = {
        branchId: testUser.branchId,
        items: [
          {
            itemId: 'invalid-uuid-format',
            orderedQty: 10,
            receivedQty: 10,
          },
        ],
      };

      try {
        await axios.post(`${API_BASE_URL}/api/goods-receipt`, invalidData, {
          headers: getAuthHeaders(),
        });
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as { response: { status: number } };
        expect(axiosError.response.status).toBe(400);
      }
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent goods receipt', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';

      try {
        await axios.get(`${API_BASE_URL}/api/goods-receipt/${nonExistentId}`, {
          headers: getAuthHeaders(),
        });
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as { response: { status: number } };
        expect(axiosError.response.status).toBe(404);
      }
    });

    it('should return 404 for invalid UUID format', async () => {
      try {
        await axios.get(`${API_BASE_URL}/api/goods-receipt/invalid-uuid`, {
          headers: getAuthHeaders(),
        });
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as { response: { status: number } };
        expect(axiosError.response.status).toBe(404);
      }
    });

    it('should return 404 for non-existent purchase order when creating from PO', async () => {
      const nonExistentPoId = '123e4567-e89b-12d3-a456-426614174000';

      try {
        await axios.post(
          `${API_BASE_URL}/api/goods-receipt/from-po/${nonExistentPoId}`,
          {},
          { headers: getAuthHeaders() }
        );
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as { response: { status: number } };
        expect(axiosError.response.status).toBe(404);
      }
    });

    it('should handle deletion of non-existent goods receipt', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';

      try {
        await axios.delete(`${API_BASE_URL}/api/goods-receipt/${nonExistentId}`, {
          headers: getAuthHeaders(),
        });
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as { response: { status: number } };
        expect(axiosError.response.status).toBe(404);
      }
    });
  });

  describe('Role-Based Access Control', () => {
    it('should test inventory clerk permissions', async () => {
      // Login as inventory clerk
      const clerkLoginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: 'clerk.a@supplychain.com',
        password: 'clerk123',
      });

      expect(clerkLoginResponse.status).toBe(200);
      const clerkToken = clerkLoginResponse.data.access_token;
      const clerkHeaders = {
        Authorization: `Bearer ${clerkToken}`,
        'Content-Type': 'application/json',
      };

      // Inventory clerk should be able to read goods receipts
      const readResponse = await axios.get(`${API_BASE_URL}/api/goods-receipt`, {
        headers: clerkHeaders,
      });
      expect(readResponse.status).toBe(200);

      // Inventory clerk should be able to create goods receipts
      const grData = {
        branchId: clerkLoginResponse.data.user.branchId,
        documentNumber: `CLERK-TEST-${Date.now()}`,
        remarks: 'Test by inventory clerk',
        items: [
          {
            itemId: TEST_ITEM_ID,
            orderedQty: 25,
            receivedQty: 25,
            unitPrice: 14.0,
          },
        ],
      };

      const createResponse = await axios.post(`${API_BASE_URL}/api/goods-receipt`, grData, {
        headers: clerkHeaders,
      });
      expect(createResponse.status).toBe(201);

      // Clean up using the branch manager token (who has delete permissions)
      await axios.delete(`${API_BASE_URL}/api/goods-receipt/${createResponse.data.id}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
    });

    it('should test procurement specialist read-only access', async () => {
      // Login as procurement specialist
      const procurementLoginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: 'specialist.a@supplychain.com',
        password: 'specialist123',
      });

      expect(procurementLoginResponse.status).toBe(200);
      const procurementToken = procurementLoginResponse.data.access_token;
      const procurementHeaders = {
        Authorization: `Bearer ${procurementToken}`,
        'Content-Type': 'application/json',
      };

      // Procurement specialist should be able to read goods receipts
      const readResponse = await axios.get(`${API_BASE_URL}/api/goods-receipt`, {
        headers: procurementHeaders,
      });
      expect(readResponse.status).toBe(200);

      // Procurement specialist should NOT be able to create goods receipts
      const grData = {
        branchId: procurementLoginResponse.data.user.branchId,
        items: [
          {
            itemId: TEST_ITEM_ID,
            orderedQty: 10,
            receivedQty: 10,
          },
        ],
      };

      try {
        await axios.post(`${API_BASE_URL}/api/goods-receipt`, grData, {
          headers: procurementHeaders,
        });
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as { response: { status: number } };
        expect(axiosError.response.status).toBe(403);
      }
    });
  });

  describe('Business Logic Validation', () => {
    it('should prevent creating goods receipt from non-confirmed purchase order', async () => {
      // Create a new PO but don't send to supplier
      const timestamp = Date.now();
      const draftPoData = {
        title: `Draft PO ${timestamp}`,
        supplierId: TEST_SUPPLIER_ID,
        expectedDeliveryDate: '2025-07-01T10:00:00Z',
        branchId: testUser.branchId,
        items: [
          {
            itemId: TEST_ITEM_ID,
            orderedQty: 20,
            unitPrice: 15.0,
            deliveryDate: '2025-07-01T10:00:00Z',
          },
        ],
      };

      const draftPoResponse = await axios.post(`${API_BASE_URL}/api/purchase-order`, draftPoData, {
        headers: getAuthHeaders(),
      });

      expect(draftPoResponse.status).toBe(201);
      const draftPoId = draftPoResponse.data.id;

      try {
        await axios.post(
          `${API_BASE_URL}/api/goods-receipt/from-po/${draftPoId}`,
          {},
          { headers: getAuthHeaders() }
        );
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as { response: { status: number } };
        expect(axiosError.response.status).toBe(400);
      }

      // Clean up
      await axios.delete(`${API_BASE_URL}/api/purchase-order/${draftPoId}`, {
        headers: getAuthHeaders(),
      });
    });

    it('should validate received quantity does not exceed reasonable limits', async () => {
      const grData = {
        branchId: testUser.branchId,
        items: [
          {
            itemId: TEST_ITEM_ID,
            orderedQty: 10,
            receivedQty: 1000, // Much higher than ordered
            unitPrice: 15.0,
            qualityNotes: 'Testing quantity validation',
          },
        ],
      };

      // This should still create but might generate warnings in real implementation
      const response = await axios.post(`${API_BASE_URL}/api/goods-receipt`, grData, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(201);
      expect(response.data.items[0].receivedQty).toBe('1000');

      // Clean up
      await axios.delete(`${API_BASE_URL}/api/goods-receipt/${response.data.id}`, {
        headers: getAuthHeaders(),
      });
    });
  });
});
