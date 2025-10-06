'use client';

import { Card, CardBody } from '@heroui/react';
import { useSelector } from 'react-redux';
import { Text } from '@/components/ui/Text';
import type { RootState } from '@/store/store';

export default function DashboardPage() {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <Text variant="headerLarge" as="h1" className="text-foreground mb-2">
            Welcome to SupplySense
          </Text>
          <Text variant="bodyLarge" as="p" className="text-foreground-600">
            Hello {user?.firstName} {user?.lastName}! Your supply chain management dashboard is
            ready.
          </Text>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardBody className="p-6">
              <Text variant="titleMedium" as="h2" className="text-foreground mb-4">
                Quick Actions
              </Text>
              <div className="space-y-3">
                <div className="p-3 bg-primary-50 rounded-lg">
                  <Text variant="bodyMedium" as="p" className="text-primary-700">
                    🛒 Create Purchase Request
                  </Text>
                </div>
                <div className="p-3 bg-secondary-50 rounded-lg">
                  <Text variant="bodyMedium" as="p" className="text-secondary-700">
                    📦 Manage Items
                  </Text>
                </div>
                <div className="p-3 bg-success-50 rounded-lg">
                  <Text variant="bodyMedium" as="p" className="text-success-700">
                    🏢 View Branches
                  </Text>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <Text variant="titleMedium" as="h2" className="text-foreground mb-4">
                Recent Activity
              </Text>
              <div className="space-y-3">
                <Text variant="bodySmall" as="p" className="text-foreground-600">
                  No recent activity yet. Start by creating your first purchase request or adding
                  items to your inventory.
                </Text>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <Text variant="titleMedium" as="h2" className="text-foreground mb-4">
                Getting Started
              </Text>
              <div className="space-y-3">
                <div className="p-3 bg-warning-50 rounded-lg">
                  <Text variant="bodySmall" as="p" className="text-warning-700">
                    1. Set up your branches
                  </Text>
                </div>
                <div className="p-3 bg-primary-50 rounded-lg">
                  <Text variant="bodySmall" as="p" className="text-primary-700">
                    2. Add your suppliers
                  </Text>
                </div>
                <div className="p-3 bg-success-50 rounded-lg">
                  <Text variant="bodySmall" as="p" className="text-success-700">
                    3. Create your item catalog
                  </Text>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </main>
  );
}
