'use client';

import AuthGuard from '@/components/AuthGuard';
import { ArrowLeftIcon } from '@/components/icons';
import { DrawingLogo } from '@/components/ui/DrawingLogo';
import { Text } from '@/components/ui/Text';
import { type Item, useGetItemQuery } from '@/store/api/itemApi';
import { Button, Card, CardBody, CardHeader, Chip } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ItemDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ItemDetailsPage({ params }: ItemDetailsPageProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

  // Resolve params and ensure component is mounted before rendering
  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params;
      setResolvedParams(resolved);
      setIsMounted(true);
    };
    resolveParams();
  }, [params]);

  // API query
  const {
    data: item,
    isLoading,
    error,
    refetch,
  } = useGetItemQuery(
    { id: resolvedParams?.id || '', includeStock: true },
    { skip: !isMounted || !resolvedParams }
  );

  // Status chip component
  const StatusChip = ({ isActive }: { isActive: boolean }) => (
    <Chip color={isActive ? 'success' : 'default'} variant="flat" size="sm">
      {isActive ? 'Active' : 'Inactive'}
    </Chip>
  );
  // Stock display component
  const StockSection = ({ stock }: { stock?: Item['stock'] }) => {
    if (!stock) {
      return (
        <Card>
          <CardHeader>
            <Text variant="titleMedium" weight="semiBold">
              Stock Information
            </Text>
          </CardHeader>
          <CardBody>
            <Text variant="bodyMedium" color="muted">
              No stock data available
            </Text>
          </CardBody>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <Text variant="titleMedium" weight="semiBold">
            Stock Information
          </Text>
        </CardHeader>
        <CardBody>
          <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <section>
              <dt>
                <Text variant="bodySmall" color="muted">
                  Total Quantity
                </Text>
              </dt>
              <dd>
                <Text variant="bodyLarge" weight="semiBold" color="primary">
                  {stock.quantity}
                </Text>
              </dd>
            </section>
            <section>
              <dt>
                <Text variant="bodySmall" color="muted">
                  Available Quantity
                </Text>
              </dt>
              <dd>
                <Text variant="bodyLarge" weight="semiBold" color="success">
                  {stock.availableQty}
                </Text>
              </dd>
            </section>
            {stock.reservedQty && stock.reservedQty > 0 && (
              <section>
                <dt>
                  <Text variant="bodySmall" color="muted">
                    Reserved Quantity
                  </Text>
                </dt>
                <dd>
                  <Text variant="bodyLarge" weight="semiBold" color="warning">
                    {stock.reservedQty}
                  </Text>
                </dd>
              </section>
            )}
          </dl>
        </CardBody>
      </Card>
    );
  };

  // Don't render anything until mounted and params are resolved
  if (!isMounted || !resolvedParams) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <DrawingLogo size={60} variant="primary" speed="fast" showFill={true} />
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      <main className="p-6 bg-background min-h-screen">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <div className="mb-6">
            <Button
              variant="light"
              onPress={() => router.back()}
              startContent={<ArrowLeftIcon className="w-4 h-4" />}
            >
              Back
            </Button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <Card>
              <CardBody>
                <div className="flex justify-center items-center py-12">
                  <DrawingLogo size={60} variant="primary" speed="fast" showFill={true} />
                </div>
              </CardBody>
            </Card>
          )}

          {/* Error State */}
          {error && (
            <Card>
              <CardBody>
                <div className="text-center py-12">
                  <Text variant="bodyLarge" color="danger" className="mb-4">
                    Failed to load item details
                  </Text>
                  <Button color="primary" variant="flat" onPress={() => refetch()}>
                    Try Again
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Item Details */}
          {!isLoading && !error && item && (
            <div className="space-y-6">
              {/* Header */}
              <header>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <Text variant="headerMedium" weight="bold" color="default" as="h1">
                      {item.name}
                    </Text>
                    <Text variant="bodyLarge" color="muted" className="mt-1" as="p">
                      SKU: {item.sku}
                    </Text>
                  </div>
                  <StatusChip isActive={item.isActive} />
                </div>
                {item.description && (
                  <Text variant="bodyMedium" color="default" as="p">
                    {item.description}
                  </Text>
                )}
              </header>

              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <Text variant="titleMedium" weight="semiBold">
                    Basic Information
                  </Text>
                </CardHeader>
                <CardBody>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <section>
                      <dt>
                        <Text variant="bodySmall" color="muted">
                          Item Name
                        </Text>
                      </dt>
                      <dd>
                        <Text variant="bodyMedium" weight="medium">
                          {item.name}
                        </Text>
                      </dd>
                    </section>
                    <section>
                      <dt>
                        <Text variant="bodySmall" color="muted">
                          SKU
                        </Text>
                      </dt>
                      <dd>
                        <Text variant="bodyMedium" weight="medium">
                          {item.sku}
                        </Text>
                      </dd>
                    </section>
                    <section>
                      <dt>
                        <Text variant="bodySmall" color="muted">
                          Main Unit
                        </Text>
                      </dt>
                      <dd>
                        <Text variant="bodyMedium" weight="medium">
                          {item.mainUnit}
                        </Text>
                      </dd>
                    </section>
                    <section>
                      <dt>
                        <Text variant="bodySmall" color="muted">
                          Status
                        </Text>
                      </dt>
                      <dd>
                        <StatusChip isActive={item.isActive} />
                      </dd>
                    </section>
                    {item.description && (
                      <section className="md:col-span-2">
                        <dt>
                          <Text variant="bodySmall" color="muted">
                            Description
                          </Text>
                        </dt>
                        <dd>
                          <Text variant="bodyMedium">{item.description}</Text>
                        </dd>
                      </section>
                    )}
                  </dl>
                </CardBody>
              </Card>

              {/* Units Information */}
              <Card>
                <CardHeader>
                  <Text variant="titleMedium" weight="semiBold">
                    Units Information
                  </Text>
                </CardHeader>
                <CardBody>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <section>
                      <dt>
                        <Text variant="bodySmall" color="muted">
                          Main Unit
                        </Text>
                      </dt>
                      <dd>
                        <Text variant="bodyMedium" weight="medium">
                          {item.mainUnit}
                        </Text>
                      </dd>
                    </section>
                    {item.buyingUnit && (
                      <section>
                        <dt>
                          <Text variant="bodySmall" color="muted">
                            Buying Unit
                          </Text>
                        </dt>
                        <dd>
                          <Text variant="bodyMedium" weight="medium">
                            {item.buyingUnit}
                          </Text>
                        </dd>
                      </section>
                    )}
                    {item.transferUnit && (
                      <section>
                        <dt>
                          <Text variant="bodySmall" color="muted">
                            Transfer Unit
                          </Text>
                        </dt>
                        <dd>
                          <Text variant="bodyMedium" weight="medium">
                            {item.transferUnit}
                          </Text>
                        </dd>
                      </section>
                    )}
                    {item.usingUnit && (
                      <section>
                        <dt>
                          <Text variant="bodySmall" color="muted">
                            Using Unit
                          </Text>
                        </dt>
                        <dd>
                          <Text variant="bodyMedium" weight="medium">
                            {item.usingUnit}
                          </Text>
                        </dd>
                      </section>
                    )}
                  </dl>
                </CardBody>
              </Card>

              {/* Stock Information */}
              <StockSection stock={item.stock} />

              {/* Metadata */}
              <Card>
                <CardHeader>
                  <Text variant="titleMedium" weight="semiBold">
                    Metadata
                  </Text>
                </CardHeader>
                <CardBody>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <section>
                      <dt>
                        <Text variant="bodySmall" color="muted">
                          Created At
                        </Text>
                      </dt>
                      <dd>
                        <Text variant="bodyMedium">
                          {new Date(item.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </dd>
                    </section>
                    <section>
                      <dt>
                        <Text variant="bodySmall" color="muted">
                          Last Updated
                        </Text>
                      </dt>
                      <dd>
                        <Text variant="bodyMedium">
                          {new Date(item.updatedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </dd>
                    </section>
                  </dl>
                </CardBody>
              </Card>
            </div>
          )}

          {/* Not Found State */}
          {!isLoading && !error && !item && (
            <Card>
              <CardBody>
                <div className="text-center py-12">
                  <Text variant="bodyLarge" color="muted" className="mb-2">
                    Item not found
                  </Text>
                  <Text variant="bodyMedium" color="muted">
                    The item you're looking for doesn't exist or has been removed.
                  </Text>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}
