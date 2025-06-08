import axios from "axios";
import {
  type AxiosErrorResponse,
  TestHelpers,
  type TestUser,
} from "../../support/test-helpers";

describe("Purchase Order Workflow (E2E)", () => {
  const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";
  let authToken: string;
  let testUser: TestUser;
  let TEST_SUPPLIER_ID: string;

  beforeAll(async () => {
    const auth = await TestHelpers.loginAsBranchManager();
    authToken = auth.accessToken;
    testUser = auth.user;

    // Fetch dynamic UUIDs
    TEST_SUPPLIER_ID = await TestHelpers.getTestSupplierId();
  });

  describe("Complete Purchase Order Workflow", () => {
    it("should complete entire workflow: PR creation → PO creation → workflow steps", async () => {
      // Step 1: Create and approve purchase request
      const prId = await TestHelpers.createApprovedPurchaseRequest(
        authToken,
        testUser.branchId,
        {
          title: "E2E Workflow Test PR",
        }
      );

      // Step 2: Create PO from PR
      const poResponse = await axios.post(
        `${API_BASE_URL}/api/purchase-order/create-from-pr/${prId}`,
        { supplierId: TEST_SUPPLIER_ID },
        { headers: TestHelpers.getAuthHeaders(authToken) }
      );

      expect(poResponse.status).toBe(201);
      const po = poResponse.data;
      expect(po.status).toBe("DRAFT");

      // Step 3: Execute workflow steps
      const finalPO = await TestHelpers.executePOWorkflow(authToken, po.id, [
        "send",
        "confirm",
        "close",
      ]);

      expect(finalPO.status).toBe("CLOSED");
      expect(finalPO.sentToSupplierAt).toBeDefined();
      expect(finalPO.confirmedAt).toBeDefined();
      expect(finalPO.closedAt).toBeDefined();
    });

    it("should handle standalone purchase order creation and workflow", async () => {
      // Create standalone PO
      const po = await TestHelpers.createPurchaseOrder(
        authToken,
        testUser.branchId,
        {
          title: "Standalone E2E Workflow Test",
        }
      );

      expect(po.status).toBe("DRAFT");

      // Execute partial workflow
      const sentPO = await TestHelpers.executePOWorkflow(authToken, po.id, [
        "send",
        "confirm",
      ]);

      expect(sentPO.status).toBe("CONFIRMED");
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle invalid purchase request ID for PO creation", async () => {
      const invalidPrId = "123e4567-e89b-12d3-a456-426614174000";

      try {
        await axios.post(
          `${API_BASE_URL}/api/purchase-order/create-from-pr/${invalidPrId}`,
          { supplierId: TestHelpers.TEST_SUPPLIER_ID },
          { headers: TestHelpers.getAuthHeaders(authToken) }
        );
        fail("Should have thrown an error");
      } catch (error) {
        const axiosError = error as AxiosErrorResponse;
        expect([400, 404]).toContain(axiosError.response.status);
      }
    });

    it("should prevent unauthorized access", async () => {
      try {
        await axios.get(`${API_BASE_URL}/api/purchase-order`);
        fail("Should have thrown an error");
      } catch (error) {
        const axiosError = error as AxiosErrorResponse;
        expect(axiosError.response.status).toBe(401);
      }
    });
  });

  describe("Performance and Load", () => {
    it("should handle multiple concurrent requests", async () => {
      const promises = Array.from({ length: 5 }, async (_, index) => {
        return TestHelpers.createPurchaseOrder(authToken, testUser.branchId, {
          title: `Concurrent PO ${index}`,
        });
      });

      const results = await Promise.all(promises);

      expect(results.length).toBe(5);
      results.forEach((po, index) => {
        expect(po).toMatchObject({
          id: expect.any(String),
          poNumber: expect.stringMatching(/^PO\d{9}$/),
          title: `Concurrent PO ${index}`,
          status: "DRAFT",
        });
      });
    });
  });
});
