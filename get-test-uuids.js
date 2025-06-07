// Script to get actual UUIDs from the database
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getTestData() {
  try {
    console.log('🔍 Fetching actual UUIDs from database...\n');

    // Get some branches
    const branches = await prisma.branch.findMany({ take: 2 });
    console.log('📍 Branches:');
    for (const branch of branches) {
      console.log(`  - ${branch.name}: ${branch.id}`);
    }

    // Get some items
    const items = await prisma.item.findMany({ take: 3 });
    console.log('\n📦 Items:');
    for (const item of items) {
      console.log(`  - ${item.name}: ${item.id}`);
    }

    // Get some suppliers
    const suppliers = await prisma.supplier.findMany({ take: 2 });
    console.log('\n🏢 Suppliers:');
    for (const supplier of suppliers) {
      console.log(`  - ${supplier.name}: ${supplier.id}`);
    }

    // Get some users
    const users = await prisma.user.findMany({ take: 2 });
    console.log('\n👤 Users:');
    for (const user of users) {
      console.log(`  - ${user.username}: ${user.id}`);
    }

    if (branches.length > 0 && items.length > 0 && suppliers.length > 0 && users.length > 0) {
      console.log('\n✅ Test data structure with real UUIDs:');
      console.log(
        JSON.stringify(
          {
            purchaseRequest: {
              description: 'Test Purchase Request',
              requestedById: users[0].id,
              branchId: branches[0].id,
              items: [
                {
                  itemId: items[0].id,
                  quantity: 10,
                  unitPrice: 25.5,
                  notes: 'Test item for PR',
                },
              ],
            },
            purchaseOrder: {
              title: 'Test Purchase Order',
              supplierId: suppliers[0].id,
              expectedDeliveryDate: '2024-06-15T10:00:00Z',
              branchId: branches[0].id,
              paymentTerms: 'Net 30 days',
              deliveryTerms: 'FOB Origin',
              notes: 'Test PO notes',
              items: [
                {
                  itemId: items[0].id,
                  orderedQty: 5,
                  unitPrice: 30.0,
                  deliveryDate: '2024-06-15T10:00:00Z',
                  remarks: 'Test item for PO',
                },
              ],
            },
          },
          null,
          2
        )
      );
    }
  } catch (error) {
    console.error('❌ Error fetching test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getTestData();
