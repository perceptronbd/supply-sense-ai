---
description: 
globs: 
alwaysApply: false
---
---
applyTo: "backend/**/*.test.ts,backend/**/*.spec.ts,**/e2e/**,**/tests/**"
---

# Backend Testing and Validation Guidelines

## Testing Philosophy

### Testing Priorities
1. **High Priority**: Critical business logic, API endpoints, database operations, user workflows
2. **Medium Priority**: Service layer logic, data validation, error handling
3. **Low Priority**: Utility functions, simple transformations

### Testing Principles
- Write meaningful tests for critical business logic
- Test behavior, not implementation details
- Validate changes with compilation checks and linting
- Ensure backward compatibility when refactoring
- Test edge cases and error scenarios
- Prefer integration tests over unit tests for complex workflows
- Frontend unit testing is handled by backend - focus on API contracts and business logic

### Script and Command Execution for Testing
- **ALWAYS check package.json scripts before running test commands**
- **Use `pnpm run` to list all available test scripts**
- **Prefer defined test scripts over direct tool commands**

```bash
# List available test scripts
pnpm run | grep test

# Common test script patterns to look for:
pnpm run test              # Run all tests
pnpm run test:unit         # Unit tests only
pnpm run test:integration  # Integration tests only
pnpm run test:e2e          # End-to-end tests
pnpm run test:watch        # Watch mode
pnpm run test:coverage     # With coverage report
pnpm run test:backend      # Backend tests only
pnpm run test:frontend     # Frontend tests only

# Examples of proper usage:
# ✅ CORRECT: Use defined scripts
pnpm run test:backend
pnpm run test:e2e

# ❌ INCORRECT: Direct tool commands
jest
playwright test
```

## Backend Unit Testing Standards

### Service Testing
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ItemService } from './item.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ItemService', () => {
  let service: ItemService;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrismaService = {
      item: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ItemService>(ItemService);
    prismaService = module.get(PrismaService);
  });

  describe('findAll', () => {
    it('should return items with correct structure', async () => {
      const mockItems = [
        {
          id: 'item-1',
          sku: 'SKU001',
          name: 'Test Item',
          description: 'Test Description',
          isActive: true,
        },
      ];

      prismaService.item.findMany.mockResolvedValue(mockItems);

      const result = await service.findAll();

      expect(result).toEqual(mockItems);
      expect(prismaService.item.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });
    });

    it('should handle empty results', async () => {
      prismaService.item.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findBySku', () => {
    it('should find item by SKU', async () => {
      const mockItem = {
        id: 'item-1',
        sku: 'SKU001',
        name: 'Test Item',
      };

      prismaService.item.findUnique.mockResolvedValue(mockItem);

      const result = await service.findBySku('SKU001');

      expect(result).toEqual(mockItem);
      expect(prismaService.item.findUnique).toHaveBeenCalledWith({
        where: { sku: 'SKU001' },
      });
    });

    it('should return null for non-existent SKU', async () => {
      prismaService.item.findUnique.mockResolvedValue(null);

      const result = await service.findBySku('NONEXISTENT');

      expect(result).toBeNull();
    });
  });
});
```

### Controller Testing
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ItemController } from './item.controller';
import { ItemService } from './item.service';
import { CreateItemDto, UpdateItemDto } from './dto';

describe('ItemController', () => {
  let controller: ItemController;
  let service: jest.Mocked<ItemService>;

  beforeEach(async () => {
    const mockService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByBranch: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItemController],
      providers: [{ provide: ItemService, useValue: mockService }],
    }).compile();

    controller = module.get<ItemController>(ItemController);
    service = module.get(ItemService);
  });

  describe('findAll', () => {
    it('should return array of items', async () => {
      const mockItems = [
        { id: '1', sku: 'SKU001', name: 'Item 1' },
        { id: '2', sku: 'SKU002', name: 'Item 2' },
      ];

      service.findAll.mockResolvedValue(mockItems);

      const result = await controller.findAll();

      expect(result).toEqual(mockItems);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create new item', async () => {
      const createDto: CreateItemDto = {
        sku: 'SKU003',
        name: 'New Item',
        description: 'New Description',
        mainUnit: 'PCS',
      };

      const createdItem = { id: '3', ...createDto };
      service.create.mockResolvedValue(createdItem);

      const result = await controller.create(createDto);

      expect(result).toEqual(createdItem);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });

    it('should handle validation errors', async () => {
      const invalidDto = { name: 'Item without SKU' } as CreateItemDto;

      service.create.mockRejectedValue(new Error('SKU is required'));

      await expect(controller.create(invalidDto)).rejects.toThrow('SKU is required');
    });
  });
});
```

## Backend Integration Testing

### API Endpoint Testing
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

describe('ItemController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    
    await app.init();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await prismaService.item.deleteMany();
  });

  afterAll(async () => {
    await prismaService.$disconnect();
    await app.close();
  });

  describe('/items (GET)', () => {
    it('should return empty array when no items exist', () => {
      return request(app.getHttpServer())
        .get('/items')
        .expect(200)
        .expect({ data: [] });
    });

    it('should return items when they exist', async () => {
      // Seed test data
      await prismaService.item.createMany({
        data: [
          { sku: 'SKU001', name: 'Item 1', mainUnit: 'PCS' },
          { sku: 'SKU002', name: 'Item 2', mainUnit: 'KG' },
        ],
      });

      const response = await request(app.getHttpServer())
        .get('/items')
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('sku', 'SKU001');
      expect(response.body.data[1]).toHaveProperty('sku', 'SKU002');
    });
  });

  describe('/items (POST)', () => {
    it('should create new item', async () => {
      const createItemDto = {
        sku: 'SKU003',
        name: 'New Item',
        description: 'Test Description',
        mainUnit: 'PCS',
      };

      const response = await request(app.getHttpServer())
        .post('/items')
        .send(createItemDto)
        .expect(201);

      expect(response.body).toMatchObject(createItemDto);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('createdAt');
    });

    it('should validate required fields', async () => {
      const invalidDto = {
        name: 'Item without SKU',
      };

      await request(app.getHttpServer())
        .post('/items')
        .send(invalidDto)
        .expect(400);
    });

    it('should prevent duplicate SKUs', async () => {
      const itemDto = {
        sku: 'DUPLICATE',
        name: 'First Item',
        mainUnit: 'PCS',
      };

      // Create first item
      await request(app.getHttpServer())
        .post('/items')
        .send(itemDto)
        .expect(201);

      // Try to create duplicate
      await request(app.getHttpServer())
        .post('/items')
        .send({ ...itemDto, name: 'Second Item' })
        .expect(409);
    });
  });
});
```

### Database Testing with Transactions
```typescript
import { PrismaService } from '../prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('PurchaseOrderService Integration', () => {
  let service: PurchaseOrderService;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PurchaseOrderService, PrismaService],
    }).compile();

    service = module.get<PurchaseOrderService>(PurchaseOrderService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    // Start transaction for each test
    await prismaService.$executeRaw`BEGIN`;
  });

  afterEach(async () => {
    // Rollback transaction after each test
    await prismaService.$executeRaw`ROLLBACK`;
  });

  afterAll(async () => {
    await prismaService.$disconnect();
  });

  it('should create purchase order with items', async () => {
    // Create test supplier and items
    const supplier = await prismaService.supplier.create({
      data: { name: 'Test Supplier', code: 'SUP001' },
    });

    const item = await prismaService.item.create({
      data: { sku: 'ITEM001', name: 'Test Item', mainUnit: 'PCS' },
    });

    const createDto = {
      supplierId: supplier.id,
      deliveryDate: '2024-12-01',
      items: [
        {
          itemId: item.id,
          orderedQty: 10,
          unitPrice: 25.50,
        },
      ],
    };

    const result = await service.create(createDto);

    expect(result).toHaveProperty('id');
    expect(result.supplierId).toBe(supplier.id);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].orderedQty).toBe(10);
    expect(result.totalAmount).toBe(255.00);
  });

  it('should handle workflow state transitions', async () => {
    const purchaseOrder = await createTestPurchaseOrder();

    // Test pending -> approved transition
    await service.updateStatus(purchaseOrder.id, 'approved');
    const approved = await service.findOne(purchaseOrder.id);
    expect(approved.status).toBe('approved');

    // Test approved -> rejected should fail
    await expect(
      service.updateStatus(purchaseOrder.id, 'rejected')
    ).rejects.toThrow('Cannot transition from approved to rejected');
  });
});
```

## Business Logic Testing

### Utility Function Testing
```typescript
import { formatCurrency, calculateTotal, validateSku } from '../utils';

describe('Business Utilities', () => {
  describe('formatCurrency', () => {
    it('formats positive numbers correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('handles edge cases', () => {
      expect(formatCurrency(0.1)).toBe('$0.10');
      expect(formatCurrency(999999.99)).toBe('$999,999.99');
    });
  });

  describe('calculateTotal', () => {
    it('calculates total with tax correctly', () => {
      const items = [
        { quantity: 10, unitPrice: 25.50 },
        { quantity: 5, unitPrice: 10.00 },
      ];
      
      expect(calculateTotal(items, 0.08)).toBe(318.60); // (255 + 50) * 1.08
    });

    it('handles empty items array', () => {
      expect(calculateTotal([], 0.08)).toBe(0);
    });
  });

  describe('validateSku', () => {
    it('validates correct SKU formats', () => {
      expect(validateSku('SKU001')).toBe(true);
      expect(validateSku('ITEM-001')).toBe(true);
    });

    it('rejects invalid SKU formats', () => {
      expect(validateSku('')).toBe(false);
      expect(validateSku('sk')).toBe(false);
      expect(validateSku('SKU 001')).toBe(false);
    });
  });
});
```

## E2E Testing Guidelines

### API E2E Testing
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';

describe('Purchase Order Workflow (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should complete full purchase order workflow', async () => {
    // 1. Create supplier
    const supplierResponse = await request(app.getHttpServer())
      .post('/suppliers')
      .send({
        name: 'Test Supplier',
        code: 'SUP001',
        email: 'supplier@test.com',
      })
      .expect(201);

    const supplierId = supplierResponse.body.id;

    // 2. Create item
    const itemResponse = await request(app.getHttpServer())
      .post('/items')
      .send({
        sku: 'ITEM001',
        name: 'Test Item',
        mainUnit: 'PCS',
      })
      .expect(201);

    const itemId = itemResponse.body.id;

    // 3. Create purchase order
    const poResponse = await request(app.getHttpServer())
      .post('/purchase-orders')
      .send({
        supplierId,
        deliveryDate: '2024-12-01',
        items: [
          {
            itemId,
            orderedQty: 10,
            unitPrice: 25.50,
          },
        ],
      })
      .expect(201);

    const purchaseOrderId = poResponse.body.id;
    expect(poResponse.body.totalAmount).toBe(255.00);

    // 4. Approve purchase order
    await request(app.getHttpServer())
      .patch(`/purchase-orders/${purchaseOrderId}/status`)
      .send({ status: 'approved' })
      .expect(200);

    // 5. Verify final state
    const finalResponse = await request(app.getHttpServer())
      .get(`/purchase-orders/${purchaseOrderId}`)
      .expect(200);

    expect(finalResponse.body.status).toBe('approved');
    expect(finalResponse.body.items).toHaveLength(1);
  });
});
```

### Frontend E2E with Playwright
```typescript
import { test, expect } from '@playwright/test';

test.describe('Purchase Order Frontend Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup test data via API
    await page.route('/api/suppliers', async route => {
      route.fulfill({
        json: {
          data: [
            { id: 'SUP001', name: 'Test Supplier', code: 'SUP001' }
          ]
        }
      });
    });

    await page.route('/api/items', async route => {
      route.fulfill({
        json: {
          data: [
            { id: 'ITEM001', sku: 'ITEM001', name: 'Test Item' }
          ]
        }
      });
    });
  });

  test('creates purchase order successfully', async ({ page }) => {
    await page.goto('/purchase-orders/create');

    // Fill form
    await page.selectOption('[data-testid="supplier-select"]', 'SUP001');
    await page.fill('[data-testid="delivery-date"]', '2024-12-01');

    // Add item
    await page.click('[data-testid="add-item-button"]');
    await page.selectOption('[data-testid="item-select"]', 'ITEM001');
    await page.fill('[data-testid="quantity-input"]', '10');
    await page.fill('[data-testid="unit-price"]', '25.50');
    await page.click('[data-testid="save-item"]');

    // Submit form
    await page.click('[data-testid="submit-button"]');

    // Verify success
    await expect(page.locator('[data-testid="success-message"]'))
      .toContainText('Purchase order created successfully');
  });
});
```

## Performance Testing

### Backend Performance Testing
```typescript
describe('Performance Tests', () => {
  it('should handle large item lists efficiently', async () => {
    // Create 1000 items
    const items = Array.from({ length: 1000 }, (_, i) => ({
      sku: `ITEM${i.toString().padStart(4, '0')}`,
      name: `Item ${i}`,
      mainUnit: 'PCS',
    }));

    const startTime = performance.now();
    
    for (const item of items) {
      await service.create(item);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should create 1000 items in under 5 seconds
    expect(duration).toBeLessThan(5000);
  });

  it('should query large datasets efficiently', async () => {
    // Assume 10000 items exist
    const startTime = performance.now();
    
    const result = await service.findAll({
      page: 1,
      limit: 100,
      search: 'test',
    });

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should query and return results in under 100ms
    expect(duration).toBeLessThan(100);
    expect(result.data).toHaveLength(100);
  });
});
```

## Test Data Management

### Backend Test Factories
```typescript
// factories/testDataFactory.ts
export class TestDataFactory {
  constructor(private prisma: PrismaService) {}

  async createSupplier(overrides: Partial<Supplier> = {}): Promise<Supplier> {
    return this.prisma.supplier.create({
      data: {
        name: 'Test Supplier',
        code: 'SUP001',
        email: 'supplier@test.com',
        isActive: true,
        ...overrides,
      },
    });
  }

  async createItem(overrides: Partial<Item> = {}): Promise<Item> {
    return this.prisma.item.create({
      data: {
        sku: `ITEM${Date.now()}`,
        name: 'Test Item',
        mainUnit: 'PCS',
        isActive: true,
        ...overrides,
      },
    });
  }

  async createPurchaseOrder(
    supplierId: string,
    itemIds: string[],
    overrides: Partial<PurchaseOrder> = {}
  ): Promise<PurchaseOrder> {
    return this.prisma.purchaseOrder.create({
      data: {
        supplierId,
        deliveryDate: new Date('2024-12-01'),
        status: 'pending',
        items: {
          create: itemIds.map((itemId, index) => ({
            itemId,
            orderedQty: 10,
            unitPrice: 25.50,
            totalAmount: 255.00,
          })),
        },
        ...overrides,
      },
      include: {
        items: true,
        supplier: true,
      },
    });
  }

  async cleanupTestData(): Promise<void> {
    // Clean in dependency order
    await this.prisma.purchaseOrderItem.deleteMany();
    await this.prisma.purchaseOrder.deleteMany();
    await this.prisma.item.deleteMany();
    await this.prisma.supplier.deleteMany();
  }
}
```

## Test Environment Setup

### NestJS Test Configuration
```typescript
// test/setup.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

export async function createTestApp() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  await app.init();

  return {
    app,
    prisma: moduleFixture.get<PrismaService>(PrismaService),
    module: moduleFixture,
  };
}

export async function cleanupTestApp(app: any, prisma: PrismaService) {
  await prisma.$disconnect();
  await app.close();
}
```

### Jest Configuration for Backend
```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "src",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "collectCoverageFrom": [
    "**/*.(t|j)s"
  ],
  "coverageDirectory": "../coverage",
  "testEnvironment": "node",
  "setupFilesAfterEnv": ["<rootDir>/../test/setup.ts"],
  "moduleNameMapping": {
    "^@/(.*)$": "<rootDir>/$1"
  }
}
```

