'use client';

import AuthGuard from '@/components/AuthGuard';
import { ArrowLeftIcon } from '@/components/icons';
import { DrawingLogo } from '@/components/ui/DrawingLogo';
import { PermissionGuard } from '@/components/ui/PermissionGuard';
import { Text } from '@/components/ui/Text';
import { type Supplier, useGetSupplierQuery } from '@/store/api/supplierApi';
import { Button } from '@heroui/react';
import { SUPPLIER_PERMISSIONS } from '@supplysense/types';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { SupplierForm } from '../../components/SupplierForm';

interface EditSupplierPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditSupplierPage({ params }: EditSupplierPageProps) {
  const router = useRouter();
  const { id } = use(params);

  // Fetch supplier data
  const { data: supplier, isLoading, error, refetch } = useGetSupplierQuery(id);

  const handleSuccess = (updatedSupplier: Supplier) => {
    // Navigate to the supplier's detail page
    router.push(`/suppliers/${updatedSupplier.id}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <DrawingLogo size={60} variant="primary" speed="fast" showFill={true} />
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  // Error state
  if (error || !supplier) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="py-12 text-center">
              <Text variant="bodyLarge" color="danger" className="mb-4">
                Failed to load supplier details
              </Text>
              <Button color="primary" variant="flat" onPress={() => refetch()}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="light"
                size="sm"
                startContent={<ArrowLeftIcon />}
                onPress={() => router.push(`/suppliers/${id}`)}
              >
                Back to Supplier Details
              </Button>
            </div>

            <Text variant="headerSmall" weight="bold" color="default" as="h1">
              Edit Supplier: {supplier.name}
            </Text>
            <Text variant="bodyBase" color="muted" className="mt-2" as="p">
              Update supplier information
            </Text>
          </header>

          {/* Edit Form */}
          <section>
            <PermissionGuard permission={SUPPLIER_PERMISSIONS.UPDATE}>
              <SupplierForm supplier={supplier} onSuccess={handleSuccess} />
            </PermissionGuard>
          </section>
        </div>
      </main>
    </AuthGuard>
  );
}
