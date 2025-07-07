'use client';

import { useParams, useRouter } from 'next/navigation';

import AuthGuard from '@/components/AuthGuard';
import { DrawingLogo } from '@/components/ui/DrawingLogo';
import { Text } from '@/components/ui/Text';
import { UserForm } from '@/components/users/UserForm';
import { ROUTE_PATHS } from '@/config/routes';
import { useGetUserQuery } from '@/store/api/userApi';

export default function UserEditPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const { data: user, isLoading, error } = useGetUserQuery(userId);

  const handleSuccess = () => {
    router.push(`${ROUTE_PATHS.USERS}/${userId}`);
  };

  if (isLoading) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="flex items-center justify-center min-h-screen">
          <DrawingLogo size={60} variant="primary" speed="fast" showFill={true} />
        </div>
      </AuthGuard>
    );
  }

  if (error || !user) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="p-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Text variant="bodyLarge" weight="medium" color="danger">
              User not found
            </Text>
            <Text variant="bodySmall" color="muted" className="mt-2">
              The user you're looking for doesn't exist or you don't have permission to edit it.
            </Text>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      <UserForm user={user} mode="edit" onSuccess={handleSuccess} />
    </AuthGuard>
  );
}
