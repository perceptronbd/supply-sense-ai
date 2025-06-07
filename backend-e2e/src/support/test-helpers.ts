import axios from 'axios';

export interface TestUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  branchId: string;
}

export interface AuthTokens {
  accessToken: string;
  user: TestUser;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: string;
  branchId: string;
  totalAmount: string;
  supplier: {
    id: string;
    name: string;
  };
  items: Array<{
    itemId: string;
    orderedQty: string;
    unitPrice: string;
  }>;
}

export interface AxiosErrorResponse {
  response: { status: number; data?: unknown };
}

export interface PurchaseRequestItem {
  itemId: string;
  requestedQty: number;
  estimatedPrice: number;
  requiredDate: string;
  remarks?: string;
}

export interface PurchaseOrderItem {
  itemId: string;
  orderedQty: number;
  unitPrice: number;
  deliveryDate: string;
  remarks?: string;
}

export interface PurchaseRequestData {
  title?: string;
  description?: string;
  requiredDate?: string;
  branchId: string;
  justification?: string;
  items?: PurchaseRequestItem[];
}

export interface PurchaseOrderData {
  title?: string;
  supplierId: string;
  expectedDeliveryDate?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  branchId: string;
  notes?: string;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderResponse {
  id: string;
  status: string;
  title: string;
  supplierId: string;
  expectedDeliveryDate: string;
  paymentTerms: string;
  deliveryTerms: string;
  branchId: string;
  notes?: string;
  items?: PurchaseOrderItem[];
  sentToSupplierAt?: string;
  confirmedAt?: string;
  closedAt?: string;
}

export class TestHelpers {
  private static readonly API_BASE_URL =
    process.env.API_BASE_URL || 'http://localhost:3000';
  // Test data constants from seed files - updated with actual supplier IDs
  static readonly TEST_ITEM_ID = 'b32dd8ee-475e-47da-8bc8-990b7f8aada6';
  static readonly TEST_SUPPLIERS = {
    'ACME Corp': '8f5c1e3a-2b9d-4c7f-8e1a-3f4c5b6d7e8f',
    'Global Materials Inc': '2a1b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
    'Chemical Solutions Ltd': '5bcd37fa-1b10-4ae0-accc-44c7b5760c7f',
    'Industrial Supplies Co': 'f2e8d9c5-b4a1-3c7f-9e6d-8b2a5c4e7f1g',
    'TechComponents Pro': 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6',
  };
  static readonly TEST_SUPPLIER_ID =
    TestHelpers.TEST_SUPPLIERS['Chemical Solutions Ltd'];

  /**
   * Login as branch manager for testing
   */
  static async loginAsBranchManager(): Promise<AuthTokens> {
    const response = await axios.post(`${this.API_BASE_URL}/api/auth/login`, {
      email: 'manager.a@supplychain.com',
      password: 'manager123',
    });

    return {
      accessToken: response.data.access_token,
      user: response.data.user,
    };
  }

  /**
   * Login as procurement specialist for testing
   */
  static async loginAsProcurementSpecialist(): Promise<AuthTokens> {
    const response = await axios.post(`${this.API_BASE_URL}/api/auth/login`, {
      email: 'specialist.a@supplychain.com',
      password: 'specialist123',
    });

    return {
      accessToken: response.data.access_token,
      user: response.data.user,
    };
  }

  /**
   * Get authentication headers for API requests
   */
  static getAuthHeaders(token: string) {
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }
  /**
   * Create a complete purchase request workflow (create, submit, approve)
   */ static async createApprovedPurchaseRequest(
    authToken: string,
    branchId: string,
    overrides: Partial<PurchaseRequestData> = {}
  ): Promise<string> {
    const timestamp = Date.now();
    const prData = {
      title: `Test PR for E2E Testing ${timestamp}`,
      description: 'Testing PR workflow in E2E tests',
      requiredDate: '2025-06-20T10:00:00Z',
      branchId,
      justification: 'Required for E2E testing',
      items: [
        {
          itemId: this.TEST_ITEM_ID,
          requestedQty: 50,
          estimatedPrice: 15.0,
          requiredDate: '2025-06-20T10:00:00Z',
          remarks: 'Test item for E2E',
        },
      ],
      ...overrides,
    };

    // Create PR
    const prResponse = await axios.post(
      `${this.API_BASE_URL}/api/purchase-request`,
      prData,
      { headers: this.getAuthHeaders(authToken) }
    );

    const prId = prResponse.data.id;

    // Submit PR
    await axios.post(
      `${this.API_BASE_URL}/api/purchase-request/${prId}/submit`,
      {},
      { headers: this.getAuthHeaders(authToken) }
    );

    // Approve PR
    await axios.post(
      `${this.API_BASE_URL}/api/purchase-request/${prId}/approve`,
      {},
      { headers: this.getAuthHeaders(authToken) }
    );

    return prId;
  }
  /**
   * Create a basic purchase order
   */ static async createPurchaseOrder(
    authToken: string,
    branchId: string,
    overrides: Partial<PurchaseOrderData> = {}
  ): Promise<PurchaseOrderResponse> {
    const timestamp = Date.now();
    const poData = {
      title: `Test Purchase Order E2E ${timestamp}`,
      supplierId: this.TEST_SUPPLIER_ID,
      expectedDeliveryDate: '2025-07-01T10:00:00Z',
      paymentTerms: 'Net 30 days',
      deliveryTerms: 'FOB Origin',
      branchId,
      notes: 'Testing PO creation in E2E',
      items: [
        {
          itemId: this.TEST_ITEM_ID,
          orderedQty: 25,
          unitPrice: 18.5,
          deliveryDate: '2025-07-01T10:00:00Z',
          remarks: 'E2E test item',
        },
      ],
      ...overrides,
    };

    const response = await axios.post(
      `${this.API_BASE_URL}/api/purchase-order`,
      poData,
      { headers: this.getAuthHeaders(authToken) }
    );

    return response.data;
  }
  /**
   * Execute purchase order workflow steps
   */ static async executePOWorkflow(
    authToken: string,
    poId: string,
    steps: ('send' | 'confirm' | 'close')[]
  ): Promise<PurchaseOrderResponse | undefined> {
    for (const step of steps) {
      switch (step) {
        case 'send':
          await axios.post(
            `${this.API_BASE_URL}/api/purchase-order/${poId}/send-to-supplier`,
            {},
            { headers: this.getAuthHeaders(authToken) }
          );
          break;
        case 'confirm':
          await axios.post(
            `${this.API_BASE_URL}/api/purchase-order/${poId}/confirm`,
            {},
            { headers: this.getAuthHeaders(authToken) }
          );
          break;
        case 'close':
          await axios.post(
            `${this.API_BASE_URL}/api/purchase-order/${poId}/close`,
            {},
            { headers: this.getAuthHeaders(authToken) }
          );
          break;
      }
    }

    // Get the updated purchase order after all workflow steps
    const response = await axios.get(
      `${this.API_BASE_URL}/api/purchase-order/${poId}`,
      { headers: this.getAuthHeaders(authToken) }
    );

    return response.data;
  }
  /**
   * Clean up test data (if needed)
   * Currently not implemented as we rely on database cleanup between test runs
   */
  static async cleanupTestData(): Promise<void> {
    // Implementation would depend on whether delete endpoints exist
    // For now, we rely on database cleanup between test runs
    // Future: Add actual cleanup logic if needed
  }

  /**
   * Wait for async operations to complete
   */
  static async waitFor(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Generate test data with unique identifiers
   */
  static generateTestData(suffix: string) {
    return {
      title: `Test Entity ${suffix}`,
      description: `Generated test data for E2E testing - ${suffix}`,
      timestamp: new Date().toISOString(),
    };
  }
}
