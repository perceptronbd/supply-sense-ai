'use client';

import { Text } from '@/components/ui/Text';
import { useCreatePurchaseOrderFromPRMutation } from '@/store/api/purchaseOrderApi';
import { useGetSuppliersQuery } from '@/store/api/supplierApi';
import type { RootState } from '@/store/store';
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  addToast,
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { SupplierSelect } from './SupplierSelect';
import { WhatHappensNextSection } from './WhatHappensNextSection';

interface CreatePOFromPRModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseRequestId: string;
  purchaseRequestNumber: string;
  onSuccess?: () => void; // Optional callback for when PO is created successfully
}

export default function CreatePOFromPRModal({
  isOpen,
  onClose,
  purchaseRequestId,
  purchaseRequestNumber,
  onSuccess,
}: CreatePOFromPRModalProps) {
  const router = useRouter();
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');

  // Get current user from auth state
  const { user } = useSelector((state: RootState) => state.auth);
  // API hooks
  const { data: suppliers, isLoading: suppliersLoading } = useGetSuppliersQuery();
  const [createPOFromPR, { isLoading: isCreating }] = useCreatePurchaseOrderFromPRMutation();
  // Check if user has required role
  const hasRequiredRole =
    user?.role === 'BRANCH_MANAGER' || user?.role === 'PROCUREMENT_SPECIALIST';

  // Check if there are any active suppliers
  const hasActiveSuppliers = suppliers?.some((supplier) => supplier.isActive) ?? false; // Helper function to handle API errors
  const getErrorMessage = (error: unknown): string => {
    const defaultMessage = 'Failed to create purchase order. Please try again.';

    if (!error || typeof error !== 'object') {
      return defaultMessage;
    }

    if ('status' in error && error.status === 403) {
      return 'You do not have permission to create purchase orders. Please contact your administrator.';
    }

    if ('status' in error && error.status === 404) {
      return 'Purchase request not found or no longer available.';
    }

    if ('data' in error) {
      const message = (error.data as { message?: string })?.message;
      return message || defaultMessage;
    }

    return defaultMessage;
  };

  const handleCreatePO = async () => {
    if (!selectedSupplierId) {
      addToast({
        title: 'Supplier Required',
        description: 'Please select a supplier to create the purchase order.',
        color: 'warning',
      });
      return;
    }

    if (!hasRequiredRole) {
      addToast({
        title: 'Insufficient Permissions',
        description:
          'You need to be a Branch Manager or Procurement Specialist to create purchase orders.',
        color: 'danger',
      });
      return;
    }
    try {
      // Debug info would be sent to logging service in production
      // Creating PO with: { purchaseRequestId, selectedSupplierId, userRole, userId }

      const result = await createPOFromPR({
        prId: purchaseRequestId,
        supplierId: selectedSupplierId,
      }).unwrap();

      // Call success callback if provided
      onSuccess?.();

      addToast({
        title: 'Purchase Order Created',
        description: `PO ${result.poNumber} has been created successfully from PR ${purchaseRequestNumber}.`,
        color: 'success',
      });

      // Close modal and redirect to PO details
      onClose();
      router.push(`/purchase-orders/${result.id}`);
    } catch (error) {
      // Error logging would be handled by a proper logging service in production

      addToast({
        title: 'Error Creating Purchase Order',
        description: getErrorMessage(error),
        color: 'danger',
      });
    }
  };

  const handleClose = () => {
    setSelectedSupplierId('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalContent>
        {' '}
        <ModalHeader>
          <header className="flex flex-col gap-1">
            <Text variant="titleLarge" weight="semiBold" as="h3">
              Create Purchase Order
            </Text>
            <Text variant="bodySmall" className="text-default-500" as="p">
              Create a purchase order from PR {purchaseRequestNumber}
            </Text>
          </header>
        </ModalHeader>{' '}
        <ModalBody>
          <section className="space-y-4">
            <WhatHappensNextSection />

            <SupplierSelect
              suppliers={suppliers || []}
              isLoading={suppliersLoading}
              selectedSupplierId={selectedSupplierId}
              onSelectionChange={setSelectedSupplierId}
            />

            {!hasRequiredRole && (
              <section className="bg-danger-50 border border-danger-200 p-4 rounded-lg">
                <Text variant="bodySmall" className="text-danger-700" weight="medium" as="p">
                  Insufficient Permissions
                </Text>
                <Text variant="bodyXSmall" className="text-danger-600 mt-1" as="p">
                  You need to be a Branch Manager or Procurement Specialist to create purchase
                  orders. Your current role: {user?.role || 'Unknown'}
                </Text>
              </section>
            )}
          </section>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={handleClose} isDisabled={isCreating}>
            Cancel
          </Button>{' '}
          <Button
            color="primary"
            onPress={handleCreatePO}
            isLoading={isCreating}
            isDisabled={!selectedSupplierId || !hasActiveSuppliers || !hasRequiredRole}
          >
            {isCreating ? 'Creating PO...' : 'Create Purchase Order'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
