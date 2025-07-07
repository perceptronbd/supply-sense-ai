import { SetMetadata } from '@nestjs/common';

export enum UserRole {
  SYSTEM_ADMIN = 'Super Admin',
  BRANCH_MANAGER = 'Branch Manager',
  INVENTORY_CLERK = 'Inventory Clerk',
  PROCUREMENT_SPECIALIST = 'Procurement Specialist',
  PRODUCTION_PLANNER = 'Production Planner',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
