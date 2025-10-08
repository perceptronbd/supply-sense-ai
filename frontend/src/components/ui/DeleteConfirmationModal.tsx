'use client';

import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react';
import { Text } from '@/components/ui/Text';

interface DeleteConfirmationModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly title: string;
  readonly message: string;
  readonly itemName?: string;
  readonly isLoading?: boolean;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  isLoading = false,
}: DeleteConfirmationModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isDismissable={!isLoading}
      isKeyboardDismissDisabled={isLoading}
      size="md"
      backdrop="blur"
      classNames={{
        backdrop: 'bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20',
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <Text variant="titleLarge" weight="semiBold" as="h2">
            {title}
          </Text>
        </ModalHeader>
        <ModalBody>
          <Text variant="bodyBase" as="p">
            {message}
          </Text>
          {itemName && (
            <Text variant="bodyBase" weight="medium" className="text-danger" as="p">
              {itemName}
            </Text>
          )}
          <Text variant="bodySmall" className="text-default-500" as="p">
            This action cannot be undone.
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button color="danger" onPress={handleConfirm} isLoading={isLoading} disabled={isLoading}>
            Delete
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
