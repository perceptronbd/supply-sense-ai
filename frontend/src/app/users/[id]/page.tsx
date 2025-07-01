'use client';

import AuthGuard from '@/components/AuthGuard';
import { DrawingLogo } from '@/components/ui/DrawingLogo';
import { PermissionGuard } from '@/components/ui/PermissionGuard';
import { Text } from '@/components/ui/Text';
import { ROUTE_PATHS } from '@/config/routes';
import { useGetUserQuery } from '@/store/api/userApi';
import { Button, Card, CardBody, CardHeader, Chip } from '@heroui/react';
import { USER_PERMISSIONS } from '@supplysense/types';
import { format } from 'date-fns';
import { Edit, Shield, Users } from 'lucide-react';
import { ArrowLeftIcon } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const { data: user, isLoading, error } = useGetUserQuery(userId);

  const handleEdit = () => {
    router.push(`${ROUTE_PATHS.USERS}/${userId}/edit`);
  };

  const handleBack = () => {
    router.push(ROUTE_PATHS.USERS);
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
              The user you're looking for doesn't exist or you don't have permission to view it.
            </Text>
            <Button color="primary" variant="flat" className="mt-4" onPress={handleBack}>
              Back to Users
            </Button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      <main className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button
            variant="light"
            onPress={() => router.back()}
            startContent={<ArrowLeftIcon className="w-4 h-4" />}
          >
            Back
          </Button>
          {/* Header */}
          <header className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-4">
              <Text variant="headerSmall" weight="semiBold" color="default" as="h1">
                {user.firstName} {user.lastName}
              </Text>
            </div>
            <PermissionGuard permission={USER_PERMISSIONS.UPDATE}>
              <Button
                color="primary"
                startContent={<Edit className="w-4 h-4" />}
                onPress={handleEdit}
              >
                Edit User
              </Button>
            </PermissionGuard>
          </header>

          {/* User Information */}
          <Card>
            <CardHeader>
              <Text variant="titleMedium" weight="medium">
                User Information
              </Text>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <Text variant="bodySmall" color="muted" className="mb-1">
                      First Name
                    </Text>
                    <Text variant="bodyMedium" weight="medium">
                      {user.firstName}
                    </Text>
                  </div>
                  <div>
                    <Text variant="bodySmall" color="muted" className="mb-1">
                      Last Name
                    </Text>
                    <Text variant="bodyMedium" weight="medium">
                      {user.lastName}
                    </Text>
                  </div>
                  <div>
                    <Text variant="bodySmall" color="muted" className="mb-1">
                      Email
                    </Text>
                    <Text variant="bodyMedium" weight="medium">
                      {user.email}
                    </Text>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Text variant="bodySmall" color="muted" className="mb-1">
                      Username
                    </Text>
                    <Text variant="bodyMedium" weight="medium">
                      {user.username}
                    </Text>
                  </div>
                  <div>
                    <Text variant="bodySmall" color="muted" className="mb-1">
                      Status
                    </Text>
                    <Chip color={user.isActive ? 'success' : 'default'} variant="flat" size="sm">
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Chip>
                  </div>
                  <div>
                    <Text variant="bodySmall" color="muted" className="mb-1">
                      Last Login
                    </Text>
                    <Text variant="bodyMedium" weight="medium">
                      {user.lastLogin ? format(new Date(user.lastLogin), 'PPpp') : 'Never'}
                    </Text>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Roles */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Text variant="titleMedium" weight="medium">
                  Roles
                </Text>
                <PermissionGuard permission={USER_PERMISSIONS.MANAGE}>
                  <Button
                    size="sm"
                    variant="light"
                    startContent={<Shield className="w-4 h-4" />}
                    onPress={() => router.push(`${ROUTE_PATHS.USERS}/${userId}/roles`)}
                  >
                    Manage Roles
                  </Button>
                </PermissionGuard>
              </div>
            </CardHeader>
            <CardBody>
              {user.roles && user.roles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.roles.map((role) => (
                    <Chip key={role.id} color="primary" variant="flat" size="sm">
                      {role.name}
                    </Chip>
                  ))}
                </div>
              ) : (
                <Text variant="bodySmall" color="muted">
                  No roles assigned
                </Text>
              )}
            </CardBody>
          </Card>

          {/* Branches */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Text variant="titleMedium" weight="medium">
                  Branches
                </Text>
                <PermissionGuard permission={USER_PERMISSIONS.MANAGE}>
                  <Button
                    size="sm"
                    variant="light"
                    startContent={<Users className="w-4 h-4" />}
                    onPress={() => router.push(`${ROUTE_PATHS.USERS}/${userId}/branches`)}
                  >
                    Manage Branches
                  </Button>
                </PermissionGuard>
              </div>
            </CardHeader>
            <CardBody>
              {user.branches && user.branches.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.branches.map((branch) => (
                    <Chip key={branch.id} color="secondary" variant="flat" size="sm">
                      {branch.name} ({branch.code})
                    </Chip>
                  ))}
                </div>
              ) : (
                <Text variant="bodySmall" color="muted">
                  No branches assigned
                </Text>
              )}
            </CardBody>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <Text variant="titleMedium" weight="medium">
                Account Information
              </Text>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Text variant="bodySmall" color="muted" className="mb-1">
                    Created
                  </Text>
                  <Text variant="bodyMedium" weight="medium">
                    {format(new Date(user.createdAt), 'PPpp')}
                  </Text>
                </div>
                <div>
                  <Text variant="bodySmall" color="muted" className="mb-1">
                    Last Updated
                  </Text>
                  <Text variant="bodyMedium" weight="medium">
                    {format(new Date(user.updatedAt), 'PPpp')}
                  </Text>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </main>
    </AuthGuard>
  );
}
