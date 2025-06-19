import { Text } from '@/components/ui/Text';
import type { Branch } from '@/store/api/branchApi';
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react';

interface DeleteModalProps {
  isOpen: boolean;
  selectedBranch: Branch | null;
  deleteType: 'soft' | 'hard';
  isDeleting: boolean;
  isHardDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteModal({
  isOpen,
  selectedBranch,
  deleteType,
  isDeleting,
  isHardDeleting,
  onClose,
  onConfirm,
}: DeleteModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} placement="center">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <Text variant="titleMedium">
            {deleteType === 'hard'
              ? 'Delete Branch Permanently'
              : selectedBranch?.isActive
                ? 'Deactivate Branch'
                : 'Activate Branch'}
          </Text>
        </ModalHeader>
        <ModalBody>
          <Text variant="bodyBase">
            {deleteType === 'hard'
              ? `Are you sure you want to permanently delete "${selectedBranch?.name}"? This action cannot be undone.`
              : selectedBranch?.isActive
                ? `Are you sure you want to deactivate "${selectedBranch?.name}"?`
                : `Are you sure you want to activate "${selectedBranch?.name}"?`}
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={isDeleting || isHardDeleting}>
            Cancel
          </Button>
          <Button
            color={deleteType === 'hard' ? 'danger' : 'warning'}
            onPress={onConfirm}
            isLoading={isDeleting || isHardDeleting}
          >
            {deleteType === 'hard'
              ? 'Delete Permanently'
              : selectedBranch?.isActive
                ? 'Deactivate'
                : 'Activate'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
