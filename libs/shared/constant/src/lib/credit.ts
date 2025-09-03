import { SubscriptionPlans } from '@supplysense/prisma-client';

export const CREDIT = {
  [SubscriptionPlans.TRIAL]: {
    name: SubscriptionPlans.TRIAL,
    priceMonthly: 0,
    priceYearly: 0,
    credits: 200, // Set a sensible default
  },
  [SubscriptionPlans.STARTER]: {
    name: SubscriptionPlans.STARTER,
    priceMonthly: 9.99,
    priceYearly: 99.99,
    credits: 500,
  },
  [SubscriptionPlans.BUSINESS]: {
    name: SubscriptionPlans.BUSINESS,
    priceMonthly: 99.99,
    priceYearly: 999.99,
    credits: 5000,
  },
};
