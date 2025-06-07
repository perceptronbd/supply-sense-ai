import axios from "axios";
import {
  TestUser,
  PurchaseOrder,
  AxiosErrorResponse,
} from "../support/test-helpers";

describe("Purchase Order API (E2E)", () => {
  const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";
  let authToken: string;
  let testUser: TestUser;
  let testPurchaseRequestId: string;
  let testPurchaseOrderId: string;
  // Test data from seed files
  const TEST_ITEM_ID = "b32dd8ee-475e-47da-8bc8-990b7f8aada6";
  const TEST_SUPPLIER_ID = "5bcd37fa-1b10-4ae0-accc-44c7b5760c7f";

  beforeAll(async () => {
    // Login as branch manager for testing
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: "manager.a@supplychain.com",
      password: "manager123",
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.data.access_token).toBeDefined();

    authToken = loginResponse.data.access_token;
    testUser = loginResponse.data.user;
  });

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${authToken}`,
    "Content-Type": "application/json",
  });

  describe("Authentication", () => {
    it("should have valid authentication token", () => {
      expect(authToken).toBeDefined();
      expect(testUser).toBeDefined();
      expect(testUser.role).toBe("BRANCH_MANAGER");
    });

    it("should reject requests without authentication", async () => {
      try {
        await axios.get(`${API_BASE_URL}/api/purchase-order`);
        fail("Should have thrown an error");
      } catch (error) {
        const axiosError = error as AxiosErrorResponse;
        expect(axiosError.response.status).toBe(401);
      }
    });
  });

  describe("Purchase Order Creation from Purchase Request", () => {
    beforeAll(async () => {
      // Create a purchase request first
      const prData = {
        title: "Test PR for PO Creation E2E",
        description: "Testing PR to PO conversion workflow in E2E tests",
        requiredDate: "2025-06-20T10:00:00Z",
        branchId: testUser.branchId,
        justification: "Required for E2E testing workflow",
        items: [
          {
            itemId: TEST_ITEM_ID,
            requestedQty: 50,
            estimatedPrice: 15.0,
            requiredDate: "2025-06-20T10:00:00Z",
            remarks: "Test item for PO creation",
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

      // Submit the purchase request
      await axios.post(
        `${API_BASE_URL}/api/purchase-request/${testPurchaseRequestId}/submit`,
        {},
        { headers: getAuthHeaders() }
      );

      // Approve the purchase request
      await axios.post(
        `${API_BASE_URL}/api/purchase-request/${testPurchaseRequestId}/approve`,
        {},
        { headers: getAuthHeaders() }
      );
    });

    it("should create purchase order from approved purchase request", async () => {
      const poData = {
        supplierId: TEST_SUPPLIER_ID,
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/purchase-order/create-from-pr/${testPurchaseRequestId}`,
        poData,
        { headers: getAuthHeaders() }
      );
      expect(response.status).toBe(201);
      expect(response.data).toMatchObject({
        id: expect.any(String),
        poNumber: expect.stringMatching(/^PO\d{9}$/),
        status: "DRAFT",
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

      testPurchaseOrderId = response.data.id;
    });

    it("should fail to create PO from non-approved purchase request", async () => {
      // Create another PR but don't approve it
      const prData = {
        title: "Non-approved PR",
        description: "Testing rejection case",
        requiredDate: "2025-06-20T10:00:00Z",
        branchId: testUser.branchId,
        justification: "Testing rejection",
        items: [
          {
            itemId: TEST_ITEM_ID,
            requestedQty: 10,
            estimatedPrice: 15.0,
            requiredDate: "2025-06-20T10:00:00Z",
            remarks: "Test item",
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
        fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });
  });

  describe("Purchase Order CRUD Operations", () => {
    it("should get all purchase orders", async () => {
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

    it("should get specific purchase order by ID", async () => {
      const response = await axios.get(
        `${API_BASE_URL}/api/purchase-order/${testPurchaseOrderId}`,
        { headers: getAuthHeaders() }
      );
      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        id: testPurchaseOrderId,
        poNumber: expect.stringMatching(/^PO\d{9}$/),
        status: "DRAFT",
        supplier: expect.any(Object),
        items: expect.any(Array),
      });
    });

    it("should filter purchase orders by branch", async () => {
      const response = await axios.get(
        `${API_BASE_URL}/api/purchase-order?branchId=${testUser.branchId}`,
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);

      // All returned POs should belong to the user's branch
      response.data.forEach((po: any) => {
        expect(po.branchId).toBe(testUser.branchId);
      });
    });

    it("should create standalone purchase order", async () => {
      const standalonePOData = {
        title: "Standalone Purchase Order E2E Test",
        supplierId: TEST_SUPPLIER_ID,
        expectedDeliveryDate: "2025-07-01T10:00:00Z",
        paymentTerms: "Net 30 days",
        deliveryTerms: "FOB Origin",
        branchId: testUser.branchId,
        notes: "Testing standalone PO creation in E2E",
        items: [
          {
            itemId: TEST_ITEM_ID,
            orderedQty: 25,
            unitPrice: 18.5,
            deliveryDate: "2025-07-01T10:00:00Z",
            remarks: "Standalone PO test item",
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
        status: "DRAFT",
        title: "Standalone Purchase Order E2E Test",
        totalAmount: 462.5, // 25 * 18.50
        supplier: expect.objectContaining({
          id: TEST_SUPPLIER_ID,
        }),
      });
    });
  });

  describe("Purchase Order Workflow", () => {
    it("should send purchase order to supplier", async () => {
      const response = await axios.post(
        `${API_BASE_URL}/api/purchase-order/${testPurchaseOrderId}/send-to-supplier`,
        {},
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);
      expect(response.data.status).toBe("SENT_TO_SUPPLIER");
      expect(response.data.sentToSupplierAt).toBeDefined();
    });

    it("should confirm purchase order", async () => {
      const response = await axios.post(
        `${API_BASE_URL}/api/purchase-order/${testPurchaseOrderId}/confirm`,
        {},
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);
      expect(response.data.status).toBe("CONFIRMED");
      expect(response.data.confirmedAt).toBeDefined();
    });

    it("should close purchase order", async () => {
      const response = await axios.post(
        `${API_BASE_URL}/api/purchase-order/${testPurchaseOrderId}/close`,
        {},
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);
      expect(response.data.status).toBe("CLOSED");
      expect(response.data.closedAt).toBeDefined();
    });

    it("should not allow invalid status transitions", async () => {
      // Try to send an already closed PO to supplier
      try {
        await axios.post(
          `${API_BASE_URL}/api/purchase-order/${testPurchaseOrderId}/send-to-supplier`,
          {},
          { headers: getAuthHeaders() }
        );
        fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });
  });

  describe("Authorization and Role-based Access", () => {
    let regularUserToken: string;

    beforeAll(async () => {
      // Login as a regular user (not manager) if available
      try {
        const loginResponse = await axios.post(
          `${API_BASE_URL}/api/auth/login`,
          {
            email: "user.a@supplychain.com",
            password: "user123",
          }
        );
        regularUserToken = loginResponse.data.access_token;
      } catch (error) {
        // If regular user doesn't exist, skip role-based tests
        regularUserToken = "";
      }
    });

    it("should allow branch managers to create purchase orders", async () => {
      const poData = {
        title: "Manager Created PO",
        supplierId: TEST_SUPPLIER_ID,
        expectedDeliveryDate: "2025-07-01T10:00:00Z",
        branchId: testUser.branchId,
        items: [
          {
            itemId: TEST_ITEM_ID,
            orderedQty: 10,
            unitPrice: 20.0,
            deliveryDate: "2025-07-01T10:00:00Z",
          },
        ],
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/purchase-order`,
        poData,
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(201);
    });

    it("should handle invalid purchase order ID gracefully", async () => {
      try {
        await axios.get(`${API_BASE_URL}/api/purchase-order/invalid-uuid`, {
          headers: getAuthHeaders(),
        });
        fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    it("should handle non-existent purchase order ID", async () => {
      const nonExistentId = "123e4567-e89b-12d3-a456-426614174000";
      try {
        await axios.get(`${API_BASE_URL}/api/purchase-order/${nonExistentId}`, {
          headers: getAuthHeaders(),
        });
        fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });
  });

  describe("Data Validation", () => {
    it("should validate required fields when creating purchase order", async () => {
      const invalidPOData = {
        // Missing required fields
        title: "Invalid PO",
      };

      try {
        await axios.post(`${API_BASE_URL}/api/purchase-order`, invalidPOData, {
          headers: getAuthHeaders(),
        });
        fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    it("should validate item data in purchase order", async () => {
      const invalidItemPOData = {
        title: "PO with Invalid Items",
        supplierId: TEST_SUPPLIER_ID,
        branchId: testUser.branchId,
        items: [
          {
            // Missing required fields
            itemId: TEST_ITEM_ID,
            orderedQty: -5, // Invalid negative quantity
          },
        ],
      };

      try {
        await axios.post(
          `${API_BASE_URL}/api/purchase-order`,
          invalidItemPOData,
          { headers: getAuthHeaders() }
        );
        fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    it("should validate supplier existence", async () => {
      const invalidSupplierPOData = {
        title: "PO with Invalid Supplier",
        supplierId: "123e4567-e89b-12d3-a456-426614174000", // Non-existent supplier
        branchId: testUser.branchId,
        items: [
          {
            itemId: TEST_ITEM_ID,
            orderedQty: 10,
            unitPrice: 20.0,
            deliveryDate: "2025-07-01T10:00:00Z",
          },
        ],
      };

      try {
        await axios.post(
          `${API_BASE_URL}/api/purchase-order`,
          invalidSupplierPOData,
          { headers: getAuthHeaders() }
        );
        fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });
  });
});
