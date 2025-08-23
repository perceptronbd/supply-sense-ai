import { PrismaClient, SubscriptionPlans } from '@prisma/client';

export async function seedSubscriptionPlans(prisma: PrismaClient) {
  console.log('Seeding subscription plans...');

  const subscriptionPlans = [
    {
      id: '660e8400-e29b-41d4-a716-446655440001',
      name: SubscriptionPlans.STARTER,
      priceMonthly: 29.99,
      credits: 1000,
      priceYearly: 299.99,
      apiRequestsLimit: 1000,
      roleBasedAccess: false,
      advancedFiltering: false,
      bulkImportExport: false,
      apiAccess: false,
      prioritySupport: false,
      customIntegrations: false,
      dedicatedManager: false,
      privateModelTuning: false,
      slaUptimeGuarantee: false,
      earlyBetaAccess: false,
      quarterlyReview: false,
      isActive: true,
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440002',
      name: SubscriptionPlans.BUSINESS,
      priceMonthly: 99.99,
      credits: 5000,
      priceYearly: 999.99,
  
      apiRequestsLimit: 5000,
      roleBasedAccess: true,
      advancedFiltering: true,
      bulkImportExport: true,
      apiAccess: true,
      prioritySupport: false,
      customIntegrations: false,
      dedicatedManager: false,
      privateModelTuning: false,
      slaUptimeGuarantee: false,
      earlyBetaAccess: true,
      quarterlyReview: false,
      isActive: true,
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440003',
      name: SubscriptionPlans.ENTERPRISE,
      priceMonthly: 299.99,
      credits: 20000,
      priceYearly: 2999.99, 
      apiRequestsLimit: 20000,
      roleBasedAccess: true,
      advancedFiltering: true,
      bulkImportExport: true,
      apiAccess: true,
      prioritySupport: true,
      customIntegrations: true,
      dedicatedManager: true,
      privateModelTuning: true,
      slaUptimeGuarantee: true,
      earlyBetaAccess: true,
      quarterlyReview: true,
      isActive: true,
    }
  ];

  for (const plan of subscriptionPlans) {
    await prisma.subscriptionPlan.upsert({
      where: { id: plan.id },
      update: plan,
      create: plan,
    });
  }

  console.log(`✅ Seeded ${subscriptionPlans.length} subscription plans`);
  return subscriptionPlans;
}
