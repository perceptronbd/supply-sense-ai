import {
  type Branch,
  useDeleteBranchMutation,
  useHardDeleteBranchMutation,
} from '@/store/api/branchApi';
import { addToast } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function useBranchActions() {
  const router = useRouter();
  const [deleteBranch, { isLoading: isDeleting }] = useDeleteBranchMutation();
  const [hardDeleteBranch, { isLoading: isHardDeleting }] = useHardDeleteBranchMutation();

  const handleCreateBranch = useCallback(() => {
    router.push('/branches/create');
  }, [router]);

  const handleViewBranch = useCallback(
    (branchId: string) => {
      router.push(`/branches/${branchId}`);
    },
    [router]
  );

  const handleEditBranch = useCallback(
    (branch: Branch) => {
      router.push(`/branches/${branch.id}/edit`);
    },
    [router]
  );

  const handleConfirmDelete = useCallback(
    async (selectedBranch: Branch | null, deleteType: 'soft' | 'hard', onClose: () => void) => {
      if (!selectedBranch) return;

      try {
        if (deleteType === 'hard') {
          await hardDeleteBranch(selectedBranch.id).unwrap();
          addToast({
            title: 'Success',
            description: 'Branch deleted permanently',
            color: 'success',
            variant: 'flat',
          });
        } else {
          await deleteBranch(selectedBranch.id).unwrap();
          addToast({
            title: 'Success',
            description: `Branch ${
              selectedBranch.isActive ? 'deactivated' : 'activated'
            } successfully`,
            color: 'success',
            variant: 'flat',
          });
        }
        onClose();
      } catch (error) {
        console.error('Failed to delete branch:', error);
        addToast({
          title: 'Error',
          description: 'Failed to update branch',
          color: 'danger',
          variant: 'flat',
        });
      }
    },
    [deleteBranch, hardDeleteBranch]
  );

  return {
    handleCreateBranch,
    handleViewBranch,
    handleEditBranch,
    handleConfirmDelete,
    isDeleting,
    isHardDeleting,
  };
}
