import { PrismaClient } from '@prisma/client';
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

export interface GoodsReceiptItem {
  itemId: string;
  orderedQty: string;
  receivedQty: string;
  unitPrice?: string;
  qualityNotes?: string;
}

export interface GoodsReceipt {
  id: string;
  grNumber: string;
  status: string;
  branchId: string;
  poId?: string;
  mrId?: string;
  documentNumber?: string;
  receiptDate?: string;
  remarks?: string;
  items: GoodsReceiptItem[];
  postedAt?: string;
  cancelledAt?: string;
  branch?: {
    id: string;
    name: string;
  };
}

export interface GoodsReceiptData {
  poId?: string;
  mrId?: string;
  receiptDate?: string;
  documentNumber?: string;
  branchId: string;
  remarks?: string;
  items: {
    itemId: string;
    orderedQty: number;
    receivedQty: number;
    unitPrice?: number;
    qualityNotes?: string;
  }[];
}

interface TestUUIDs {
  itemId: string;
  supplierId: string;
  branchId: string;
  users: {
    branchManager: string;
    procurementSpecialist: string;
    inventoryClerk: string;
  };
}

// Cache for UUIDs to avoid repeated database calls
let cachedUUIDs: TestUUIDs | null = null;

export class TestHelpers {
  private static readonly API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

  // Cache for UUIDs to avoid repeated database calls
  private static cachedUUIDs: {
    itemId?: string;
    supplierId?: string;
    branchId?: string;
  } = {};

  /**
   * Dynamically fetch a valid item ID from the database
   */
  static async getTestItemId(): Promise<string> {
    if (TestHelpers.cachedUUIDs.itemId) {
      return TestHelpers.cachedUUIDs.itemId;
    }

    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    try {
      const item = await prisma.item.findFirst({
        select: { id: true },
      });

      if (!item) {
        throw new Error('No items found in database for testing');
      }

      TestHelpers.cachedUUIDs.itemId = item.id;
      return item.id;
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Dynamically fetch a valid supplier ID from the database
   */
  static async getTestSupplierId(): Promise<string> {
    if (TestHelpers.cachedUUIDs.supplierId) {
      return TestHelpers.cachedUUIDs.supplierId;
    }

    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    try {
      const supplier = await prisma.supplier.findFirst({
        select: { id: true },
      });

      if (!supplier) {
        throw new Error('No suppliers found in database for testing');
      }

      TestHelpers.cachedUUIDs.supplierId = supplier.id;
      return supplier.id;
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Dynamically fetch a valid branch ID from the database
   */
  static async getTestBranchId(): Promise<string> {
    if (TestHelpers.cachedUUIDs.branchId) {
      return TestHelpers.cachedUUIDs.branchId;
    }

    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    try {
      const branch = await prisma.branch.findFirst({
        select: { id: true },
      });

      if (!branch) {
        throw new Error('No branches found in database for testing');
      }

      TestHelpers.cachedUUIDs.branchId = branch.id;
      return branch.id;
    } finally {
      await prisma.$disconnect();
    }
  }

  // Legacy constants for backwards compatibility - will be deprecated
  static readonly TEST_ITEM_ID = 'b32dd8ee-475e-47da-8bc8-990b7f8aada6';
  static readonly TEST_SUPPLIERS = {
    'ACME Corp': '8f5c1e3a-2b9d-4c7f-8e1a-3f4c5b6d7e8f',
    'Global Materials Inc': '2a1b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
    'Chemical Solutions Ltd': '5bcd37fa-1b10-4ae0-accc-44c7b5760c7f',
    'Industrial Supplies Co': 'f2e8d9c5-b4a1-3c7f-9e6d-8b2a5c4e7f1g',
    'TechComponents Pro': 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6',
  };
  static readonly TEST_SUPPLIER_ID = TestHelpers.TEST_SUPPLIERS['Chemical Solutions Ltd'];

  /**
   * Login as branch manager for testing
   */
  static async loginAsBranchManager(): Promise<AuthTokens> {
    const response = await axios.post(`${TestHelpers.API_BASE_URL}/api/auth/login`, {
      email: 'manager.a@supplychain.com',
      password: 'manager123',
    });

    return {
      accessToken: response.data.data.access_token,
      user: response.data.data.user,
    };
  }

  /**
   * Login as system admin for testing
   */
  static async loginAsSystemAdmin(): Promise<AuthTokens> {
    const response = await axios.post(`${TestHelpers.API_BASE_URL}/api/auth/login`, {
      email: 'admin@supplychain.com',
      password: 'admin123',
    });

    return {
      accessToken: response.data.data.access_token,
      user: response.data.data.user,
    };
  }

  /**
   * Login as procurement specialist for testing
   */
  static async loginAsProcurementSpecialist(): Promise<AuthTokens> {
    const response = await axios.post(`${TestHelpers.API_BASE_URL}/api/auth/login`, {
      email: 'specialist.a@supplychain.com',
      password: 'specialist123',
    });

    return {
      accessToken: response.data.data.access_token,
      user: response.data.data.user,
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
   */
  static async createApprovedPurchaseRequest(
    authToken: string,
    branchId: string,
    overrides: Partial<PurchaseRequestData> = {}
  ): Promise<string> {
    const timestamp = Date.now();
    const itemId = await TestHelpers.getTestItemId();

    const prData = {
      title: `Test PR for E2E Testing ${timestamp}`,
      description: 'Testing PR workflow in E2E tests',
      requiredDate: '2025-06-20T10:00:00Z',
      branchId,
      justification: 'Required for E2E testing',
      items: [
        {
          itemId,
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
      `${TestHelpers.API_BASE_URL}/api/purchase-request`,
      prData,
      {
        headers: TestHelpers.getAuthHeaders(authToken),
      }
    );

    const prId = prResponse.data.id;

    // Submit PR
    await axios.post(
      `${TestHelpers.API_BASE_URL}/api/purchase-request/${prId}/submit`,
      {},
      { headers: TestHelpers.getAuthHeaders(authToken) }
    );

    // Approve PR
    await axios.post(
      `${TestHelpers.API_BASE_URL}/api/purchase-request/${prId}/approve`,
      {},
      { headers: TestHelpers.getAuthHeaders(authToken) }
    );

    return prId;
  }
  /**
   * Create a basic purchase order
   */
  static async createPurchaseOrder(
    authToken: string,
    branchId: string,
    overrides: Partial<PurchaseOrderData> = {}
  ): Promise<PurchaseOrderResponse> {
    const timestamp = Date.now();
    const itemId = await TestHelpers.getTestItemId();
    const supplierId = await TestHelpers.getTestSupplierId();

    const poData = {
      title: `Test Purchase Order E2E ${timestamp}`,
      supplierId,
      expectedDeliveryDate: '2025-07-01T10:00:00Z',
      paymentTerms: 'Net 30 days',
      deliveryTerms: 'FOB Origin',
      branchId,
      notes: 'Testing PO creation in E2E',
      items: [
        {
          itemId,
          orderedQty: 25,
          unitPrice: 18.5,
          deliveryDate: '2025-07-01T10:00:00Z',
          remarks: 'E2E test item',
        },
      ],
      ...overrides,
    };

    const response = await axios.post(`${TestHelpers.API_BASE_URL}/api/purchase-order`, poData, {
      headers: TestHelpers.getAuthHeaders(authToken),
    });

    return response.data;
  }
  /**
   * Execute purchase order workflow steps
   */
  static async executePOWorkflow(
    authToken: string,
    poId: string,
    steps: ('send' | 'confirm' | 'close')[]
  ): Promise<PurchaseOrderResponse | undefined> {
    for (const step of steps) {
      switch (step) {
        case 'send':
          await axios.post(
            `${TestHelpers.API_BASE_URL}/api/purchase-order/${poId}/send-to-supplier`,
            {},
            { headers: TestHelpers.getAuthHeaders(authToken) }
          );
          break;
        case 'confirm':
          await axios.post(
            `${TestHelpers.API_BASE_URL}/api/purchase-order/${poId}/confirm`,
            {},
            { headers: TestHelpers.getAuthHeaders(authToken) }
          );
          break;
        case 'close':
          await axios.post(
            `${TestHelpers.API_BASE_URL}/api/purchase-order/${poId}/close`,
            {},
            { headers: TestHelpers.getAuthHeaders(authToken) }
          );
          break;
      }
    }

    // Get the updated purchase order after all workflow steps
    const response = await axios.get(`${TestHelpers.API_BASE_URL}/api/purchase-order/${poId}`, {
      headers: TestHelpers.getAuthHeaders(authToken),
    });

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

  /**
   * Fetch dynamic UUIDs from the database
   */
  static async fetchDynamicUUIDs(prisma: PrismaClient): Promise<TestUUIDs> {
    if (cachedUUIDs) {
      return cachedUUIDs;
    }

    const item = await prisma.item.create({
      data: {
        name: 'Test Item',
        sku: 'TST001',
        description: 'Item created for testing',
        mainUnit: 'kg',
        buyingUnit: 'kg',
        transferUnit: 'kg',
        usingUnit: 'kg',
      },
    });

    const supplier = await prisma.supplier.create({
      data: {
        name: 'Test Supplier',
        code: 'TSUP001',
        contactPerson: 'Test Contact',
        email: 'supplier@test.com',
        phone: '123-456-7890',
        address: '123 Supplier St',
      },
    });

    const branch = await prisma.branch.create({
      data: {
        name: 'Test Branch',
        code: 'TBR001',
        address: '123 Test St, Test City',
        phone: '123-456-7890',
        email: 'branch@test.com',
      },
    });

    const userManager = await prisma.user.create({
      data: {
        email: 'manager.test@supplychain.com',
        username: 'manager.test',
        password: 'securePassword',
        firstName: 'Test',
        lastName: 'Manager',
        role: 'BRANCH_MANAGER',
        branchId: branch.id,
      },
    });

    const userSpecialist = await prisma.user.create({
      data: {
        email: 'specialist.test@supplychain.com',
        username: 'specialist.test',
        password: 'securePassword',
        firstName: 'Test',
        lastName: 'Specialist',
        role: 'PROCUREMENT_SPECIALIST',
        branchId: branch.id,
      },
    });

    const userClerk = await prisma.user.create({
      data: {
        email: 'clerk.test@supplychain.com',
        username: 'clerk.test',
        password: 'securePassword',
        firstName: 'Test',
        lastName: 'Clerk',
        role: 'INVENTORY_CLERK',
        branchId: branch.id,
      },
    });

    cachedUUIDs = {
      itemId: item.id,
      supplierId: supplier.id,
      branchId: branch.id,
      users: {
        branchManager: userManager.id,
        procurementSpecialist: userSpecialist.id,
        inventoryClerk: userClerk.id,
      },
    };

    return cachedUUIDs;
  }
}
