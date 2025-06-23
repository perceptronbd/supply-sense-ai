'use client';

import AuthGuard from '@/components/AuthGuard';
import { ArrowLeftIcon } from '@/components/icons';
import { DrawingLogo } from '@/components/ui/DrawingLogo';
import { Text } from '@/components/ui/Text';
import { useGetBranchQuery } from '@/store/api/branchApi';
import { Button, Card, CardBody, CardHeader, Chip } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface BranchDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function BranchDetailsPage({ params }: BranchDetailsPageProps) {
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
    data: branch,
    isLoading,
    error,
    refetch,
  } = useGetBranchQuery(resolvedParams?.id || '', {
    skip: !isMounted || !resolvedParams,
  });

  // Status chip component
  const StatusChip = ({ isActive }: { isActive: boolean }) => (
    <Chip color={isActive ? 'success' : 'default'} variant="flat" size="sm">
      {isActive ? 'Active' : 'Inactive'}
    </Chip>
  );

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
                    Failed to load branch details
                  </Text>
                  <Button color="primary" variant="flat" onPress={() => refetch()}>
                    Try Again
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Branch Details */}
          {!isLoading && !error && branch && (
            <div className="space-y-6">
              {/* Header */}
              <header>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <Text variant="headerMedium" weight="bold" color="default" as="h1">
                      {branch.name}
                    </Text>
                    <Text variant="bodyLarge" color="muted" className="mt-1" as="p">
                      Code: {branch.code}
                    </Text>
                  </div>
                  <StatusChip isActive={branch.isActive} />
                </div>
                {branch.description && (
                  <Text variant="bodyMedium" color="default" as="p">
                    {branch.description}
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
                          Branch Name
                        </Text>
                      </dt>
                      <dd>
                        <Text variant="bodyMedium" weight="medium">
                          {branch.name}
                        </Text>
                      </dd>
                    </section>
                    <section>
                      <dt>
                        <Text variant="bodySmall" color="muted">
                          Branch Code
                        </Text>
                      </dt>
                      <dd>
                        <Text variant="bodyMedium" weight="medium">
                          {branch.code}
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
                        <StatusChip isActive={branch.isActive} />
                      </dd>
                    </section>
                    {branch.description && (
                      <section className="md:col-span-2">
                        <dt>
                          <Text variant="bodySmall" color="muted">
                            Description
                          </Text>
                        </dt>
                        <dd>
                          <Text variant="bodyMedium">{branch.description}</Text>
                        </dd>
                      </section>
                    )}
                  </dl>
                </CardBody>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <Text variant="titleMedium" weight="semiBold">
                    Contact Information
                  </Text>
                </CardHeader>
                <CardBody>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {branch.address && (
                      <section className="md:col-span-2">
                        <dt>
                          <Text variant="bodySmall" color="muted">
                            Address
                          </Text>
                        </dt>
                        <dd>
                          <Text variant="bodyMedium" weight="medium">
                            {branch.address}
                          </Text>
                        </dd>
                      </section>
                    )}
                    {branch.phone && (
                      <section>
                        <dt>
                          <Text variant="bodySmall" color="muted">
                            Phone
                          </Text>
                        </dt>
                        <dd>
                          <Text variant="bodyMedium" weight="medium">
                            {branch.phone}
                          </Text>
                        </dd>
                      </section>
                    )}
                    {branch.email && (
                      <section>
                        <dt>
                          <Text variant="bodySmall" color="muted">
                            Email
                          </Text>
                        </dt>
                        <dd>
                          <Text variant="bodyMedium" weight="medium">
                            {branch.email}
                          </Text>
                        </dd>
                      </section>
                    )}
                    {branch.manager && (
                      <section className="md:col-span-2">
                        <dt>
                          <Text variant="bodySmall" color="muted">
                            Manager
                          </Text>
                        </dt>
                        <dd>
                          <Text variant="bodyMedium" weight="medium">
                            {branch.manager.firstName} {branch.manager.lastName}
                          </Text>
                          {branch.manager.email && (
                            <Text variant="bodySmall" color="muted" className="mt-1">
                              {branch.manager.email}
                            </Text>
                          )}
                        </dd>
                      </section>
                    )}
                    {!branch.address && !branch.phone && !branch.email && !branch.manager && (
                      <section className="md:col-span-2">
                        <Text variant="bodyMedium" color="muted" className="italic">
                          No contact information available
                        </Text>
                      </section>
                    )}
                  </dl>
                </CardBody>
              </Card>

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
                          {new Date(branch.createdAt).toLocaleString()}
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
                          {new Date(branch.updatedAt).toLocaleString()}
                        </Text>
                      </dd>
                    </section>
                  </dl>
                </CardBody>
              </Card>
            </div>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}
