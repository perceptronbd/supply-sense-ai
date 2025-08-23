import { PrismaClient, type User } from '@supplysense/prisma-client';
import * as argon2 from 'argon2';

export async function seedUsers(prisma: PrismaClient, companies: any[], roles: any[]) {
  console.log('Seeding users...');

  const usersData: User[] = [];

  for (const company of companies) {
    // Find admin role for this company
    const adminRole = roles.find(r => r.name === 'Admin' && r.companyId === company.id);
    const managerRole = roles.find(r => r.name === 'Manager' && r.companyId === company.id);
    const employeeRole = roles.find(r => r.name === 'Employee' && r.companyId === company.id);

    // Create Admin user for each company
    const adminUser = {
      id: `admin-user-${company.id}`,
      email: company.contactEmail,
      username: `admin-${company.name.toLowerCase().replace(/\s+/g, '-')}`,
      firstName: 'System',
      lastName: 'Administrator',
      phone: company.contactPhone,
      governmentId: 'ADMIN001',
      password: await argon2.hash('Admin@123'),
      avatar: null,
      isActive: true,
      isSuperAdmin: true,
      companyId: company.id,
    };

    const createdAdminUser = await prisma.user.upsert({
      where: { id: adminUser.id },
      update: adminUser,
      create: adminUser,
    });

    usersData.push(createdAdminUser);

    // Assign admin role to admin user
    if (adminRole) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: createdAdminUser.id,
            roleId: adminRole.id
          }
        },
        update: {},
        create: {
          userId: createdAdminUser.id,
          roleId: adminRole.id,
        },
      });
    }

    // Create a Manager user for each company
    const managerUser = {
      id: `manager-user-${company.id}`,
      email: `manager@${company.contactEmail.split('@')[1]}`,
      username: `manager-${company.name.toLowerCase().replace(/\s+/g, '-')}`,
      firstName: 'Operations',
      lastName: 'Manager',
      phone: company.contactPhone?.replace(/\d{4}$/, '0124'),
      governmentId: 'MGR001',
      password: await argon2.hash('Manager@123' ),
      avatar: null,
      isActive: true,
      isSuperAdmin: false,
      companyId: company.id,
    };

    const createdManagerUser = await prisma.user.upsert({
      where: { id: managerUser.id },
      update: managerUser,
      create: managerUser,
    });

    usersData.push(createdManagerUser);

    // Assign manager role to manager user
    if (managerRole) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: createdManagerUser.id,
            roleId: managerRole.id
          }
        },
        update: {},
        create: {
          userId: createdManagerUser.id,
          roleId: managerRole.id,
        },
      });
    }

    // Create an Employee user for each company
    const employeeUser = {
      id: `employee-user-${company.id}`,
      email: `employee@${company.contactEmail.split('@')[1]}`,
      username: `employee-${company.name.toLowerCase().replace(/\s+/g, '-')}`,
      firstName: 'John',
      lastName: 'Employee',
      phone: company.contactPhone?.replace(/\d{4}$/, '0125'),
      governmentId: 'EMP001',
      password: await argon2.hash('Employee@123'),
      avatar: null,
      isActive: true,
      isSuperAdmin: false,
      companyId: company.id,
    };

    const createdEmployeeUser = await prisma.user.upsert({
      where: { id: employeeUser.id },
      update: employeeUser,
      create: employeeUser,
    });

    usersData.push(createdEmployeeUser);

    // Assign employee role to employee user
    if (employeeRole) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: createdEmployeeUser.id,
            roleId: employeeRole.id
          }
        },
        update: {},
        create: {
          userId: createdEmployeeUser.id,
          roleId: employeeRole.id,
        },
      });
    }
  }

  console.log(`✅ Seeded ${usersData.length} users with roles assigned`);
  console.log('📋 Default Login Credentials:');
  console.log('Admin Users:');
  companies.forEach(company => {
    console.log(`  - ${company.contactEmail} / Admin@123`);
  });
  console.log('Manager Users:');
  companies.forEach(company => {
    console.log(`  - manager@${company.contactEmail.split('@')[1]} / Manager@123`);
  });
  console.log('Employee Users:');
  companies.forEach(company => {
    console.log(`  - employee@${company.contactEmail.split('@')[1]} / Employee@123`);
  });

  return usersData;
}
