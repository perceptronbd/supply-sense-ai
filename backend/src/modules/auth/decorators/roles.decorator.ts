import { SetMetadata } from '@nestjs/common';

export enum UserRole {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  BRANCH_MANAGER = 'BRANCH_MANAGER',
  INVENTORY_CLERK = 'INVENTORY_CLERK',
  PROCUREMENT_SPECIALIST = 'PROCUREMENT_SPECIALIST',
  PRODUCTION_PLANNER = 'PRODUCTION_PLANNER',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
