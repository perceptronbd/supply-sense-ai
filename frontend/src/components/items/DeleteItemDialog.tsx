'use client';

import { Text } from '@/components/ui/Text';
import { type Item, useDeleteItemMutation, useHardDeleteItemMutation } from '@/store/api/itemApi';
import { Button } from '@heroui/button';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/modal';
import { addToast } from '@heroui/react';

interface DeleteItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
  deleteType: 'soft' | 'hard';
}

export function DeleteItemDialog({ isOpen, onClose, item, deleteType }: DeleteItemDialogProps) {
  const [deleteItem, { isLoading: isSoftDeleting }] = useDeleteItemMutation();
  const [hardDeleteItem, { isLoading: isHardDeleting }] = useHardDeleteItemMutation();

  const isLoading = isSoftDeleting || isHardDeleting;

  const handleDelete = async () => {
    if (!item) return;

    try {
      if (deleteType === 'soft') {
        await deleteItem(item.id).unwrap();
        addToast({
          title: 'Success',
          description: 'Item deactivated successfully',
          color: 'success',
        });
      } else {
        await hardDeleteItem(item.id).unwrap();
        addToast({
          title: 'Success',
          description: 'Item permanently deleted',
          color: 'success',
        });
      }
      onClose();
    } catch (error) {
      console.error('Error deleting item:', error);
      addToast({
        title: 'Error',
        description: `Failed to ${deleteType === 'soft' ? 'deactivate' : 'delete'} item`,
        color: 'danger',
      });
    }
  };

  if (!item) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalContent>
        <ModalHeader>
          <Text variant="headerMedium">
            {deleteType === 'soft' ? 'Deactivate Item' : 'Delete Item'}
          </Text>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Text variant="bodyMedium">
              {deleteType === 'soft'
                ? `Are you sure you want to deactivate "${item.name}"? This will make the item inactive but preserve all related data.`
                : `Are you sure you want to permanently delete "${item.name}"? This action cannot be undone and will remove all related data.`}
            </Text>
            <div className="bg-gray-100 p-3 rounded-md">
              <Text variant="bodySmall" className="text-gray-600">
                <strong>Item:</strong> {item.name}
              </Text>
              <Text variant="bodySmall" className="text-gray-600">
                <strong>SKU:</strong> {item.sku}
              </Text>
            </div>
            {deleteType === 'hard' && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-md">
                <Text variant="bodySmall" className="text-red-700">
                  <strong>Warning:</strong> This is a permanent action that cannot be undone.
                </Text>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={isLoading}>
            Cancel
          </Button>
          <Button
            color={deleteType === 'soft' ? 'warning' : 'danger'}
            onPress={handleDelete}
            isLoading={isLoading}
          >
            {isLoading
              ? `${deleteType === 'soft' ? 'Deactivating...' : 'Deleting...'}`
              : `${deleteType === 'soft' ? 'Deactivate' : 'Delete'}`}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
