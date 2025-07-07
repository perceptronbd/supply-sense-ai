'use client';

import AuthGuard from '@/components/AuthGuard';
import { ArrowLeftIcon, EditIcon, TrashIcon } from '@/components/icons';
import { DrawingLogo } from '@/components/ui/DrawingLogo';
import { Text } from '@/components/ui/Text';
import { usePermissions } from '@/hooks/usePermissions';
import {
  useDeleteSupplierMutation,
  useGetSupplierQuery,
  useHardDeleteSupplierMutation,
} from '@/store/api/supplierApi';
import { Button, Card, CardBody, CardHeader, Chip, addToast } from '@heroui/react';
import { SUPPLIER_PERMISSIONS } from '@supplysense/types';
import { useRouter } from 'next/navigation';
import { use, useState } from 'react';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';

interface SupplierDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function SupplierDetailPage({ params }: SupplierDetailPageProps) {
  const router = useRouter();
  const { id } = use(params);
  const { hasPermission } = usePermissions();

  // State for delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'soft' | 'hard'>('soft');

  // Fetch supplier data
  const { data: supplier, isLoading, error, refetch } = useGetSupplierQuery(id);

  // Delete mutations
  const [deleteSupplier, { isLoading: isDeleting }] = useDeleteSupplierMutation();
  const [hardDeleteSupplier, { isLoading: isHardDeleting }] = useHardDeleteSupplierMutation();

  const handleEdit = () => {
    router.push(`/suppliers/${id}/edit`);
  };

  const handleDelete = (type: 'soft' | 'hard') => {
    setDeleteType(type);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!supplier) return;

    try {
      if (deleteType === 'hard') {
        await hardDeleteSupplier(supplier.id).unwrap();
        addToast({
          title: 'Supplier Deleted',
          description: `Supplier "${supplier.name}" has been permanently deleted.`,
          color: 'success',
          variant: 'flat',
        });
      } else {
        await deleteSupplier(supplier.id).unwrap();
        addToast({
          title: 'Supplier Deactivated',
          description: `Supplier "${supplier.name}" has been deactivated.`,
          color: 'success',
          variant: 'flat',
        });
      }

      // Navigate back to suppliers list
      router.push('/suppliers');
    } catch (err) {
      console.error('Delete supplier error:', err);
      addToast({
        title: 'Error',
        description: `Failed to ${deleteType === 'hard' ? 'delete' : 'deactivate'} supplier.`,
        color: 'danger',
        variant: 'flat',
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const handleDialogClose = () => {
    setIsDeleteDialogOpen(false);
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
          {/* Back button */}
          <div className="mb-6">
            <Button
              variant="light"
              onPress={() => router.push('/suppliers')}
              startContent={<ArrowLeftIcon className="w-4 h-4" />}
            >
              Back
            </Button>
          </div>

          {/* Supplier Details */}
          <div className="space-y-6">
            {/* Header */}
            <header>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Text variant="headerMedium" weight="bold" color="default" as="h1">
                    {supplier.name}
                  </Text>
                  <Text variant="bodyLarge" color="muted" className="mt-1" as="p">
                    Code: {supplier.code}
                  </Text>
                </div>
                <div className="flex items-center gap-3">
                  <Chip color={supplier.isActive ? 'success' : 'default'} variant="flat" size="md">
                    {supplier.isActive ? 'Active' : 'Inactive'}
                  </Chip>

                  {hasPermission(SUPPLIER_PERMISSIONS.UPDATE) && (
                    <Button
                      color="primary"
                      variant="flat"
                      startContent={<EditIcon />}
                      onPress={handleEdit}
                    >
                      Edit
                    </Button>
                  )}

                  {hasPermission(SUPPLIER_PERMISSIONS.DELETE) && (
                    <Button
                      color="danger"
                      variant="flat"
                      startContent={<TrashIcon />}
                      onPress={() => handleDelete('soft')}
                    >
                      {supplier.isActive ? 'Deactivate' : 'Delete'}
                    </Button>
                  )}
                </div>
              </div>
            </header>

            {/* Basic Information */}
            <section className="flex flex-col gap-6">
              <Card as="article">
                <CardHeader>
                  <Text variant="titleMedium" weight="semiBold" as="h2">
                    Basic Information
                  </Text>
                </CardHeader>
                <CardBody>
                  <dl className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <section>
                      <dt>
                        <Text variant="bodySmall" color="muted">
                          Name
                        </Text>
                      </dt>
                      <dd>
                        <Text variant="bodyMedium" weight="medium">
                          {supplier.name}
                        </Text>
                      </dd>
                    </section>

                    <section>
                      <dt>
                        <Text variant="bodySmall" color="muted">
                          Code
                        </Text>
                      </dt>
                      <dd>
                        <Text variant="bodyMedium" weight="medium">
                          {supplier.code}
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
                        <Chip
                          color={supplier.isActive ? 'success' : 'default'}
                          variant="flat"
                          size="sm"
                        >
                          {supplier.isActive ? 'Active' : 'Inactive'}
                        </Chip>
                      </dd>
                    </section>
                  </dl>
                </CardBody>
              </Card>

              {/* Contact Information */}
              <Card as="article">
                <CardHeader>
                  <Text variant="titleMedium" weight="semiBold" as="h2">
                    Contact Information
                  </Text>
                </CardHeader>
                <CardBody>
                  <dl className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <section>
                      <dt>
                        <Text variant="bodySmall" color="muted">
                          Contact Person
                        </Text>
                      </dt>
                      <dd>
                        <Text variant="bodyMedium" weight="medium">
                          {supplier.contactPerson || 'Not specified'}
                        </Text>
                      </dd>
                    </section>

                    <section>
                      <dt>
                        <Text variant="bodySmall" color="muted">
                          Email
                        </Text>
                      </dt>
                      <dd>
                        <Text variant="bodyMedium" weight="medium">
                          {supplier.email || 'Not specified'}
                        </Text>
                      </dd>
                    </section>

                    <section>
                      <dt>
                        <Text variant="bodySmall" color="muted">
                          Phone
                        </Text>
                      </dt>
                      <dd>
                        <Text variant="bodyMedium" weight="medium">
                          {supplier.phone || 'Not specified'}
                        </Text>
                      </dd>
                    </section>
                  </dl>
                </CardBody>
              </Card>

              {/* Address Information */}
              <Card as="article" className="md:col-span-2">
                <CardHeader>
                  <Text variant="titleMedium" weight="semiBold" as="h2">
                    Address Information
                  </Text>
                </CardHeader>
                <CardBody>
                  <dl className="grid grid-cols-1 gap-6">
                    <section>
                      <dt>
                        <Text variant="bodySmall" color="muted">
                          Address
                        </Text>
                      </dt>
                      <dd>
                        <Text variant="bodyMedium" weight="medium">
                          {supplier.address || 'Not specified'}
                        </Text>
                      </dd>
                    </section>
                  </dl>
                </CardBody>
              </Card>
            </section>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
              isOpen={isDeleteDialogOpen}
              supplier={supplier}
              deleteType={deleteType}
              isDeleting={isDeleting}
              isHardDeleting={isHardDeleting}
              onConfirm={handleConfirmDelete}
              onClose={handleDialogClose}
            />
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
