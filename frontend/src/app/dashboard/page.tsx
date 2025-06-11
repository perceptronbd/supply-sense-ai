'use client';

import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import AuthGuard from '../../components/AuthGuard';
import { Text } from '../../components/ui/Text';
import type { RootState } from '../../store/store';

export default function DashboardPage() {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  return (
    <AuthGuard requireAuth={true}>
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <Text variant="headerSmall" weight="bold" as="h1">
              Dashboard
            </Text>
            <Text variant="bodyBase" className="text-gray-600 mt-2" as="p">
              Welcome back, {user?.firstName} {user?.lastName}
            </Text>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardBody className="text-center p-6">
                <Text
                  variant="titleMedium"
                  weight="semiBold"
                  className="text-gray-800 mb-2"
                  as="h3"
                >
                  Purchase Requests
                </Text>
                <Text variant="display" weight="bold" className="text-blue-600" as="p">
                  24
                </Text>
                <Text variant="bodySmall" className="text-gray-500" as="p">
                  Active requests
                </Text>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="text-center p-6">
                <Text
                  variant="titleMedium"
                  weight="semiBold"
                  className="text-gray-800 mb-2"
                  as="h3"
                >
                  Purchase Orders
                </Text>
                <Text variant="display" weight="bold" className="text-green-600" as="p">
                  18
                </Text>
                <Text variant="bodySmall" className="text-gray-500" as="p">
                  In progress
                </Text>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="text-center p-6">
                <Text
                  variant="titleMedium"
                  weight="semiBold"
                  className="text-gray-800 mb-2"
                  as="h3"
                >
                  Goods Receipts
                </Text>
                <Text variant="display" weight="bold" className="text-purple-600" as="p">
                  12
                </Text>
                <Text variant="bodySmall" className="text-gray-500" as="p">
                  Pending review
                </Text>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="text-center p-6">
                <Text
                  variant="titleMedium"
                  weight="semiBold"
                  className="text-gray-800 mb-2"
                  as="h3"
                >
                  AI Insights
                </Text>
                <Text variant="display" weight="bold" className="text-orange-600" as="p">
                  7
                </Text>
                <Text variant="bodySmall" className="text-gray-500" as="p">
                  Recommendations
                </Text>
              </CardBody>
            </Card>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <Text variant="titleLarge" weight="semiBold" as="h3">
                  User Information
                </Text>
              </CardHeader>
              <CardBody className="space-y-3">
                <div>
                  <Text variant="bodyBase" weight="medium" className="text-gray-700" as="span">
                    Email:
                  </Text>
                  <Text variant="bodyBase" className="ml-2 text-gray-600" as="span">
                    {user?.email}
                  </Text>
                </div>
                <div>
                  <Text variant="bodyBase" weight="medium" className="text-gray-700" as="span">
                    Role:
                  </Text>
                  <Text variant="bodyBase" className="ml-2 text-gray-600" as="span">
                    {user?.role}
                  </Text>
                </div>
                <div>
                  <Text variant="bodyBase" weight="medium" className="text-gray-700" as="span">
                    Branch ID:
                  </Text>
                  <Text variant="bodyBase" className="ml-2 text-gray-600" as="span">
                    {user?.branchId}
                  </Text>
                </div>
                <div>
                  <Text variant="bodyBase" weight="medium" className="text-gray-700" as="span">
                    Status:
                  </Text>
                  <Text
                    variant="bodyBase"
                    className={`ml-2 ${user?.isActive ? 'text-green-600' : 'text-red-600'}`}
                    as="span"
                  >
                    {user?.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <Text variant="titleLarge" weight="semiBold" as="h3">
                  Quick Actions
                </Text>
              </CardHeader>
              <CardBody className="space-y-3">
                <Button
                  color="primary"
                  variant="flat"
                  className="w-full justify-start"
                  onPress={() => router.push('/purchase-requests')}
                >
                  Create Purchase Request
                </Button>
                <Button
                  color="secondary"
                  variant="flat"
                  className="w-full justify-start"
                  onPress={() => router.push('/purchase-orders')}
                >
                  View Purchase Orders
                </Button>
                <Button
                  color="success"
                  variant="flat"
                  className="w-full justify-start"
                  onPress={() => router.push('/goods-receipts')}
                >
                  Manage Goods Receipts
                </Button>
              </CardBody>
            </Card>
          </section>
        </div>
      </main>
    </AuthGuard>
  );
}
