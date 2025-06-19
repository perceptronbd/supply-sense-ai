'use client';

import AuthGuard from '@/components/AuthGuard';
import { BranchForm } from '@/components/branches/BranchForm';
import { Text } from '@/components/ui/Text';
import { type Branch, useGetBranchQuery } from '@/store/api/branchApi';
import { useRouter } from 'next/navigation';
import { use } from 'react';

interface EditBranchPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditBranchPage({ params }: EditBranchPageProps) {
  const router = useRouter();
  const { id } = use(params);

  const { data: branch, isLoading, error } = useGetBranchQuery(id);

  const handleSuccess = (branch: Branch) => {
    // Navigate back to the branch's detail page
    router.push(`/branches/${branch.id}`);
  };

  if (isLoading) {
    return (
      <AuthGuard requireAuth={true}>
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <Text variant="bodyLarge" as="p">
                Loading branch...
              </Text>
            </div>
          </div>
        </main>
      </AuthGuard>
    );
  }

  if (error || !branch) {
    return (
      <AuthGuard requireAuth={true}>
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <Text variant="bodyLarge" className="text-danger" as="p">
                Error loading branch or branch not found
              </Text>
            </div>
          </div>
        </main>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      <BranchForm mode="edit" branch={branch} onSuccess={handleSuccess} />
    </AuthGuard>
  );
}
