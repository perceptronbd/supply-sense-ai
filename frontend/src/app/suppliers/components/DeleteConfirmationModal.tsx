import { Text } from '@/components/ui/Text';
import { type Supplier } from '@/store/api/supplierApi';
import { Button, Card, CardBody, CardHeader } from '@heroui/react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  supplier: Supplier | null;
  deleteType: 'soft' | 'hard';
  isDeleting: boolean;
  isHardDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteConfirmationModal({
  isOpen,
  supplier,
  deleteType,
  isDeleting,
  isHardDeleting,
  onConfirm,
  onClose,
}: DeleteConfirmationModalProps) {
  if (!isOpen || !supplier) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <Text variant="titleMedium" weight="semiBold" as="h3">
            {deleteType === 'hard' ? 'Delete Supplier' : 'Deactivate Supplier'}
          </Text>
        </CardHeader>
        <CardBody className="pt-0">
          <Text variant="bodyMedium" color="muted" className="mb-4">
            {deleteType === 'hard'
              ? `Are you sure you want to permanently delete "${supplier.name}"? This action cannot be undone.`
              : `Are you sure you want to deactivate "${supplier.name}"? You can reactivate it later.`}
          </Text>
          <div className="flex gap-3 justify-end">
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button color="danger" isLoading={isDeleting || isHardDeleting} onPress={onConfirm}>
              {deleteType === 'hard' ? 'Delete' : 'Deactivate'}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
