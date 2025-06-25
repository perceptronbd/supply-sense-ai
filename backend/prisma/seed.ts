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
    { module: "PURCHASE_REQUESTS", action: "READ", description: "View purchase requests" },
    { module: "PURCHASE_REQUESTS", action: "UPDATE", description: "Edit purchase requests" },
    { module: "PURCHASE_REQUESTS", action: "DELETE", description: "Delete purchase requests" },
    { module: "PURCHASE_REQUESTS", action: "APPROVE", description: "Approve purchase requests" },
    { module: "PURCHASE_REQUESTS", action: "SUBMIT", description: "Submit purchase requests" },

    // Purchase Orders
    { module: "PURCHASE_ORDERS", action: "CREATE", description: "Create purchase orders" },
    { module: "PURCHASE_ORDERS", action: "READ", description: "View purchase orders" },
    { module: "PURCHASE_ORDERS", action: "UPDATE", description: "Edit purchase orders" },
    { module: "PURCHASE_ORDERS", action: "DELETE", description: "Delete purchase orders" },

    // Items
    { module: "ITEMS", action: "CREATE", description: "Create items" },
    { module: "ITEMS", action: "READ", description: "View items" },
    { module: "ITEMS", action: "UPDATE", description: "Edit items" },
    { module: "ITEMS", action: "DELETE", description: "Delete items" },

    // Request Forms
    { module: "REQUEST_FORMS", action: "CREATE", description: "Create request forms" },
    { module: "REQUEST_FORMS", action: "READ", description: "View request forms" },
    { module: "REQUEST_FORMS", action: "UPDATE", description: "Edit request forms" },
    { module: "REQUEST_FORMS", action: "APPROVE", description: "Approve request forms" },

    // Material Requisitions
    { module: "MATERIAL_REQUISITIONS", action: "CREATE", description: "Create material requisitions" },
    { module: "MATERIAL_REQUISITIONS", action: "READ", description: "View material requisitions" },
    { module: "MATERIAL_REQUISITIONS", action: "UPDATE", description: "Edit material requisitions" },
    { module: "MATERIAL_REQUISITIONS", action: "APPROVE", description: "Approve material requisitions" },

    // Goods Receipts
    { module: "GOODS_RECEIPTS", action: "CREATE", description: "Create goods receipts" },
    { module: "GOODS_RECEIPTS", action: "READ", description: "View goods receipts" },
    { module: "GOODS_RECEIPTS", action: "UPDATE", description: "Edit goods receipts" },
    { module: "GOODS_RECEIPTS", action: "DELETE", description: "Delete goods receipts" },

    // Formulas
    { module: "FORMULAS", action: "CREATE", description: "Create formulas" },
    { module: "FORMULAS", action: "READ", description: "View formulas" },
    { module: "FORMULAS", action: "UPDATE", description: "Edit formulas" },
    { module: "FORMULAS", action: "DELETE", description: "Delete formulas" },

    // Manufacturing Lists
    { module: "MANUFACTURING_LISTS", action: "CREATE", description: "Create manufacturing lists" },
    { module: "MANUFACTURING_LISTS", action: "READ", description: "View manufacturing lists" },
    { module: "MANUFACTURING_LISTS", action: "UPDATE", description: "Edit manufacturing lists" },

    // Users
    { module: "USERS", action: "CREATE", description: "Create users" },
    { module: "USERS", action: "READ", description: "View users" },
    { module: "USERS", action: "UPDATE", description: "Edit users" },
    { module: "USERS", action: "DELETE", description: "Delete users" },

    // Companies
    { module: "COMPANIES", action: "CREATE", description: "Create companies" },
    { module: "COMPANIES", action: "READ", description: "View companies" },
    { module: "COMPANIES", action: "UPDATE", description: "Edit companies" },
    { module: "COMPANIES", action: "DELETE", description: "Delete companies" },

    // Branches
    { module: "BRANCHES", action: "CREATE", description: "Create branches" },
    { module: "BRANCHES", action: "READ", description: "View branches" },
    { module: "BRANCHES", action: "UPDATE", description: "Edit branches" },
    { module: "BRANCHES", action: "DELETE", description: "Delete branches" },

    // Suppliers
    { module: "SUPPLIERS", action: "CREATE", description: "Create suppliers" },
    { module: "SUPPLIERS", action: "READ", description: "View suppliers" },
    { module: "SUPPLIERS", action: "UPDATE", description: "Edit suppliers" },
    { module: "SUPPLIERS", action: "DELETE", description: "Delete suppliers" },

    // AI
    { module: "AI", action: "ACCESS_SUGGESTIONS", description: "Access AI suggestions" },
    { module: "AI", action: "DEMAND_FORECASTING", description: "Use AI demand forecasting" },
    { module: "AI", action: "ANALYTICS", description: "View AI analytics" },

    // Chat
    { module: "CHAT", action: "SEND_MESSAGE", description: "Send messages" },
    { module: "CHAT", action: "READ_MESSAGES", description: "Read messages" },
    { module: "CHAT", action: "MANAGE_CONVERSATIONS", description: "Manage conversations" },
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
  const superAdminRole = await (prisma as any).role.upsert({
    where: { companyId_name: { companyId, name: "Super Admin" } },
    update: {},
    create: {
      name: "Super Admin",
      description: "Full system access and company management",
      companyId,
      isActive: true,
    },
  });

  // Clear existing permissions for this role and re-assign
  await (prisma as any).rolePermission.deleteMany({
    where: { roleId: superAdminRole.id },
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
  const branchManagerRole = await (prisma as any).role.upsert({
    where: { companyId_name: { companyId, name: "Branch Manager" } },
    update: {},
    create: {
      name: "Branch Manager",
      description: "Manage branch operations, approve requests",
      companyId,
      isActive: true,
    },
  });

  // Clear existing permissions for this role and re-assign
  await (prisma as any).rolePermission.deleteMany({
    where: { roleId: branchManagerRole.id },
  });

  // Assign specific permissions to Branch Manager
  const branchManagerPermissions = permissions.filter((p: any) => 
    (p.module === "PURCHASE_REQUESTS" && ["CREATE", "READ", "UPDATE", "APPROVE"].includes(p.action)) ||
    (p.module === "REQUEST_FORMS" && ["CREATE", "READ", "UPDATE", "APPROVE"].includes(p.action)) ||
    (p.module === "ITEMS" && ["READ", "UPDATE"].includes(p.action)) ||
    (p.module === "SUPPLIERS" && ["CREATE", "READ", "UPDATE"].includes(p.action)) ||
    (p.module === "BRANCHES" && ["READ"].includes(p.action)) ||
    (p.module === "USERS" && p.action === "READ")
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
  const inventoryClerkRole = await (prisma as any).role.upsert({
    where: { companyId_name: { companyId, name: "Inventory Clerk" } },
    update: {},
    create: {
      name: "Inventory Clerk",
      description: "Handle inventory operations and goods receipts",
      companyId,
      isActive: true,
    },
  });

  // Clear existing permissions for this role and re-assign
  await (prisma as any).rolePermission.deleteMany({
    where: { roleId: inventoryClerkRole.id },
  });

  const inventoryClerkPermissions = permissions.filter((p: any) => 
    (p.module === "ITEMS" && ["READ", "UPDATE"].includes(p.action)) ||
    (p.module === "GOODS_RECEIPTS" && ["CREATE", "READ", "UPDATE"].includes(p.action)) ||
    (p.module === "MATERIAL_REQUISITIONS" && ["CREATE", "READ", "UPDATE"].includes(p.action))
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
  const procurementRole = await (prisma as any).role.upsert({
    where: { companyId_name: { companyId, name: "Procurement Specialist" } },
    update: {},
    create: {
      name: "Procurement Specialist",
      description: "Handle purchase orders and supplier management",
      companyId,
      isActive: true,
    },
  });

  // Clear existing permissions for this role and re-assign
  await (prisma as any).rolePermission.deleteMany({
    where: { roleId: procurementRole.id },
  });

  const procurementPermissions = permissions.filter((p: any) => 
    (p.module === "PURCHASE_ORDERS" && ["CREATE", "READ", "UPDATE"].includes(p.action)) ||
    (p.module === "PURCHASE_REQUESTS" && ["READ"].includes(p.action)) ||
    (p.module === "SUPPLIERS" && ["CREATE", "READ", "UPDATE"].includes(p.action))
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
  const hqBranch = await (prisma as any).branch.upsert({
    where: { code: `HQ${companyPrefix}` },
    update: {
      name: "Headquarters",
      address: "123 Main Street, Business District",
      phone: "+1-555-0100",
      email: "headquarters@company.com",
      isActive: true,
      isHQ: true,
      companyId,
    },
    create: {
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
  const branchA = await (prisma as any).branch.upsert({
    where: { code: `BR1${companyPrefix}` },
    update: {
      name: "Manufacturing Branch A",
      address: "456 Industrial Ave, Manufacturing Zone",
      phone: "+1-555-0101",
      email: "branch-a@company.com",
      isActive: true,
      isHQ: false,
      companyId,
    },
    create: {
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
  const branchB = await (prisma as any).branch.upsert({
    where: { code: `BR2${companyPrefix}` },
    update: {
      name: "Manufacturing Branch B",
      address: "789 Factory Road, Production Area",
      phone: "+1-555-0102",
      email: "branch-b@company.com",
      isActive: true,
      isHQ: false,
      companyId,
    },
    create: {
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

  // Determine demo suffix based on company name (for predictable demo emails)
  const companyName = await (prisma as any).company.findUnique({
    where: { id: companyId },
    select: { name: true }
  });
  const isFirstCompany = companyName?.name?.includes("Manufacturing");
  const demoSuffix = isFirstCompany ? "001" : "002";

  // Super Admin User
  const superAdmin = await (prisma as any).user.upsert({
    where: { email: `admin@company${demoSuffix}.com` },
    update: {
      firstName: "System",
      lastName: "Administrator",
      password: await hashPassword("admin123"),
      isSuperAdmin: true,
      isActive: true,
    },
    create: {
      email: `admin@company${demoSuffix}.com`,
      username: `admin_${demoSuffix}`,
      firstName: "System",
      lastName: "Administrator",
      password: await hashPassword("admin123"),
      isSuperAdmin: true,
      companyId,
      isActive: true,
    },
  });

  // Clear existing roles and assign Super Admin role
  await (prisma as any).userRole.deleteMany({
    where: { userId: superAdmin.id },
  });
  await (prisma as any).userRole.create({
    data: {
      userId: superAdmin.id,
      roleId: superAdminRole.id,
    },
  });

  // Clear existing branches and assign to HQ branch
  await (prisma as any).userBranch.deleteMany({
    where: { userId: superAdmin.id },
  });
  await (prisma as any).userBranch.create({
    data: {
      userId: superAdmin.id,
      branchId: branches.find((b: any) => b.isHQ).id,
      isActive: true,
    },
  });
  users.push(superAdmin);

  // Branch Manager for Branch A
  const managerA = await (prisma as any).user.upsert({
    where: { email: `manager.a@company${demoSuffix}.com` },
    update: {
      firstName: "Alice",
      lastName: "Manager",
      password: await hashPassword("manager123"),
      isActive: true,
    },
    create: {
      email: `manager.a@company${demoSuffix}.com`,
      username: `manager_a_${demoSuffix}`,
      firstName: "Alice",
      lastName: "Manager",
      password: await hashPassword("manager123"),
      companyId,
      isActive: true,
    },
  });

  // Clear existing roles and assign Branch Manager role
  await (prisma as any).userRole.deleteMany({
    where: { userId: managerA.id },
  });
  await (prisma as any).userRole.create({
    data: {
      userId: managerA.id,
      roleId: branchManagerRole.id,
    },
  });

  // Clear existing branches and assign to Branch A
  await (prisma as any).userBranch.deleteMany({
    where: { userId: managerA.id },
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
  const clerkA = await (prisma as any).user.upsert({
    where: { email: `clerk.a@company${demoSuffix}.com` },
    update: {
      firstName: "Anna",
      lastName: "Clerk",
      password: await hashPassword("clerk123"),
      isActive: true,
    },
    create: {
      email: `clerk.a@company${demoSuffix}.com`,
      username: `clerk_a_${demoSuffix}`,
      firstName: "Anna",
      lastName: "Clerk",
      password: await hashPassword("clerk123"),
      companyId,
      isActive: true,
    },
  });

  // Clear existing roles and assign Inventory Clerk role
  await (prisma as any).userRole.deleteMany({
    where: { userId: clerkA.id },
  });
  await (prisma as any).userRole.create({
    data: {
      userId: clerkA.id,
      roleId: inventoryClerkRole.id,
    },
  });

  // Clear existing branches and assign to Branch A
  await (prisma as any).userBranch.deleteMany({
    where: { userId: clerkA.id },
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
  const procurementUser = await (prisma as any).user.upsert({
    where: { email: `procurement@company${demoSuffix}.com` },
    update: {
      firstName: "Sam",
      lastName: "Specialist",
      password: await hashPassword("specialist123"),
      isActive: true,
    },
    create: {
      email: `procurement@company${demoSuffix}.com`,
      username: `procurement_${demoSuffix}`,
      firstName: "Sam",
      lastName: "Specialist",
      password: await hashPassword("specialist123"),
      companyId,
      isActive: true,
    },
  });

  // Clear existing roles and assign Procurement role
  await (prisma as any).userRole.deleteMany({
    where: { userId: procurementUser.id },
  });
  await (prisma as any).userRole.create({
    data: {
      userId: procurementUser.id,
      roleId: procurementRole.id,
    },
  });

  // Clear existing branches and assign to HQ branch
  await (prisma as any).userBranch.deleteMany({
    where: { userId: procurementUser.id },
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
    const item = await (prisma as any).item.upsert({
      where: { companyId_sku: { companyId: itemData.companyId, sku: itemData.sku } },
      update: itemData,
      create: itemData,
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
    const supplier = await (prisma as any).supplier.upsert({
      where: { companyId_code: { companyId: supplierData.companyId, code: supplierData.code } },
      update: supplierData,
      create: supplierData,
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

      await (prisma as any).stock.upsert({
        where: { itemId_branchId: { itemId: item.id, branchId: branch.id } },
        update: {
          quantity,
          reservedQty: new Decimal(0),
          availableQty: quantity,
          averageCost: new Decimal(Math.random() * 100 + 10), // Random cost between 10-110
          lastCost: new Decimal(Math.random() * 100 + 10),
        },
        create: {
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

  for (let index = 0; index < Math.min(items.length, suppliers.length); index++) {
    const item = items[index];
    const supplier = suppliers[index % suppliers.length]; // Cycle through suppliers if fewer than items

    const relationship = await (prisma as any).itemSupplier.upsert({
      where: { itemId_supplierId: { itemId: item.id, supplierId: supplier.id } },
      update: {
        unitPrice: new Decimal(Math.random() * 50 + 10), // Random price between 10-60
        isPreferred: index === 0, // First supplier is preferred
        isActive: true,
      },
      create: {
        itemId: item.id,
        supplierId: supplier.id,
        unitPrice: new Decimal(Math.random() * 50 + 10), // Random price between 10-60
        isPreferred: index === 0, // First supplier is preferred
        isActive: true,
      },
    });
    relationships.push(relationship);
  }

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
    
    const prNumber = `PR${companyId.slice(-4)}-${String(i + 1).padStart(3, '0')}`;

    const pr = await (prisma as any).purchaseRequest.upsert({
      where: { companyId_prNumber: { companyId, prNumber } },
      update: {
        title: `Purchase Request ${i + 1}`,
        description: `Sample purchase request for testing`,
        status: "APPROVED",
        requestDate,
        requiredDate: new Date(requestDate.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days later
        totalAmount: new Decimal(Math.random() * 10000 + 1000),
        branchId: branches[Math.floor(Math.random() * branches.length)].id,
        createdById: users[Math.floor(Math.random() * users.length)].id,
      },
      create: {
        prNumber,
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
      
      // Check if PRItem already exists for this PR and item combination
      const existingPRItem = await (prisma as any).pRItem.findFirst({
        where: {
          prId: pr.id,
          itemId: item.id,
        },
      });

      if (!existingPRItem) {
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
