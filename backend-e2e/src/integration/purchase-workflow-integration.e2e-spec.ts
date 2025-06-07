import axios from 'axios';
import { type AxiosErrorResponse, TestHelpers, type TestUser } from '../support/test-helpers';

describe('Purchase Workflow Integration (E2E)', () => {
  const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
  let authToken: string;
  let testUser: TestUser;

  // Test data from seed files
  const TEST_ITEM_ID = 'b32dd8ee-475e-47da-8bc8-990b7f8aada6';
  const TEST_SUPPLIER_ID = '5bcd37fa-1b10-4ae0-accc-44c7b5760c7f';

  beforeAll(async () => {
    const auth = await TestHelpers.loginAsBranchManager();
    authToken = auth.accessToken;
    testUser = auth.user;
  });

  describe('Complete Purchase Workflow Integration', () => {
    it('should complete entire end-to-end purchase workflow', async () => {
      const timestamp = Date.now(); // Step 1: Create Purchase Request
      const prId = await TestHelpers.createApprovedPurchaseRequest(authToken, testUser.branchId, {
        title: `Integration Test PR ${timestamp}`,
      });
      expect(prId).toBeDefined(); // Step 2: Create Purchase Order from PR
      const poResponse = await axios.post(
        `${API_BASE_URL}/api/purchase-order/create-from-pr/${prId}`,
        { supplierId: TEST_SUPPLIER_ID },
        { headers: TestHelpers.getAuthHeaders(authToken) }
      );
      expect(poResponse.status).toBe(201);
      const poId = poResponse.data.id; // Step 3: Execute complete PO workflow
      const finalPO = await TestHelpers.executePOWorkflow(authToken, poId, [
        'send',
        'confirm',
        'close',
      ]);

      expect(finalPO).toMatchObject({
        id: poId,
        status: 'CLOSED',
        poNumber: expect.stringMatching(/^PO\d{9}$/),
        supplier: expect.objectContaining({
          id: TEST_SUPPLIER_ID,
        }),
        items: expect.arrayContaining([
          expect.objectContaining({
            itemId: TEST_ITEM_ID,
          }),
        ]),
      });
    });
    it('should handle workflow validation across modules', async () => {
      const timestamp = Date.now() + 1;

      // Test that we can't create PO from non-approved PR
      // First create a regular (non-approved) purchase request
      const prResponse = await axios.post(
        `${API_BASE_URL}/api/purchase-request`,
        {
          title: `Non-approved PR ${timestamp}`,
          description: 'Test PR for validation',
          justification: 'Testing workflow validation',
          branchId: testUser.branchId,
          requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          items: [
            {
              itemId: TEST_ITEM_ID,
              requestedQty: 5,
              estimatedPrice: 100,
              requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              remarks: 'Test item',
            },
          ],
        },
        { headers: TestHelpers.getAuthHeaders(authToken) }
      );

      expect(prResponse.status).toBe(201);
      const prId = prResponse.data.id;

      try {
        await axios.post(
          `${API_BASE_URL}/api/purchase-order/create-from-pr/${prId}`,
          { supplierId: TEST_SUPPLIER_ID },
          { headers: TestHelpers.getAuthHeaders(authToken) }
        );
        fail('Should have thrown an error');
      } catch (error) {
        const axiosError = error as AxiosErrorResponse;
        expect(axiosError.response?.status).toBe(400);
      }
    });
  });
});
