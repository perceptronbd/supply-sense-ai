'use client';

import AuthGuard from '@/components/AuthGuard';
import { BranchForm } from '@/components/branches/BranchForm';
import { type Branch } from '@/store/api/branchApi';
import { useRouter } from 'next/navigation';

export default function CreateBranchPage() {
  const router = useRouter();

  const handleSuccess = (branch: Branch) => {
    // Navigate to the newly created branch's detail page
    router.push(`/branches/${branch.id}`);
  };

  return (
    <AuthGuard requireAuth={true}>
      <BranchForm mode="create" onSuccess={handleSuccess} />
    </AuthGuard>
  );
}
