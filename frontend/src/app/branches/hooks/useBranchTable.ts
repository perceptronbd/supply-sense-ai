import type { Branch } from '@/store/api/branchApi';
import { useCallback, useMemo } from 'react';

export function useBranchTable() {
  const columns = useMemo(
    () => [
      { name: 'NAME', uid: 'name', sortable: true },
      { name: 'CONTACT', uid: 'contact', sortable: false },
      { name: 'ADDRESS', uid: 'address', sortable: false },
      { name: 'MANAGER', uid: 'manager', sortable: false },
      { name: 'STATUS', uid: 'status', sortable: true },
      { name: 'ACTIONS', uid: 'actions', sortable: false },
    ],
    []
  );

  const createRenderCell = useCallback(
    (
      handleViewBranch: (id: string) => void,
      handleEditBranch: (branch: Branch) => void,
      handleDeleteBranch: (branch: Branch, type?: 'soft' | 'hard') => void
    ) => {
      return (branch: Branch, columnKey: string) => {
        switch (columnKey) {
          case 'name':
          case 'contact':
          case 'address':
          case 'manager':
          case 'status':
          case 'actions':
            // Return a function that will be used by the component to render JSX
            return { branch, columnKey, handleViewBranch, handleEditBranch, handleDeleteBranch };
          default:
            return null;
        }
      };
    },
    []
  );

  return {
    columns,
    createRenderCell,
  };
}
