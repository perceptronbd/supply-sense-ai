'use client';

import AuthGuard from '@/components/AuthGuard';
import { RoleForm } from '@/components/roles/RoleForm';
import { ROUTE_PATHS } from '@/config/routes';
import { type Role } from '@/store/api/roleApi';
import { useRouter } from 'next/navigation';

export default function CreateRolePage() {
  const router = useRouter();

  const handleSuccess = (role: Role) => {
    // Navigate to the newly created role's detail page
    router.push(`${ROUTE_PATHS.ROLES}/${role.id}`);
  };

  return (
    <AuthGuard requireAuth={true}>
      <RoleForm mode="create" onSuccess={handleSuccess} />
    </AuthGuard>
  );
}
