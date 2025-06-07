import { PrismaClient, UserRole } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

// Helper function to hash passwords using argon2
async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password);
}

async function main() {
  console.log("Starting database seeding...");

  // Create branches
  const branches = await Promise.all([
    prisma.branch.upsert({
      where: { code: "HQ001" },
      update: {},
      create: {
        name: "Headquarters",
        code: "HQ001",
        address: "123 Main Street, Business District",
        phone: "+1-555-0100",
        email: "headquarters@supplychain.com",
        isActive: true,
      },
    }),
    prisma.branch.upsert({
      where: { code: "BR001" },
      update: {},
      create: {
        name: "Manufacturing Branch A",
        code: "BR001",
        address: "456 Industrial Ave, Manufacturing Zone",
        phone: "+1-555-0101",
        email: "branch-a@supplychain.com",
        isActive: true,
      },
    }),
    prisma.branch.upsert({
      where: { code: "BR002" },
      update: {},
      create: {
        name: "Manufacturing Branch B",
        code: "BR002",
        address: "789 Factory Road, Production Area",
        phone: "+1-555-0102",
        email: "branch-b@supplychain.com",
        isActive: true,
      },
    }),
  ]);

  console.log(
    "Created branches:",
    branches.map((b) => b.name)
  );

  // Create items
  const items = await Promise.all([
    prisma.item.upsert({
      where: { sku: "RM001" },
      update: {},
      create: {
        name: "Raw Material A - Premium Grade",
        sku: "RM001",
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
        isActive: true,
      },
    }),
    prisma.item.upsert({
      where: { sku: "RM002" },
      update: {},
      create: {
        name: "Raw Material B - Standard Grade",
        sku: "RM002",
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
        isActive: true,
      },
    }),
    prisma.item.upsert({
      where: { sku: "RM003" },
      update: {},
      create: {
        name: "Chemical Component X",
        sku: "RM003",
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
        isActive: true,
      },
    }),
    prisma.item.upsert({
      where: { sku: "FG001" },
      update: {},
      create: {
        name: "Finished Product Alpha",
        sku: "FG001",
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
        isActive: true,
      },
    }),
    prisma.item.upsert({
      where: { sku: "PKG001" },
      update: {},
      create: {
        name: "Packaging Material - Boxes",
        sku: "PKG001",
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
        isActive: true,
      },
    }),
  ]);

  console.log(
    "Created items:",
    items.map((i) => i.name)
  );

  // Create suppliers
  const suppliers = await Promise.all([
    prisma.supplier.upsert({
      where: { code: "SUP001" },
      update: {},
      create: {
        name: "Premium Materials Inc.",
        code: "SUP001",
        contactPerson: "John Smith",
        email: "orders@premiummaterials.com",
        phone: "+1-555-2001",
        address: "100 Supplier Street, Industrial Park",
        isActive: true,
      },
    }),
    prisma.supplier.upsert({
      where: { code: "SUP002" },
      update: {},
      create: {
        name: "Chemical Solutions Ltd.",
        code: "SUP002",
        contactPerson: "Sarah Johnson",
        email: "sales@chemsolutions.com",
        phone: "+1-555-2002",
        address: "200 Chemical Lane, Science District",
        isActive: true,
      },
    }),
    prisma.supplier.upsert({
      where: { code: "SUP003" },
      update: {},
      create: {
        name: "Packaging World Corp.",
        code: "SUP003",
        contactPerson: "Mike Wilson",
        email: "info@packagingworld.com",
        phone: "+1-555-2003",
        address: "300 Packaging Blvd, Commerce Center",
        isActive: true,
      },
    }),
  ]);

  console.log(
    "Created suppliers:",
    suppliers.map((s) => s.name)
  ); // Create users with properly hashed passwords
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@supplychain.com" },
      update: {},
      create: {
        email: "admin@supplychain.com",
        username: "admin",
        firstName: "System",
        lastName: "Administrator",
        password: await hashPassword("admin123"),
        role: UserRole.SYSTEM_ADMIN,
        branchId: branches[0].id, // Assign to HQ
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "manager.a@supplychain.com" },
      update: {},
      create: {
        email: "manager.a@supplychain.com",
        username: "manager_a",
        firstName: "Alice",
        lastName: "Manager",
        password: await hashPassword("manager123"),
        role: UserRole.BRANCH_MANAGER,
        branchId: branches[1].id, // Assign to Branch A
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "clerk.a@supplychain.com" },
      update: {},
      create: {
        email: "clerk.a@supplychain.com",
        username: "clerk_a",
        firstName: "Anna",
        lastName: "Clerk",
        password: await hashPassword("clerk123"),
        role: UserRole.INVENTORY_CLERK,
        branchId: branches[1].id, // Assign to Branch A
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "clerk.b@supplychain.com" },
      update: {},
      create: {
        email: "clerk.b@supplychain.com",
        username: "clerk_b",
        firstName: "Bob",
        lastName: "Clerk",
        password: await hashPassword("clerk123"),
        role: UserRole.INVENTORY_CLERK,
        branchId: branches[2].id, // Assign to Branch B
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "specialist.a@supplychain.com" },
      update: {},
      create: {
        email: "specialist.a@supplychain.com",
        username: "specialist_a",
        firstName: "Sam",
        lastName: "Specialist",
        password: await hashPassword("specialist123"),
        role: UserRole.PROCUREMENT_SPECIALIST,
        branchId: branches[1].id, // Assign to Branch A
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "user.a@supplychain.com" },
      update: {},
      create: {
        email: "user.a@supplychain.com",
        username: "user_a",
        firstName: "John",
        lastName: "User",
        password: await hashPassword("user123"),
        role: UserRole.PRODUCTION_PLANNER,
        branchId: branches[1].id, // Assign to Branch A
        isActive: true,
      },
    }),
  ]);

  console.log(
    "Created users:",
    users.map((u) => u.email)
  ); // Create initial stock records
  let stockCount = 0;
  for (const branch of branches) {
    for (const item of items) {
      await prisma.stock.upsert({
        where: {
          itemId_branchId: {
            itemId: item.id,
            branchId: branch.id,
          },
        },
        update: {},
        create: {
          itemId: item.id,
          branchId: branch.id,
          quantity: new Decimal(Math.floor(Math.random() * 500) + 100), // Random initial stock
          reservedQty: new Decimal(0),
          availableQty: new Decimal(Math.floor(Math.random() * 500) + 100),
          averageCost: new Decimal(Math.floor(Math.random() * 50) + 10), // Random cost between 10-60
          lastCost: new Decimal(Math.floor(Math.random() * 50) + 10),
          lastStockDate: new Date(),
        },
      });
      stockCount++;
    }
  }

  console.log(`Created ${stockCount} stock records`);

  // Create item-supplier relationships
  const itemSuppliers = await Promise.all([
    prisma.itemSupplier.upsert({
      where: {
        itemId_supplierId: {
          itemId: items[0].id, // Raw Material A
          supplierId: suppliers[0].id, // Premium Materials Inc.
        },
      },
      update: {},
      create: {
        itemId: items[0].id,
        supplierId: suppliers[0].id,
        leadTimeDays: 7,
        unitPrice: new Decimal(25.5),
        isActive: true,
      },
    }),
    prisma.itemSupplier.upsert({
      where: {
        itemId_supplierId: {
          itemId: items[2].id, // Chemical Component X
          supplierId: suppliers[1].id, // Chemical Solutions Ltd.
        },
      },
      update: {},
      create: {
        itemId: items[2].id,
        supplierId: suppliers[1].id,
        leadTimeDays: 14,
        unitPrice: new Decimal(89.99),
        isActive: true,
      },
    }),
    prisma.itemSupplier.upsert({
      where: {
        itemId_supplierId: {
          itemId: items[4].id, // Packaging Material
          supplierId: suppliers[2].id, // Packaging World Corp.
        },
      },
      update: {},
      create: {
        itemId: items[4].id,
        supplierId: suppliers[2].id,
        leadTimeDays: 3,
        unitPrice: new Decimal(2.75),
        isActive: true,
      },
    }),
  ]);

  console.log("Created item-supplier relationships:", itemSuppliers.length);

  console.log("Database seeding completed successfully!");
  console.log("\nSeed data summary:");
  console.log(`- Branches: ${branches.length}`);
  console.log(`- Items: ${items.length}`);
  console.log(`- Suppliers: ${suppliers.length}`);
  console.log(`- Users: ${users.length}`);
  console.log(`- Stock records: ${stockCount}`);
  console.log(`- Item-supplier relationships: ${itemSuppliers.length}`);
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
