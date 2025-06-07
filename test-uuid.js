// Quick script to test UUID generation and get sample IDs
const { PrismaClient } = require('./generated/prisma/client.js');

const prisma = new PrismaClient();

async function testUUIDs() {
  try {
    console.log('Testing UUID generation...\n');

    // Get sample branch and item IDs
    const branches = await prisma.branch.findMany({ take: 2 });
    const items = await prisma.item.findMany({ take: 2 });

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

    console.log('\n✅ UUID test completed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testUUIDs();
