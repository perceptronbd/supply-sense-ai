import axios from 'axios';
import { TestUser, PurchaseOrder } from '../../support/test-helpers';

describe('Purchase Order API (E2E)', () => {
  const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
  let authToken: string;
  let testUser: TestUser;
  let testPurchaseRequestId: string;
  let testPurchaseOrderId: string;

  // Test data from seed files
  const TEST_ITEM_ID = 'b32dd8ee-475e-47da-8bc8-990b7f8aada6';
  const TEST_SUPPLIER_ID = '5bcd37fa-1b10-4ae0-accc-44c7b5760c7f';

  beforeAll(async () => {
    // Login as branch manager for testing
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'manager.a@supplychain.com',
      password: 'manager123',
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.data.access_token).toBeDefined();

    authToken = loginResponse.data.access_token;
    testUser = loginResponse.data.user;

    // Create a purchase request and PO for testing
    const timestamp = Date.now();
    const prData = {
      title: `Test PR for PO Creation E2E ${timestamp}`,
      description: 'Testing PR to PO conversion workflow in E2E tests',
      requiredDate: '2025-06-20T10:00:00Z',
      branchId: testUser.branchId,
      justification: 'Required for E2E testing workflow',
      items: [
        {
          itemId: TEST_ITEM_ID,
          requestedQty: 50,
          estimatedPrice: 15.0,
          requiredDate: '2025-06-20T10:00:00Z',
          remarks: 'Test item for PO creation',
        },
      ],
    };

    const prResponse = await axios.post(
      `${API_BASE_URL}/api/purchase-request`,
      prData,
      { headers: getAuthHeaders() }
    );

    expect(prResponse.status).toBe(201);
    testPurchaseRequestId = prResponse.data.id;

    // Submit and approve the purchase request
    await axios.post(
      `${API_BASE_URL}/api/purchase-request/${testPurchaseRequestId}/submit`,
      {},
      { headers: getAuthHeaders() }
    );

    await axios.post(
      `${API_BASE_URL}/api/purchase-request/${testPurchaseRequestId}/approve`,
      {},
      { headers: getAuthHeaders() }
    );

    // Create PO from the approved PR
    const poData = {
      supplierId: TEST_SUPPLIER_ID,
    };

    const poResponse = await axios.post(
      `${API_BASE_URL}/api/purchase-order/create-from-pr/${testPurchaseRequestId}`,
      poData,
      { headers: getAuthHeaders() }
    );

    expect(poResponse.status).toBe(201);
    testPurchaseOrderId = poResponse.data.id;
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
        await axios.get(`${API_BASE_URL}/api/purchase-order`);
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as { response: { status: number } };
        expect(axiosError.response.status).toBe(401);
      }
    });
  });

  describe('Purchase Order Creation from Purchase Request', () => {
    it('should have created purchase order from approved purchase request', async () => {
      // Verify the PO was created properly in beforeAll
      expect(testPurchaseOrderId).toBeDefined();

      const response = await axios.get(
        `${API_BASE_URL}/api/purchase-order/${testPurchaseOrderId}`,
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        id: expect.any(String),
        poNumber: expect.stringMatching(/^PO\d{9}$/),
        status: 'DRAFT',
        totalAmount: expect.any(String), // API returns string
        supplier: expect.objectContaining({
          id: TEST_SUPPLIER_ID,
          name: expect.any(String),
        }),
        items: expect.arrayContaining([
          expect.objectContaining({
            itemId: TEST_ITEM_ID,
            orderedQty: expect.any(String), // API returns string
            unitPrice: expect.any(String), // API returns string
          }),
        ]),
      });
    });

    it('should fail to create PO from non-approved purchase request', async () => {
      // Create another PR but don't approve it
      const timestamp2 = Date.now() + 1;
      const prData = {
        title: `Non-approved PR ${timestamp2}`,
        description: 'Testing rejection case',
        requiredDate: '2025-06-20T10:00:00Z',
        branchId: testUser.branchId,
        justification: 'Testing rejection',
        items: [
          {
            itemId: TEST_ITEM_ID,
            requestedQty: 10,
            estimatedPrice: 15.0,
            requiredDate: '2025-06-20T10:00:00Z',
            remarks: 'Test item',
          },
        ],
      };

      const prResponse = await axios.post(
        `${API_BASE_URL}/api/purchase-request`,
        prData,
        { headers: getAuthHeaders() }
      );

      const nonApprovedPrId = prResponse.data.id;

      try {
        await axios.post(
          `${API_BASE_URL}/api/purchase-order/create-from-pr/${nonApprovedPrId}`,
          { supplierId: TEST_SUPPLIER_ID },
          { headers: getAuthHeaders() }
        );
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as { response: { status: number } };
        expect(axiosError.response.status).toBe(400);
      }
    });
  });

  describe('Purchase Order CRUD Operations', () => {
    it('should get all purchase orders', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/purchase-order`, {
        headers: getAuthHeaders(),
      });
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);

      const createdPO = response.data.find(
        (po: PurchaseOrder) => po.id === testPurchaseOrderId
      );
      expect(createdPO).toBeDefined();
    });

    it('should get specific purchase order by ID', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/api/purchase-order/${testPurchaseOrderId}`,
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        id: testPurchaseOrderId,
        poNumber: expect.stringMatching(/^PO\d{9}$/),
        status: 'DRAFT',
        supplier: expect.any(Object),
        items: expect.any(Array),
      });
    });

    it('should filter purchase orders by branch', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/api/purchase-order?branchId=${testUser.branchId}`,
        { headers: getAuthHeaders() }
      );
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);

      // All returned POs should belong to the user's branch
      response.data.forEach((po: PurchaseOrder) => {
        expect(po.branchId).toBe(testUser.branchId);
      });
    });

    it('should create standalone purchase order', async () => {
      const timestamp3 = Date.now() + 2;
      const standalonePOData = {
        title: `Standalone Purchase Order E2E Test ${timestamp3}`,
        supplierId: TEST_SUPPLIER_ID,
        expectedDeliveryDate: '2025-07-01T10:00:00Z',
        paymentTerms: 'Net 30 days',
        deliveryTerms: 'FOB Origin',
        branchId: testUser.branchId,
        notes: 'Testing standalone PO creation in E2E',
        items: [
          {
            itemId: TEST_ITEM_ID,
            orderedQty: 25,
            unitPrice: 18.5,
            deliveryDate: '2025-07-01T10:00:00Z',
            remarks: 'Standalone PO test item',
          },
        ],
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/purchase-order`,
        standalonePOData,
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(201);
      expect(response.data).toMatchObject({
        id: expect.any(String),
        poNumber: expect.stringMatching(/^PO\d{9}$/),
        status: 'DRAFT',
        title: expect.stringContaining('Standalone Purchase Order E2E Test'),
        totalAmount: expect.any(String), // API returns string
        supplier: expect.objectContaining({
          id: TEST_SUPPLIER_ID,
        }),
      });
    });
  });

  describe('Purchase Order Workflow', () => {
    it('should send purchase order to supplier', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/api/purchase-order/${testPurchaseOrderId}/send-to-supplier`,
        {},
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);
      expect(response.data.status).toBe('SENT_TO_SUPPLIER');
      expect(response.data.sentToSupplierAt).toBeDefined();
    });

    it('should confirm purchase order', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/api/purchase-order/${testPurchaseOrderId}/confirm`,
        {},
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);
      expect(response.data.status).toBe('CONFIRMED');
      expect(response.data.confirmedAt).toBeDefined();
    });

    it('should close purchase order', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/api/purchase-order/${testPurchaseOrderId}/close`,
        {},
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);
      expect(response.data.status).toBe('CLOSED');
      expect(response.data.closedAt).toBeDefined();
    });

    it('should not allow invalid status transitions', async () => {
      // Try to send a closed purchase order to supplier (should fail)
      try {
        await axios.post(
          `${API_BASE_URL}/api/purchase-order/${testPurchaseOrderId}/send-to-supplier`,
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

  describe('Error Handling', () => {
    it('should return 404 for non-existent purchase order', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';

      try {
        await axios.get(`${API_BASE_URL}/api/purchase-order/${nonExistentId}`, {
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
        await axios.get(`${API_BASE_URL}/api/purchase-order/invalid-uuid`, {
          headers: getAuthHeaders(),
        });
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as { response: { status: number } };
        expect(axiosError.response.status).toBe(404);
      }
    });
  });
});
