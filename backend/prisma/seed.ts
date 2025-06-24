import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// Helper function to hash passwords using argon2
async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password);
}

async function main() {
  console.log("Starting multi-tenant SaaS database seeding...");

  // 1. Create default permissions for the system
  console.log("Creating default permissions...");
  const permissions = await createDefaultPermissions();
  console.log(`Created ${permissions.length} permissions`);

  // 2. Create demo companies
  console.log("Creating demo companies...");
  const companies = await createDemoCompanies();
  console.log(`Created ${companies.length} companies`);

  // 3. For each company, create complete data
  for (const company of companies) {
    console.log(`\nSeeding data for company: ${(company as any).name}`);
    
    // Create default roles for the company
    const roles = await createDefaultRoles((company as any).id, permissions);
    console.log(`Created ${roles.length} roles for ${(company as any).name}`);

    // Create branches
    const branches = await createBranches((company as any).id);
    console.log(`Created ${branches.length} branches for ${(company as any).name}`);

    // Create users and assign roles/branches
    const users = await createUsers((company as any).id, branches, roles);
    console.log(`Created ${users.length} users for ${(company as any).name}`);

    // Create items
    const items = await createItems((company as any).id);
    console.log(`Created ${items.length} items for ${(company as any).name}`);

    // Create suppliers
    const suppliers = await createSuppliers((company as any).id);
    console.log(`Created ${suppliers.length} suppliers for ${(company as any).name}`);

    // Create initial stock
    const stockCount = await createInitialStock(branches, items);
    console.log(`Created ${stockCount} stock records for ${(company as any).name}`);

    // Create item-supplier relationships
    const itemSuppliers = await createItemSupplierRelationships(items, suppliers);
    console.log(`Created ${itemSuppliers.length} item-supplier relationships for ${(company as any).name}`);

    // Create historical data for AI
    await createHistoricalData((company as any).id, branches, items, suppliers, users);
    console.log(`Created historical data for AI analysis for ${(company as any).name}`);
  }

  console.log("\nMulti-tenant SaaS database seeding completed successfully!");
}

// Create default permissions that all companies will use
async function createDefaultPermissions() {
  const permissionData = [
    // Purchase Requests
    { module: "PURCHASE_REQUESTS", action: "CREATE", description: "Create purchase requests" },
    { module: "PURCHASE_REQUESTS", action: "VIEW", description: "View purchase requests" },
    { module: "PURCHASE_REQUESTS", action: "EDIT", description: "Edit purchase requests" },
    { module: "PURCHASE_REQUESTS", action: "DELETE", description: "Delete purchase requests" },
    { module: "PURCHASE_REQUESTS", action: "APPROVE", description: "Approve purchase requests" },
    { module: "PURCHASE_REQUESTS", action: "SUBMIT", description: "Submit purchase requests" },

    // Purchase Orders
    { module: "PURCHASE_ORDERS", action: "CREATE", description: "Create purchase orders" },
    { module: "PURCHASE_ORDERS", action: "VIEW", description: "View purchase orders" },
    { module: "PURCHASE_ORDERS", action: "EDIT", description: "Edit purchase orders" },
    { module: "PURCHASE_ORDERS", action: "DELETE", description: "Delete purchase orders" },

    // Inventory Management
    { module: "INVENTORY_MANAGEMENT", action: "VIEW", description: "View inventory" },
    { module: "INVENTORY_MANAGEMENT", action: "EDIT", description: "Edit inventory" },

    // Request Forms
    { module: "REQUEST_FORMS", action: "CREATE", description: "Create request forms" },
    { module: "REQUEST_FORMS", action: "VIEW", description: "View request forms" },
    { module: "REQUEST_FORMS", action: "EDIT", description: "Edit request forms" },
    { module: "REQUEST_FORMS", action: "APPROVE", description: "Approve request forms" },

    // Material Requisitions
    { module: "MATERIAL_REQUISITIONS", action: "CREATE", description: "Create material requisitions" },
    { module: "MATERIAL_REQUISITIONS", action: "VIEW", description: "View material requisitions" },
    { module: "MATERIAL_REQUISITIONS", action: "EDIT", description: "Edit material requisitions" },
    { module: "MATERIAL_REQUISITIONS", action: "APPROVE", description: "Approve material requisitions" },

    // Goods Receipts
    { module: "GOODS_RECEIPTS", action: "CREATE", description: "Create goods receipts" },
    { module: "GOODS_RECEIPTS", action: "VIEW", description: "View goods receipts" },
    { module: "GOODS_RECEIPTS", action: "EDIT", description: "Edit goods receipts" },

    // Formulas
    { module: "FORMULAS", action: "CREATE", description: "Create formulas" },
    { module: "FORMULAS", action: "VIEW", description: "View formulas" },
    { module: "FORMULAS", action: "EDIT", description: "Edit formulas" },
    { module: "FORMULAS", action: "DELETE", description: "Delete formulas" },

    // Manufacturing Lists
    { module: "MANUFACTURING_LISTS", action: "CREATE", description: "Create manufacturing lists" },
    { module: "MANUFACTURING_LISTS", action: "VIEW", description: "View manufacturing lists" },
    { module: "MANUFACTURING_LISTS", action: "EDIT", description: "Edit manufacturing lists" },

    // User Management
    { module: "USER_MANAGEMENT", action: "CREATE", description: "Create users" },
    { module: "USER_MANAGEMENT", action: "VIEW", description: "View users" },
    { module: "USER_MANAGEMENT", action: "EDIT", description: "Edit users" },
    { module: "USER_MANAGEMENT", action: "DELETE", description: "Delete users" },

    // Branch Management
    { module: "BRANCH_MANAGEMENT", action: "CREATE", description: "Create branches" },
    { module: "BRANCH_MANAGEMENT", action: "VIEW", description: "View branches" },
    { module: "BRANCH_MANAGEMENT", action: "EDIT", description: "Edit branches" },

    // Supplier Management
    { module: "SUPPLIER_MANAGEMENT", action: "CREATE", description: "Create suppliers" },
    { module: "SUPPLIER_MANAGEMENT", action: "VIEW", description: "View suppliers" },
    { module: "SUPPLIER_MANAGEMENT", action: "EDIT", description: "Edit suppliers" },

    // Reports
    { module: "REPORTS", action: "VIEW", description: "View reports" },
    { module: "REPORTS", action: "EXPORT", description: "Export reports" },

    // System Settings
    { module: "SYSTEM_SETTINGS", action: "VIEW", description: "View system settings" },
    { module: "SYSTEM_SETTINGS", action: "EDIT", description: "Edit system settings" },

    // AI Suggestions
    { module: "AI_SUGGESTIONS", action: "VIEW", description: "View AI suggestions" },
  ];

  const permissions = [];
  for (const permData of permissionData) {
    const permission = await (prisma as any).permission.upsert({
      where: { module_action: { module: permData.module, action: permData.action } },
      update: {},
      create: permData,
    });
    permissions.push(permission);
  }

  return permissions;
}

// Create demo companies for testing
async function createDemoCompanies() {
  const companies = [];

  // Company 1: Manufacturing Corp
  const company1 = await (prisma as any).company.upsert({
    where: { contactEmail: "admin@manufacturingcorp.com" },
    update: {},
    create: {
      name: "Manufacturing Corp",
      taxId: "TC001234567",
      businessAddress: "123 Industrial Boulevard, Manufacturing District",
      contactPhone: "+1-555-1000",
      contactEmail: "admin@manufacturingcorp.com",
      defaultCurrency: "USD",
      timezone: "America/New_York",
      isActive: true,
    },
  });
  companies.push(company1);

  // Company 2: Tech Solutions Ltd
  const company2 = await (prisma as any).company.upsert({
    where: { contactEmail: "contact@techsolutions.com" },
    update: {},
    create: {
      name: "Tech Solutions Ltd",
      taxId: "TS987654321",
      businessAddress: "456 Technology Park, Innovation Center",
      contactPhone: "+1-555-2000",
      contactEmail: "contact@techsolutions.com",
      defaultCurrency: "USD",
      timezone: "America/Los_Angeles",
      isActive: true,
    },
  });
  companies.push(company2);

  return companies;
}

// Create default roles for a company
async function createDefaultRoles(companyId: string, permissions: any[]) {
  const roles = [];

  // Super Admin Role - Full access
  const superAdminRole = await (prisma as any).role.create({
    data: {
      name: "Super Admin",
      description: "Full system access and company management",
      companyId,
      isActive: true,
    },
  });

  // Assign all permissions to Super Admin
  for (const permission of permissions) {
    await (prisma as any).rolePermission.create({
      data: {
        roleId: superAdminRole.id,
        permissionId: permission.id,
      },
    });
  }
  roles.push(superAdminRole);

  // Branch Manager Role
  const branchManagerRole = await (prisma as any).role.create({
    data: {
      name: "Branch Manager",
      description: "Manage branch operations, approve requests",
      companyId,
      isActive: true,
    },
  });

  // Assign specific permissions to Branch Manager
  const branchManagerPermissions = permissions.filter((p: any) => 
    (p.module === "PURCHASE_REQUESTS" && ["CREATE", "VIEW", "EDIT", "APPROVE"].includes(p.action)) ||
    (p.module === "REQUEST_FORMS" && ["CREATE", "VIEW", "EDIT", "APPROVE"].includes(p.action)) ||
    (p.module === "INVENTORY_MANAGEMENT" && ["VIEW", "EDIT"].includes(p.action)) ||
    (p.module === "REPORTS" && p.action === "VIEW") ||
    (p.module === "USER_MANAGEMENT" && p.action === "VIEW")
  );

  for (const permission of branchManagerPermissions) {
    await (prisma as any).rolePermission.create({
      data: {
        roleId: branchManagerRole.id,
        permissionId: permission.id,
      },
    });
  }
  roles.push(branchManagerRole);

  // Inventory Clerk Role
  const inventoryClerkRole = await (prisma as any).role.create({
    data: {
      name: "Inventory Clerk",
      description: "Handle inventory operations and goods receipts",
      companyId,
      isActive: true,
    },
  });

  const inventoryClerkPermissions = permissions.filter((p: any) => 
    (p.module === "INVENTORY_MANAGEMENT" && ["VIEW", "EDIT"].includes(p.action)) ||
    (p.module === "GOODS_RECEIPTS" && ["CREATE", "VIEW", "EDIT"].includes(p.action)) ||
    (p.module === "MATERIAL_REQUISITIONS" && ["CREATE", "VIEW", "EDIT"].includes(p.action))
  );

  for (const permission of inventoryClerkPermissions) {
    await (prisma as any).rolePermission.create({
      data: {
        roleId: inventoryClerkRole.id,
        permissionId: permission.id,
      },
    });
  }
  roles.push(inventoryClerkRole);

  // Procurement Specialist Role
  const procurementRole = await (prisma as any).role.create({
    data: {
      name: "Procurement Specialist",
      description: "Handle purchase orders and supplier management",
      companyId,
      isActive: true,
    },
  });

  const procurementPermissions = permissions.filter((p: any) => 
    (p.module === "PURCHASE_ORDERS" && ["CREATE", "VIEW", "EDIT"].includes(p.action)) ||
    (p.module === "PURCHASE_REQUESTS" && ["VIEW"].includes(p.action)) ||
    (p.module === "SUPPLIER_MANAGEMENT" && ["CREATE", "VIEW", "EDIT"].includes(p.action))
  );

  for (const permission of procurementPermissions) {
    await (prisma as any).rolePermission.create({
      data: {
        roleId: procurementRole.id,
        permissionId: permission.id,
      },
    });
  }
  roles.push(procurementRole);

  return roles;
}

// Create branches for a company
async function createBranches(companyId: string) {
  const branches = [];
  const companyPrefix = companyId.slice(-4); // Use last 4 chars of company ID as prefix

  // HQ Branch
  const hqBranch = await (prisma as any).branch.create({
    data: {
      name: "Headquarters",
      code: `HQ${companyPrefix}`,
      address: "123 Main Street, Business District",
      phone: "+1-555-0100",
      email: "headquarters@company.com",
      isActive: true,
      isHQ: true,
      companyId,
    },
  });
  branches.push(hqBranch);

  // Manufacturing Branch A
  const branchA = await (prisma as any).branch.create({
    data: {
      name: "Manufacturing Branch A",
      code: `BR1${companyPrefix}`,
      address: "456 Industrial Ave, Manufacturing Zone",
      phone: "+1-555-0101",
      email: "branch-a@company.com",
      isActive: true,
      isHQ: false,
      companyId,
    },
  });
  branches.push(branchA);

  // Manufacturing Branch B
  const branchB = await (prisma as any).branch.create({
    data: {
      name: "Manufacturing Branch B",
      code: `BR2${companyPrefix}`,
      address: "789 Factory Road, Production Area",
      phone: "+1-555-0102",
      email: "branch-b@company.com",
      isActive: true,
      isHQ: false,
      companyId,
    },
  });
  branches.push(branchB);

  return branches;
}

// Create users for a company and assign roles/branches
async function createUsers(companyId: string, branches: any[], roles: any[]) {
  const users = [];

  // Find roles
  const superAdminRole = roles.find((r: any) => r.name === "Super Admin");
  const branchManagerRole = roles.find((r: any) => r.name === "Branch Manager");
  const inventoryClerkRole = roles.find((r: any) => r.name === "Inventory Clerk");
  const procurementRole = roles.find((r: any) => r.name === "Procurement Specialist");

  // Super Admin User
  const superAdmin = await (prisma as any).user.create({
    data: {
      email: `admin@company${companyId.slice(-4)}.com`,
      username: `admin_${companyId.slice(-4)}`,
      firstName: "System",
      lastName: "Administrator",
      password: await hashPassword("admin123"),
      isSuperAdmin: true,
      companyId,
      isActive: true,
    },
  });

  // Assign Super Admin role
  await (prisma as any).userRole.create({
    data: {
      userId: superAdmin.id,
      roleId: superAdminRole.id,
    },
  });

  // Assign to HQ branch
  await (prisma as any).userBranch.create({
    data: {
      userId: superAdmin.id,
      branchId: branches.find((b: any) => b.isHQ).id,
      isActive: true,
    },
  });
  users.push(superAdmin);

  // Branch Manager for Branch A
  const managerA = await (prisma as any).user.create({
    data: {
      email: `manager.a@company${companyId.slice(-4)}.com`,
      username: `manager_a_${companyId.slice(-4)}`,
      firstName: "Alice",
      lastName: "Manager",
      password: await hashPassword("manager123"),
      companyId,
      isActive: true,
    },
  });

  await (prisma as any).userRole.create({
    data: {
      userId: managerA.id,
      roleId: branchManagerRole.id,
    },
  });

  await (prisma as any).userBranch.create({
    data: {
      userId: managerA.id,
      branchId: branches.find((b: any) => b.code === `BR1${companyId.slice(-4)}`).id,
      isActive: true,
    },
  });
  users.push(managerA);

  // Inventory Clerk for Branch A
  const clerkA = await (prisma as any).user.create({
    data: {
      email: `clerk.a@company${companyId.slice(-4)}.com`,
      username: `clerk_a_${companyId.slice(-4)}`,
      firstName: "Anna",
      lastName: "Clerk",
      password: await hashPassword("clerk123"),
      companyId,
      isActive: true,
    },
  });

  await (prisma as any).userRole.create({
    data: {
      userId: clerkA.id,
      roleId: inventoryClerkRole.id,
    },
  });

  await (prisma as any).userBranch.create({
    data: {
      userId: clerkA.id,
      branchId: branches.find((b: any) => b.code === `BR1${companyId.slice(-4)}`).id,
      isActive: true,
    },
  });
  users.push(clerkA);

  // Procurement Specialist
  const procurementUser = await (prisma as any).user.create({
    data: {
      email: `procurement@company${companyId.slice(-4)}.com`,
      username: `procurement_${companyId.slice(-4)}`,
      firstName: "Sam",
      lastName: "Specialist",
      password: await hashPassword("specialist123"),
      companyId,
      isActive: true,
    },
  });

  await (prisma as any).userRole.create({
    data: {
      userId: procurementUser.id,
      roleId: procurementRole.id,
    },
  });

  await (prisma as any).userBranch.create({
    data: {
      userId: procurementUser.id,
      branchId: branches.find((b: any) => b.isHQ).id,
      isActive: true,
    },
  });
  users.push(procurementUser);

  return users;
}

// Create items for a company
async function createItems(companyId: string) {
  const items = [];
  const companyPrefix = companyId.slice(-4);

  const itemsData = [
    {
      name: "Raw Material A - Premium Grade",
      sku: `RM001-${companyPrefix}`,
      description: "High-grade raw material for manufacturing processes",
      mainUnit: "kg",
      buyingUnit: "kg",
      transferUnit: "kg",
      usingUnit: "g",
      buyingToMainRate: new Decimal(1),
      transferToMainRate: new Decimal(1),
      usingToMainRate: new Decimal(0.001),
      safetyStockLevel: new Decimal(100),
      reorderLevel: new Decimal(50),
      companyId,
      isActive: true,
    },
    {
      name: "Raw Material B - Standard Grade",
      sku: `RM002-${companyPrefix}`,
      description: "Standard raw material for general production",
      mainUnit: "pieces",
      buyingUnit: "pieces",
      transferUnit: "pieces",
      usingUnit: "pieces",
      buyingToMainRate: new Decimal(1),
      transferToMainRate: new Decimal(1),
      usingToMainRate: new Decimal(1),
      safetyStockLevel: new Decimal(500),
      reorderLevel: new Decimal(250),
      companyId,
      isActive: true,
    },
    {
      name: "Chemical Component X",
      sku: `RM003-${companyPrefix}`,
      description: "Specialized chemical component for advanced formulations",
      mainUnit: "liters",
      buyingUnit: "liters",
      transferUnit: "ml",
      usingUnit: "ml",
      buyingToMainRate: new Decimal(1),
      transferToMainRate: new Decimal(0.001),
      usingToMainRate: new Decimal(0.001),
      safetyStockLevel: new Decimal(20),
      reorderLevel: new Decimal(10),
      companyId,
      isActive: true,
    },
    {
      name: "Finished Product Alpha",
      sku: `FG001-${companyPrefix}`,
      description: "Premium finished product manufactured from raw materials",
      mainUnit: "units",
      buyingUnit: "units",
      transferUnit: "units",
      usingUnit: "units",
      buyingToMainRate: new Decimal(1),
      transferToMainRate: new Decimal(1),
      usingToMainRate: new Decimal(1),
      safetyStockLevel: new Decimal(25),
      reorderLevel: new Decimal(10),
      companyId,
      isActive: true,
    },
    {
      name: "Packaging Material - Boxes",
      sku: `PKG001-${companyPrefix}`,
      description: "Standard cardboard boxes for product packaging",
      mainUnit: "pieces",
      buyingUnit: "pieces",
      transferUnit: "pieces",
      usingUnit: "pieces",
      buyingToMainRate: new Decimal(1),
      transferToMainRate: new Decimal(1),
      usingToMainRate: new Decimal(1),
      safetyStockLevel: new Decimal(200),
      reorderLevel: new Decimal(100),
      companyId,
      isActive: true,
    },
  ];

  for (const itemData of itemsData) {
    const item = await (prisma as any).item.create({
      data: itemData,
    });
    items.push(item);
  }

  return items;
}

// Create suppliers for a company
async function createSuppliers(companyId: string) {
  const suppliers = [];
  const companyPrefix = companyId.slice(-4);

  const suppliersData = [
    {
      name: "Premium Materials Inc.",
      code: `SUP001-${companyPrefix}`,
      contactPerson: "John Smith",
      email: "orders@premiummaterials.com",
      phone: "+1-555-2001",
      address: "100 Supplier Street, Industrial Park",
      companyId,
      isActive: true,
    },
    {
      name: "Chemical Solutions Ltd.",
      code: `SUP002-${companyPrefix}`,
      contactPerson: "Sarah Johnson",
      email: "sales@chemsolutions.com",
      phone: "+1-555-2002",
      address: "200 Chemical Lane, Science District",
      companyId,
      isActive: true,
    },
    {
      name: "Packaging World Corp.",
      code: `SUP003-${companyPrefix}`,
      contactPerson: "Mike Wilson",
      email: "info@packagingworld.com",
      phone: "+1-555-2003",
      address: "300 Packaging Blvd, Commerce Center",
      companyId,
      isActive: true,
    },
  ];

  for (const supplierData of suppliersData) {
    const supplier = await (prisma as any).supplier.create({
      data: supplierData,
    });
    suppliers.push(supplier);
  }

  return suppliers;
}

// Create initial stock for all items in all branches
async function createInitialStock(branches: any[], items: any[]) {
  let stockCount = 0;

  for (const branch of branches) {
    for (const item of items) {
      // Generate random stock quantities based on item type
      let quantity = new Decimal(0);
      if (item.sku.includes("RM")) {
        quantity = new Decimal(Math.floor(Math.random() * 200) + 50); // 50-250
      } else if (item.sku.includes("FG")) {
        quantity = new Decimal(Math.floor(Math.random() * 50) + 10); // 10-60
      } else if (item.sku.includes("PKG")) {
        quantity = new Decimal(Math.floor(Math.random() * 500) + 100); // 100-600
      }

      await (prisma as any).stock.create({
        data: {
          itemId: item.id,
          branchId: branch.id,
          quantity,
          reservedQty: new Decimal(0),
          availableQty: quantity,
          averageCost: new Decimal(Math.random() * 100 + 10), // Random cost between 10-110
          lastCost: new Decimal(Math.random() * 100 + 10),
        },
      });
      stockCount++;
    }
  }

  return stockCount;
}

// Create item-supplier relationships
async function createItemSupplierRelationships(items: any[], suppliers: any[]) {
  const relationships = [];
  const companyPrefix = suppliers[0].code.split('-')[1]; // Extract company prefix from supplier code

  // Raw Material A -> Premium Materials Inc.
  const rel1 = await (prisma as any).itemSupplier.create({
    data: {
      itemId: items.find((i: any) => i.sku === `RM001-${companyPrefix}`).id,
      supplierId: suppliers.find((s: any) => s.code === `SUP001-${companyPrefix}`).id,
      unitPrice: new Decimal(25.5),
      leadTimeDays: 7,
      isActive: true,
    },
  });
  relationships.push(rel1);

  // Chemical Component X -> Chemical Solutions Ltd.
  const rel2 = await (prisma as any).itemSupplier.create({
    data: {
      itemId: items.find((i: any) => i.sku === `RM003-${companyPrefix}`).id,
      supplierId: suppliers.find((s: any) => s.code === `SUP002-${companyPrefix}`).id,
      unitPrice: new Decimal(89.99),
      leadTimeDays: 14,
      isActive: true,
    },
  });
  relationships.push(rel2);

  // Packaging Material -> Packaging World Corp.
  const rel3 = await (prisma as any).itemSupplier.create({
    data: {
      itemId: items.find((i: any) => i.sku === `PKG001-${companyPrefix}`).id,
      supplierId: suppliers.find((s: any) => s.code === `SUP003-${companyPrefix}`).id,
      unitPrice: new Decimal(2.75),
      leadTimeDays: 3,
      isActive: true,
    },
  });
  relationships.push(rel3);

  return relationships;
}

// Create historical data for AI analysis
async function createHistoricalData(
  companyId: string, 
  branches: any[], 
  items: any[], 
  suppliers: any[], 
  users: any[]
) {
  // Create some sample purchase requests, purchase orders, etc.
  // This is a simplified version - you can expand this as needed
  
  const currentDate = new Date();
  
  // Create a few purchase requests
  for (let i = 0; i < 5; i++) {
    const requestDate = new Date(currentDate);
    requestDate.setMonth(requestDate.getMonth() - i);

    const pr = await (prisma as any).purchaseRequest.create({
      data: {
        prNumber: `PR${companyId.slice(-4)}-${String(i + 1).padStart(3, '0')}`,
        title: `Purchase Request ${i + 1}`,
        description: `Sample purchase request for testing`,
        status: "APPROVED",
        requestDate,
        requiredDate: new Date(requestDate.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days later
        totalAmount: new Decimal(Math.random() * 10000 + 1000),
        companyId,
        branchId: branches[Math.floor(Math.random() * branches.length)].id,
        createdById: users[Math.floor(Math.random() * users.length)].id,
      },
    });

    // Add items to the PR
    for (let j = 0; j < Math.floor(Math.random() * 3) + 1; j++) {
      const item = items[Math.floor(Math.random() * items.length)];
      await (prisma as any).pRItem.create({
        data: {
          prId: pr.id,
          itemId: item.id,
          requestedQty: new Decimal(Math.floor(Math.random() * 50) + 1),
          estimatedPrice: new Decimal(Math.random() * 100 + 10),
          totalAmount: new Decimal(Math.random() * 1000 + 100),
          requiredDate: new Date(requestDate.getTime() + 14 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  console.log("Created sample historical data for AI analysis");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
