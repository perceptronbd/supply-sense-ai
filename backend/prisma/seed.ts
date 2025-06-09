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

  // Create historical purchase requests (past 12 months) for AI demand forecasting
  console.log("Creating historical purchase requests...");
  const purchaseRequests: any[] = [];
  const currentDate = new Date();

  for (let monthsBack = 12; monthsBack >= 1; monthsBack--) {
    const requestDate = new Date(currentDate);
    requestDate.setMonth(requestDate.getMonth() - monthsBack);

    // Create 2-4 purchase requests per month per branch
    for (const branch of branches) {
      const requestsThisMonth = Math.floor(Math.random() * 3) + 2; // 2-4 requests

      for (let i = 0; i < requestsThisMonth; i++) {
        const prDate = new Date(requestDate);
        prDate.setDate(Math.floor(Math.random() * 28) + 1); // Random day in month

        const pr = await prisma.purchaseRequest.create({
          data: {
            prNumber: `PR${branch.code}-${prDate.getFullYear()}${String(
              prDate.getMonth() + 1
            ).padStart(2, "0")}-${String(i + 1).padStart(3, "0")}`,
            requestDate: prDate,
            requiredDate: prDate, // Set required date same as request date for historical data
            branchId: branch.id,
            createdById: users[Math.floor(Math.random() * users.length)].id,
            totalAmount: new Decimal(0), // Will be updated after items
            status: "APPROVED",
            createdAt: prDate,
            updatedAt: prDate,
          },
        });

        purchaseRequests.push(pr);

        // Add 1-3 items per purchase request
        const itemsInPR = Math.floor(Math.random() * 3) + 1;
        let totalAmount = new Decimal(0);

        for (let j = 0; j < itemsInPR; j++) {
          const randomItem = items[Math.floor(Math.random() * items.length)];
          const quantity = Math.floor(Math.random() * 100) + 20; // 20-120 units
          const unitPrice = new Decimal(Math.floor(Math.random() * 50) + 10);
          const itemTotal = unitPrice.mul(quantity);
          totalAmount = totalAmount.add(itemTotal);

          await prisma.pRItem.create({
            data: {
              prId: pr.id,
              itemId: randomItem.id,
              requestedQty: new Decimal(quantity),
              estimatedPrice: unitPrice,
              totalAmount: itemTotal,
              requiredDate: prDate,
              createdAt: prDate,
            },
          });
        }

        // Update total amount
        await prisma.purchaseRequest.update({
          where: { id: pr.id },
          data: { totalAmount },
        });
      }
    }
  }

  console.log(
    `Created ${purchaseRequests.length} historical purchase requests`
  );

  // Create historical goods receipts for demand analysis
  console.log("Creating historical goods receipts...");
  const goodsReceipts: any[] = [];

  for (let monthsBack = 11; monthsBack >= 0; monthsBack--) {
    const receiptDate = new Date(currentDate);
    receiptDate.setMonth(receiptDate.getMonth() - monthsBack);

    for (const branch of branches) {
      const receiptsThisMonth = Math.floor(Math.random() * 4) + 2; // 2-5 receipts

      for (let i = 0; i < receiptsThisMonth; i++) {
        const grDate = new Date(receiptDate);
        grDate.setDate(Math.floor(Math.random() * 28) + 1);

        const gr = await prisma.goodsReceipt.create({
          data: {
            grNumber: `GR${branch.code}-${grDate.getFullYear()}${String(
              grDate.getMonth() + 1
            ).padStart(2, "0")}-${String(i + 1).padStart(3, "0")}`,
            receiptDate: grDate,
            branchId: branch.id,
            receivedById: users[Math.floor(Math.random() * users.length)].id,
            status: "POSTED",
            remarks: `Historical receipt - Month ${monthsBack} back`,
            createdAt: grDate,
            updatedAt: grDate,
          },
        });

        goodsReceipts.push(gr);

        // Add items to goods receipt
        const itemsInGR = Math.floor(Math.random() * 3) + 1;

        for (let j = 0; j < itemsInGR; j++) {
          const randomItem = items[Math.floor(Math.random() * items.length)];
          const quantity = Math.floor(Math.random() * 80) + 15; // 15-95 units
          const unitPrice = new Decimal(Math.floor(Math.random() * 45) + 8);
          const itemTotal = unitPrice.mul(quantity);

          await prisma.gRItem.create({
            data: {
              grId: gr.id,
              itemId: randomItem.id,
              orderedQty: new Decimal(quantity),
              receivedQty: new Decimal(quantity),
              unitPrice: unitPrice,
              totalCost: itemTotal,
              createdAt: grDate,
            },
          });
        }
      }
    }
  }

  console.log(`Created ${goodsReceipts.length} historical goods receipts`);

  // Create historical material requisitions for consumption tracking
  console.log("Creating historical material requisitions...");
  const materialRequisitions: any[] = [];

  for (let monthsBack = 10; monthsBack >= 0; monthsBack--) {
    const reqDate = new Date(currentDate);
    reqDate.setMonth(reqDate.getMonth() - monthsBack);

    for (const branch of branches) {
      const reqsThisMonth = Math.floor(Math.random() * 6) + 3; // 3-8 requisitions

      for (let i = 0; i < reqsThisMonth; i++) {
        const mrDate = new Date(reqDate);
        mrDate.setDate(Math.floor(Math.random() * 28) + 1);

        const mr = await prisma.materialRequisition.create({
          data: {
            mrNumber: `MR${branch.code}-${mrDate.getFullYear()}${String(
              mrDate.getMonth() + 1
            ).padStart(2, "0")}-${String(i + 1).padStart(3, "0")}`,
            type: "TRIM_WASTE",
            branchId: branch.id,
            createdById: users[Math.floor(Math.random() * users.length)].id,
            status: "COMPLETED",
            notes: `Historical consumption - Month ${monthsBack} back`,
            createdAt: mrDate,
            updatedAt: mrDate,
          },
        });

        materialRequisitions.push(mr);

        // Add items to material requisition
        const itemsInMR = Math.floor(Math.random() * 4) + 2;

        for (let j = 0; j < itemsInMR; j++) {
          const randomItem = items[Math.floor(Math.random() * items.length)];
          const quantity = Math.floor(Math.random() * 50) + 10; // 10-60 units

          await prisma.mRItem.create({
            data: {
              mrId: mr.id,
              itemId: randomItem.id,
              quantity: new Decimal(quantity),
              wasteType: "TRIM",
              createdAt: mrDate,
            },
          });
        }
      }
    }
  }

  console.log(
    `Created ${materialRequisitions.length} historical material requisitions`
  );

  // Update stock quantities to reflect low stock for some items (for AI testing)
  console.log("Updating stock levels for AI testing scenarios...");
  const lowStockUpdates: string[] = [];

  for (const branch of branches) {
    // Make 2-3 items have low stock in each branch
    const itemsToMakeLowStock = items.slice(0, 3);

    for (const item of itemsToMakeLowStock) {
      const lowQuantity = Math.floor(Math.random() * 8) + 2; // 2-9 units (below reorder level)

      await prisma.stock.update({
        where: {
          itemId_branchId: {
            itemId: item.id,
            branchId: branch.id,
          },
        },
        data: {
          quantity: new Decimal(lowQuantity),
          availableQty: new Decimal(lowQuantity),
          lastStockDate: new Date(),
        },
      });

      lowStockUpdates.push(
        `${item.name} in ${branch.name}: ${lowQuantity} units`
      );
    }
  }

  console.log(`Updated ${lowStockUpdates.length} items to low stock levels`);

  // Create some AI suggestions for testing
  console.log("Creating AI suggestions for testing...");
  const aiSuggestions: any[] = [];

  for (const branch of branches) {
    // Create a few AI suggestions per branch
    for (let i = 0; i < 3; i++) {
      const suggestion = await prisma.aISuggestion.create({
        data: {
          type:
            i === 0
              ? "STOCK_REORDER"
              : i === 1
              ? "TRANSFER_REQUEST"
              : "COST_VARIANCE",
          title: `AI Suggestion ${i + 1} for ${branch.name}`,
          description: `This is an AI-generated suggestion for optimizing operations in ${branch.name}`,
          status: "PENDING",
          confidence: new Decimal(0.85 + Math.random() * 0.1), // 0.85-0.95
          reasoning: `AI analysis indicates optimization opportunity for ${branch.name}`,
          suggestionData: JSON.stringify({
            branchId: branch.id,
            itemIds: items.slice(0, 2).map((item) => item.id),
            analysisDate: new Date().toISOString(),
          }),
          entityType: "Branch",
          entityId: branch.id,
          userId: users[0].id, // System admin
        },
      });

      aiSuggestions.push(suggestion);
    }
  }

  console.log(`Created ${aiSuggestions.length} AI suggestions`);

  // Create additional specific low stock scenarios for AI module testing
  console.log("Creating specific low stock scenarios for AI module testing...");

  // Find the "Finished Product Alpha" item and make it very low stock in one branch
  const finishedProductAlpha = items.find((item) => item.sku === "FG001");
  if (finishedProductAlpha) {
    const testBranch = branches[1]; // Manufacturing Branch A

    await prisma.stock.update({
      where: {
        itemId_branchId: {
          itemId: finishedProductAlpha.id,
          branchId: testBranch.id,
        },
      },
      data: {
        quantity: new Decimal(3), // Very low stock - should trigger high urgency
        availableQty: new Decimal(3),
        averageCost: new Decimal(45.5), // Set a reasonable cost for testing
        lastCost: new Decimal(47.25),
        lastStockDate: new Date(),
      },
    });

    console.log(
      `Set ${finishedProductAlpha.name} to 3 units in ${testBranch.name} for high-priority AI testing`
    );
  }

  // Make Raw Material A medium priority (6-10 units)
  const rawMaterialA = items.find((item) => item.sku === "RM001");
  if (rawMaterialA) {
    const testBranch = branches[1];

    await prisma.stock.update({
      where: {
        itemId_branchId: {
          itemId: rawMaterialA.id,
          branchId: testBranch.id,
        },
      },
      data: {
        quantity: new Decimal(8), // Medium stock - should trigger medium urgency
        availableQty: new Decimal(8),
        averageCost: new Decimal(25.75),
        lastCost: new Decimal(26.0),
        lastStockDate: new Date(),
      },
    });

    console.log(
      `Set ${rawMaterialA.name} to 8 units in ${testBranch.name} for medium-priority AI testing`
    );
  }

  console.log("Database seeding completed successfully!");
  console.log("\nSeed data summary:");
  console.log(`- Branches: ${branches.length}`);
  console.log(`- Items: ${items.length}`);
  console.log(`- Suppliers: ${suppliers.length}`);
  console.log(`- Users: ${users.length}`);
  console.log(`- Stock records: ${stockCount}`);
  console.log(`- Item-supplier relationships: ${itemSuppliers.length}`);
  console.log(`- Historical purchase requests: ${purchaseRequests.length}`);
  console.log(`- Historical goods receipts: ${goodsReceipts.length}`);
  console.log(
    `- Historical material requisitions: ${materialRequisitions.length}`
  );
  console.log(`- Low stock items updated: ${lowStockUpdates.length}`);
  console.log(`- AI suggestions: ${aiSuggestions.length}`);
  console.log("\nLow stock items for AI testing:");
  lowStockUpdates.forEach((update) => console.log(`  - ${update}`));
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
