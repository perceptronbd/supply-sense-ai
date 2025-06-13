'use client';

import { Card, CardBody, CardHeader } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Button } from '../../components/ui/Button';
import { Text } from '../../components/ui/Text';
import { ROUTE_PATHS } from '../../config/routes';
import type { RootState } from '../../store/store';

export default function DashboardPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  return (
    <main className="p-6 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <Text variant="headerSmall" weight="bold" color="default" as="h1">
            Dashboard
          </Text>
          <Text variant="bodyBase" color="muted" className="mt-2" as="p">
            Welcome back, {user?.firstName} {user?.lastName}
          </Text>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-content1 border border-divider">
            <CardBody className="text-center p-6">
              <Text
                variant="titleMedium"
                weight="semiBold"
                color="default"
                className="mb-2"
                as="h3"
              >
                Purchase Requests
              </Text>
              <Text variant="display" weight="bold" color="primary" as="p">
                24
              </Text>
              <Text variant="bodySmall" color="muted" as="p">
                Active requests
              </Text>
            </CardBody>
          </Card>

          <Card className="bg-content1 border border-divider">
            <CardBody className="text-center p-6">
              <Text
                variant="titleMedium"
                weight="semiBold"
                color="default"
                className="mb-2"
                as="h3"
              >
                Purchase Orders
              </Text>
              <Text variant="display" weight="bold" color="success" as="p">
                18
              </Text>
              <Text variant="bodySmall" color="muted" as="p">
                In progress
              </Text>
            </CardBody>
          </Card>

          <Card className="bg-content1 border border-divider">
            <CardBody className="text-center p-6">
              <Text
                variant="titleMedium"
                weight="semiBold"
                color="default"
                className="mb-2"
                as="h3"
              >
                Goods Receipts
              </Text>
              <Text variant="display" weight="bold" color="secondary" as="p">
                12
              </Text>
              <Text variant="bodySmall" color="muted" as="p">
                Pending review
              </Text>
            </CardBody>
          </Card>

          <Card className="bg-content1 border border-divider">
            <CardBody className="text-center p-6">
              <Text
                variant="titleMedium"
                weight="semiBold"
                color="default"
                className="mb-2"
                as="h3"
              >
                AI Insights
              </Text>
              <Text variant="display" weight="bold" color="warning" as="p">
                7
              </Text>
              <Text variant="bodySmall" color="muted" as="p">
                Recommendations
              </Text>
            </CardBody>
          </Card>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-content1 border border-divider">
            <CardHeader className="pb-3">
              <Text variant="titleLarge" weight="semiBold" color="default" as="h3">
                User Information
              </Text>
            </CardHeader>
            <CardBody>
              <dl className="space-y-3">
                <div className="flex gap-2">
                  <dt>
                    <Text variant="bodyBase" weight="medium" color="default" as="span">
                      Email:
                    </Text>
                  </dt>
                  <dd>
                    <Text variant="bodyBase" color="muted" as="span">
                      {user?.email}
                    </Text>
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt>
                    <Text variant="bodyBase" weight="medium" color="default" as="span">
                      Role:
                    </Text>
                  </dt>
                  <dd>
                    <Text variant="bodyBase" color="muted" as="span">
                      {user?.role}
                    </Text>
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt>
                    <Text variant="bodyBase" weight="medium" color="default" as="span">
                      Branch ID:
                    </Text>
                  </dt>
                  <dd>
                    <Text variant="bodyBase" color="muted" as="span">
                      {user?.branchId}
                    </Text>
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt>
                    <Text variant="bodyBase" weight="medium" color="default" as="span">
                      Status:
                    </Text>
                  </dt>
                  <dd>
                    <Text variant="bodyBase" color="success" as="span">
                      Active
                    </Text>
                  </dd>
                </div>
              </dl>
            </CardBody>
          </Card>

          <Card className="bg-content1 border border-divider">
            <CardHeader className="pb-3">
              <Text variant="titleLarge" weight="semiBold" color="default" as="h3">
                Quick Actions
              </Text>
            </CardHeader>
            <CardBody className="space-y-3">
              <Button
                color="primary"
                variant="flat"
                className="w-full justify-start"
                onPress={() => router.push(`${ROUTE_PATHS.PURCHASE_REQUESTS}/create`)}
              >
                Create Purchase Request
              </Button>
              <Button
                color="secondary"
                variant="flat"
                className="w-full justify-start"
                onPress={() => router.push(ROUTE_PATHS.PURCHASE_ORDERS)}
              >
                View Purchase Orders
              </Button>
              <Button
                color="default"
                variant="flat"
                className="w-full justify-start"
                onPress={() => router.push(ROUTE_PATHS.GOODS_RECEIPTS)}
              >
                Check Goods Receipts
              </Button>
              <Button
                color="warning"
                variant="flat"
                className="w-full justify-start"
                onPress={() => router.push(ROUTE_PATHS.CHAT)}
              >
                AI Assistant
              </Button>
            </CardBody>
          </Card>
        </section>
      </div>
    </main>
  );
}
