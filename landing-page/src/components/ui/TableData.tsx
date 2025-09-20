import { ReactNode } from 'react';
import { Icons } from '../icons';

interface TableRowData {
  id: number;
  featureName: string;
  description: string;
  values: [ReactNode | string, ReactNode | string, ReactNode | string];
  keys: [string, string, string];
}

export const tableData: TableRowData[] = [
  {
    id: 1,
    featureName: 'Credits / Month',
    description: 'The number of credits you can use monthly for AI tasks, searches, or analysis.',
    values: ['500', '5000', 'Unlimited'],
    keys: ['Starter', 'Business', 'Enterprise'],
  },
  {
    id: 2,
    featureName: 'Api Access',
    description:
      'Ability to connect your own systems to SupplySense via API for automated workflows.',
    keys: ['Starter', 'Business', 'Enterprise'],
    values: [
      <Icons.Cross className="w-5 h-5 text-danger" />,
      <Icons.Verified className="w-5 h-5 text-success" />,
      <Icons.Verified className="w-5 h-5 text-success" />,
    ],
  },
  {
    id: 3,
    featureName: 'API Requests Limit/Month',
    description: 'Maximum number of API calls you can make per month.',
    keys: ['Starter', 'Business', 'Enterprise'],
    values: [<Icons.Cross className="w-5 h-5 text-danger" />, '50,000', 'Unlimited'],
  },
  {
    id: 4,
    featureName: 'Bulk Import/Export',
    description: 'Upload or download large datasets (e.g., company lists) in one go.',
    keys: ['Starter', 'Business', 'Enterprise'],
    values: [
      <Icons.Cross className="w-5 h-5 text-danger" />,
      <Icons.Verified className="w-5 h-5 text-success" />,
      <Icons.Verified className="w-5 h-5 text-success" />,
    ],
  },
  {
    id: 5,
    featureName: 'Priority Support',
    description: 'Faster response times from our support team.',
    keys: ['Starter', 'Business', 'Enterprise'],
    values: [
      <Icons.Cross className="w-5 h-5 text-danger" />,
      <Icons.Verified className="w-5 h-5 text-success" />,
      <Icons.Verified className="w-5 h-5 text-success" />,
    ],
  },
  {
    id: 6,
    featureName: 'Early Beta Access',
    description: 'Get early access to upcoming features before public release.',
    keys: ['Starter', 'Business', 'Enterprise'],
    values: [
      <Icons.Cross className="w-5 h-5 text-danger" />,
      <Icons.Verified className="w-5 h-5 text-success" />,
      <Icons.Verified className="w-5 h-5 text-success" />,
    ],
  },
  {
    id: 7,
    featureName: 'Custom Integrations',
    description: 'Tailored integrations with your internal tools or platforms.',
    keys: ['Starter', 'Business', 'Enterprise'],
    values: [
      <Icons.Cross className="w-5 h-5 text-danger" />,
      <Icons.Cross className="w-5 h-5 text-danger" />,
      <Icons.Verified className="w-5 h-5 text-success" />,
    ],
  },
  {
    id: 8,
    featureName: 'Dedicated Manager',
    description: 'A dedicated account manager for strategic guidance and onboarding.',
    keys: ['Starter', 'Business', 'Enterprise'],
    values: [
      <Icons.Cross className="w-5 h-5 text-danger" />,
      <Icons.Cross className="w-5 h-5 text-danger" />,
      <Icons.Verified className="w-5 h-5 text-success" />,
    ],
  },
  {
    id: 9,
    featureName: 'Private Model Tuning',
    description: "Fine-tuning AI models specifically for your company's needs.",
    keys: ['Starter', 'Business', 'Enterprise'],
    values: [
      <Icons.Cross className="w-5 h-5 text-danger" />,
      <Icons.Cross className="w-5 h-5 text-danger" />,
      <Icons.Verified className="w-5 h-5 text-success" />,
    ],
  },
  {
    id: 10,
    featureName: 'Quarterly Review',
    description: 'Quarterly performance and strategy review with our team.',
    keys: ['Starter', 'Business', 'Enterprise'],
    values: [
      <Icons.Cross className="w-5 h-5 text-danger" />,
      <Icons.Cross className="w-5 h-5 text-danger" />,
      <Icons.Verified className="w-5 h-5 text-success" />,
    ],
  },
  {
    id: 11,
    featureName: 'SLA Uptime Guarantee',
    description: 'Guaranteed system uptime in your service-level agreement.',
    keys: ['Starter', 'Business', 'Enterprise'],
    values: ['99.5%', '99.9%', '99.99%'],
  },
];
