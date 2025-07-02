'use client';

import AuthGuard from '@/components/AuthGuard';
import { Text } from '@/components/ui/Text';
import { usePermissions } from '@/hooks/usePermissions';
import { type Supplier } from '@/store/api/supplierApi';
import { SUPPLIER_PERMISSIONS } from '@supplysense/types';
import { useRouter } from 'next/navigation';
import { SupplierForm } from '../components/SupplierForm';

export default function CreateSupplierPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  const handleSuccess = (supplier: Supplier) => {
    // Navigate to the newly created supplier's detail page
    router.push(`/suppliers/${supplier.id}`);
  };

  return (
    <AuthGuard requireAuth={true}>
      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="mb-6">
            <Text variant="headerSmall" weight="bold" color="default" as="h1">
              Create New Supplier
            </Text>
            <Text variant="bodyBase" color="muted" className="mt-2" as="p">
              Add a new supplier to your vendor network
            </Text>
          </header>

          {/* Create Form */}
          <section>
            {hasPermission(SUPPLIER_PERMISSIONS.CREATE) ? (
              <SupplierForm onSuccess={handleSuccess} />
            ) : (
              <div className="flex items-center justify-center h-64">
                <Text variant="bodyLarge" className="text-danger" as="p">
                  You don't have permission to create suppliers
                </Text>
              </div>
            )}
          </section>
        </div>
      </main>
    </AuthGuard>
  );
}
