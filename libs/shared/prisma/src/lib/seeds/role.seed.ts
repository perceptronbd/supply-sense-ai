import { PrismaClient, type Role } from '@supplysense/prisma-client'

export async function seedRoles(prisma: PrismaClient, companies: any[], permissions: any[]) {
  console.log('Seeding roles...');

  const rolesData: Role[] = [];

  for (const company of companies) {
    // Create Admin role for each company
    const adminRole = {
      id: `admin-${company.id}`,
      name: 'Admin',
      description: 'Full system administrator with all permissions',
      isActive: true,
      companyId: company.id,
    };

    const role = await prisma.role.upsert({
      where: { id: adminRole.id },
      update: adminRole,
      create: adminRole,
    });

    rolesData.push(role);

    // Assign all permissions to Admin role
    for (const permission of permissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }

    // Create Manager role for each company
    const managerRole = {
      id: `manager-${company.id}`,
      name: 'Manager',
      description: 'Department manager with limited administrative permissions',
      isActive: true,
      companyId: company.id,
    };

    const managerRoleCreated = await prisma.role.upsert({
      where: { id: managerRole.id },
      update: managerRole,
      create: managerRole,
    });

    rolesData.push(managerRoleCreated);

    // Assign selected permissions to Manager role (READ/UPDATE for most modules)
    const managerPermissions = permissions.filter(p => 
      ['READ', 'UPDATE', 'CREATE', 'APPROVE'].includes(p.action) &&
      !['ROLES', 'PERMISSIONS'].includes(p.module)
    );

    for (const permission of managerPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: managerRoleCreated.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: managerRoleCreated.id,
          permissionId: permission.id,
        },
      });
    }

    // Create Employee role for each company
    const employeeRole = {
      id: `employee-${company.id}`,
      name: 'Employee',
      description: 'Regular employee with basic operational permissions',
      isActive: true,
      companyId: company.id,
    };

    const employeeRoleCreated = await prisma.role.upsert({
      where: { id: employeeRole.id },
      update: employeeRole,
      create: employeeRole,
    });

    rolesData.push(employeeRoleCreated);

    // Assign basic permissions to Employee role (mainly READ and CREATE for requests)
    const employeePermissions = permissions.filter(p => 
      ['READ', 'CREATE', 'SUBMIT'].includes(p.action) &&
      ['ITEMS', 'SUPPLIERS', 'PURCHASE_REQUESTS', 'REQUEST_FORMS', 'MATERIAL_REQUISITIONS', 'AI', 'CHAT'].includes(p.module)
    );

    for (const permission of employeePermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: employeeRoleCreated.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: employeeRoleCreated.id,
          permissionId: permission.id,
        },
      });
    }
  }

  console.log(`✅ Seeded ${rolesData.length} roles with permissions`);
  return rolesData;
}
