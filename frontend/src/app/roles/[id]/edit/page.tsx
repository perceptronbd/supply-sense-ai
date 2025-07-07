'use client';

import AuthGuard from '@/components/AuthGuard';
import { RoleForm } from '@/components/roles/RoleForm';
import { DrawingLogo } from '@/components/ui/DrawingLogo';
import { Text } from '@/components/ui/Text';
import { ROUTE_PATHS } from '@/config/routes';
import { type Role, useGetRoleQuery } from '@/store/api/roleApi';
import { Button } from '@heroui/react';
import { useParams, useRouter } from 'next/navigation';

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const roleId = params.id as string;

  const { data: role, isLoading, error } = useGetRoleQuery(roleId);

  const handleSuccess = (updatedRole: Role) => {
    // Navigate back to the role detail page after successful update
    router.push(`${ROUTE_PATHS.ROLES}/${updatedRole.id}`);
  };

  const handleBack = () => {
    router.push(ROUTE_PATHS.ROLES);
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

  if (error || !role) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="p-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Text variant="bodyLarge" weight="medium" color="danger">
              Role not found
            </Text>
            <Text variant="bodySmall" color="muted" className="mt-2">
              The role you're trying to edit doesn't exist or you don't have permission to edit it.
            </Text>
            <Button color="primary" variant="flat" className="mt-4" onPress={handleBack}>
              Back to Roles
            </Button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      <RoleForm mode="edit" role={role} onSuccess={handleSuccess} />
    </AuthGuard>
  );
}
