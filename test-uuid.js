// Quick script to test UUID generation and get sample IDs
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testUUIDs() {
  try {
    console.log('Testing UUID generation...\n');

    // Get sample branch, item, and supplier IDs
    const branches = await prisma.branch.findMany({ take: 2 });
    const items = await prisma.item.findMany({ take: 2 });
    const suppliers = await prisma.supplier.findMany({ take: 3 });

    console.log('Sample Branch IDs:');
    for (const branch of branches) {
      console.log(`- ${branch.id} (${branch.name})`);
      console.log(
        `  UUID format check: ${/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          branch.id
        )}`
      );
    }

    console.log('\nSample Item IDs:');
    for (const item of items) {
      console.log(`- ${item.id} (${item.name})`);
      console.log(
        `  UUID format check: ${/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          item.id
        )}`
      );
    }

    console.log('\nSample Supplier IDs:');
    for (const supplier of suppliers) {
      console.log(`- ${supplier.id} (${supplier.name})`);
      console.log(
        `  UUID format check: ${/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          supplier.id
        )}`
      );
    }

    console.log('\n✅ UUID test completed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testUUIDs();
