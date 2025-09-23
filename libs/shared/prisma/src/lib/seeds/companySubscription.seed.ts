import { BillingCycle, PrismaClient, SubscriptionPlans, SubscriptionStatus } from '@supplysense/prisma-client';

export async function seedCompanySubscriptions(prisma: PrismaClient, companies: any[], subscriptionPlans: any[]) {
  console.log('Seeding company subscriptions...');

  const subscriptionsData: any[] = [];

  // Get the starter plan
  const starterPlan = subscriptionPlans.find(plan => plan.name === SubscriptionPlans.STARTER);

  if (!starterPlan) {
    throw new Error('Starter subscription plan not found');
  }

  for (const company of companies) {
    // Create subscription for each company with STARTER plan
    const subscription = {
      id: `subscription-${company.id}`,
      status: SubscriptionStatus.ACTIVE,
      billingCycle: BillingCycle.MONTHLY,
      startPeriod: new Date(),
      endPeriod: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      totalCredits: starterPlan.credits,
      remainingCredits: starterPlan.credits,
      isCancelAtPeriodEnd: false,
      stripeSubscriptionId: `sub_${company.id}_${Date.now()}`, // Mock Stripe subscription ID
      companyId: company.id,
      subscriptionPlanId: starterPlan.id,
    };

    const createdSubscription = await prisma.companySubscription.upsert({
      where: { companyId: company.id },
      update: subscription,
      create: subscription,
    });

    subscriptionsData.push(createdSubscription);

    // Create subscription history record
    const subscriptionHistory = {
      id: `subscription-history-${company.id}`,
      status: SubscriptionStatus.ACTIVE,
      billingCycle: BillingCycle.MONTHLY,
      startPeriod: new Date(),
      endPeriod: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isCancelAtPeriodEnd: false,
      stripeSubscriptionId: `sub_hist_${company.id}_${Date.now()}`, // Mock Stripe subscription ID
      companyId: company.id,
      subscriptionPlanId: starterPlan.id,
    };

    await prisma.companySubscriptionHistory.upsert({
      where: { id: subscriptionHistory.id },
      update: subscriptionHistory,
      create: subscriptionHistory,
    });

    // Create a sample successful purchase history record
    const purchaseHistory = {
      id: `purchase-${company.id}`,
      amount: starterPlan.priceMonthly,
      currency: 'USD',
      paymentStatus: 'SUCCESS' as const,
      stripePaymentIntentId: `pi_${company.id}_${Date.now()}`, // Mock Stripe payment intent ID
      paymentDate: new Date(),
      subscriptionId: createdSubscription.id,
      companyId: company.id,
      companySubscriptionHistoryId: subscriptionHistory.id,
    };

    await prisma.purchaseHistory.create({
      data: purchaseHistory,
    });
  }

  console.log(`✅ Seeded ${subscriptionsData.length} company subscriptions with STARTER plan`);
  console.log('📊 Subscription Details:');
  companies.forEach((company, index) => {
    console.log(`  - ${company.name}: STARTER plan (${starterPlan.credits} credits, $${starterPlan.priceMonthly}/month)`);
  });

  return subscriptionsData;
}
