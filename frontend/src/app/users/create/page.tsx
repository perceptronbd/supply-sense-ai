'use client';

import AuthGuard from '@/components/AuthGuard';
import { UserForm } from '@/components/users/UserForm';
import { ROUTE_PATHS } from '@/config/routes';
import { type User } from '@/store/api/userApi';
import { useRouter } from 'next/navigation';

export default function CreateUserPage() {
  const router = useRouter();

  const handleSuccess = (_user: User) => {
    // Navigate to the users list page
    router.push(ROUTE_PATHS.USERS);
  };

  return (
    <AuthGuard requireAuth={true}>
      <UserForm mode="create" onSuccess={handleSuccess} />
    </AuthGuard>
  );
}
