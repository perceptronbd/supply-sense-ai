import { PrismaClient } from '@supplysense/prisma-client';
import { config } from "dotenv";
import { seedCompanies } from './company.seed';
import { seedCompanySubscriptions } from './companySubscription.seed';
import { seedPermissions } from './permission.seed';
import { seedRoles } from './role.seed';
import { seedSubscriptionPlans } from './subscriptionPlan.seed';
import { seedUsers } from './user.seed';

config();
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // 1. Seed Companies (foundational data)
    console.log('1️⃣ Seeding companies...');
    const companies = await seedCompanies(prisma);
    console.log();

    // 2. Seed Subscription Plans (needed for company subscriptions)
    console.log('2️⃣ Seeding subscription plans...');
    const subscriptionPlans = await seedSubscriptionPlans(prisma);
    console.log();

    // 3. Seed Permissions (needed for roles)
    console.log('3️⃣ Seeding permissions...');
    const permissions = await seedPermissions(prisma);
    console.log();

    // 4. Seed Roles (depends on companies and permissions)
    console.log('4️⃣ Seeding roles...');
    const roles = await seedRoles(prisma, companies, permissions);
    console.log();

    // 5. Seed Users (depends on companies and roles)
    console.log('5️⃣ Seeding users...');
    const users = await seedUsers(prisma, companies, roles);
    console.log();

    // 6. Seed Company Subscriptions (depends on companies and subscription plans)
    console.log('6️⃣ Seeding company subscriptions...');
    const subscriptions = await seedCompanySubscriptions(prisma, companies, subscriptionPlans);
    console.log();

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📈 Summary:');
    console.log(`   • ${companies.length} companies created`);
    console.log(`   • ${subscriptionPlans.length} subscription plans created`);
    console.log(`   • ${permissions.length} permissions created`);
    console.log(`   • ${roles.length} roles created`);
    console.log(`   • ${users.length} users created`);
    console.log(`   • ${subscriptions.length} company subscriptions created`);
    
    console.log('\n🔐 Test Login Credentials:');
    console.log('='.repeat(50));
    companies.forEach((company, index) => {
      console.log(`\n🏢 ${company.name}:`);
      console.log(`   Admin:    ${company.contactEmail} / Admin@123`);
      console.log(`   Manager:  manager@${company.contactEmail.split('@')[1]} / Manager@123`);
      console.log(`   Employee: employee@${company.contactEmail.split('@')[1]} / Employee@123`);
    });
    console.log('\n' + '='.repeat(50));

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
