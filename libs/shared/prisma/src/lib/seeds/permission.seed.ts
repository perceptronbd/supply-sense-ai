import { type Permission, PermissionAction, PrismaClient } from '@supplysense/prisma-client'

export async function seedPermissions(prisma: PrismaClient) {
  console.log('Seeding permissions...');

  const permissions = [
    // User Management Permissions
    { module: 'USERS', action: PermissionAction.CREATE, description: 'Create new users' },
    { module: 'USERS', action: PermissionAction.READ, description: 'View user information' },
    { module: 'USERS', action: PermissionAction.UPDATE, description: 'Update user information' },
    { module: 'USERS', action: PermissionAction.DELETE, description: 'Delete users' },
    { module: 'USERS', action: PermissionAction.MANAGE, description: 'Full user management' },

    // Company Management Permissions
    { module: 'COMPANIES', action: PermissionAction.READ, description: 'View company information' },
    { module: 'COMPANIES', action: PermissionAction.UPDATE, description: 'Update company information' },
    { module: 'COMPANIES', action: PermissionAction.MANAGE, description: 'Full company management' },

    // Roles & Permissions Management
    { module: 'ROLES', action: PermissionAction.CREATE, description: 'Create new roles' },
    { module: 'ROLES', action: PermissionAction.READ, description: 'View roles' },
    { module: 'ROLES', action: PermissionAction.UPDATE, description: 'Update roles' },
    { module: 'ROLES', action: PermissionAction.DELETE, description: 'Delete roles' },
    { module: 'ROLES', action: PermissionAction.MANAGE_ROLES, description: 'Full role management' },
    { module: 'PERMISSIONS', action: PermissionAction.MANAGE_PERMISSIONS, description: 'Manage permissions' },

    // AI and Chat Permissions
    { module: 'AI', action: PermissionAction.ACCESS_SUGGESTIONS, description: 'Access AI suggestions' },
    { module: 'AI', action: PermissionAction.MANAGE_SUGGESTIONS, description: 'Manage AI suggestions' },
    { module: 'AI', action: PermissionAction.DEMAND_FORECASTING, description: 'Access demand forecasting' },
    { module: 'AI', action: PermissionAction.ANALYTICS, description: 'Access AI analytics' },
    { module: 'CHAT', action: PermissionAction.SEND_MESSAGE, description: 'Send chat messages' },
    { module: 'CHAT', action: PermissionAction.READ_MESSAGES, description: 'Read chat messages' },
    { module: 'CHAT', action: PermissionAction.MANAGE_CONVERSATIONS, description: 'Manage chat conversations' },
  ];

  const createdPermissions:Permission[] = [];

  for (const permission of permissions) {
    const createdPermission = await prisma.permission.upsert({
      where: { 
        module_action: {
          module: permission.module,
          action: permission.action
        }
      },
      update: permission,
      create: permission,
    });
    createdPermissions.push(createdPermission);
  }

  console.log(`✅ Seeded ${createdPermissions.length} permissions`);
  return createdPermissions;
}
