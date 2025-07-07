# Multi-Tenant Authentication & Authorization Guide

This guide demonstrates how to use the new multi-tenant authentication and authorization system in your controllers and services.

## Overview

The system provides:
- **Company Isolation**: Automatic data scoping to user's company
- **Role-Based Access Control**: Fine-grained permissions
- **Branch-Level Access**: Control access to specific branches
- **JWT-Based Authentication**: Secure token-based auth

## Key Components

### Guards
- `JwtAuthGuard`: Validates JWT tokens
- `CompanyIsolationGuard`: Ensures company data isolation
- `PermissionsGuard`: Enforces permission-based access
- `BranchAccessGuard`: Controls branch-level access

### Decorators
- `@CurrentUser()`: Injects authenticated user context
- `@RequirePermissions()`: Specifies required permissions
- `@RequireCompanyAccess()`: Ensures company access
- `@RequireBranchAccess()`: Ensures branch access

### Services
- `PermissionService`: Utility methods for permission checks

## Basic Usage

### 1. Controller Setup

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompanyIsolationGuard } from '../auth/guards/company-isolation.guard';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Controller('items')
@UseGuards(JwtAuthGuard, CompanyIsolationGuard) // Apply to all routes
export class ItemController {
  // Your controller methods here
}
```

### 2. Getting User Context

```typescript
@Get()
async getItems(@CurrentUser() user: AuthenticatedUser) {
  // user object contains:
  // - id, email, firstName, lastName
  // - companyId, roles, permissions, branchIds
  // - isSuperAdmin
  
  console.log('User company:', user.companyId);
  console.log('User permissions:', user.permissions);
  console.log('User branches:', user.branchIds);
  
  return this.itemService.findByCompany(user.companyId);
}
```

### 3. Permission-Based Access Control

```typescript
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Post()
@UseGuards(PermissionsGuard)
@RequirePermissions('INVENTORY_MANAGEMENT:CREATE')
async createItem(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateItemDto) {
  return this.itemService.create(dto, user.companyId);
}

@Delete(':id')
@UseGuards(PermissionsGuard)
@RequirePermissions('INVENTORY_MANAGEMENT:DELETE')
async deleteItem(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
  return this.itemService.delete(id, user.companyId);
}
```

### 4. Branch-Level Access Control

```typescript
import { BranchAccessGuard } from '../auth/guards/branch-access.guard';

@Get('branch/:branchId/items')
@UseGuards(BranchAccessGuard)
async getBranchItems(
  @CurrentUser() user: AuthenticatedUser,
  @Param('branchId') branchId: string
) {
  // BranchAccessGuard ensures user has access to this branch
  return this.itemService.findByBranch(branchId, user.companyId);
}
```

### 5. Service-Level Permission Checks

```typescript
import { PermissionService } from '../auth/services/permission.service';

@Injectable()
export class ItemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionService: PermissionService
  ) {}

  async findAll(user: AuthenticatedUser) {
    // Check permissions programmatically
    if (!this.permissionService.hasPermission(user, 'INVENTORY_MANAGEMENT', 'READ')) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Get company filter for data isolation
    const companyFilter = this.permissionService.createCompanyFilter(user);
    
    return this.prisma.item.findMany({
      where: companyFilter,
    });
  }

  async findByBranch(branchId: string, user: AuthenticatedUser) {
    // Check branch access
    if (!this.permissionService.hasAccessToBranch(user, branchId)) {
      throw new ForbiddenException('No access to this branch');
    }

    return this.prisma.item.findMany({
      where: {
        companyId: user.companyId,
        branchId,
      },
    });
  }
}
```

## Permission Format

Permissions follow the format: `MODULE:ACTION`

### Available Modules:
- `INVENTORY_MANAGEMENT`
- `PURCHASE_REQUESTS`
- `PURCHASE_ORDERS`
- `GOODS_RECEIPTS`
- `MATERIAL_REQUISITIONS`
- `MANUFACTURING_LISTS`
- `USER_MANAGEMENT`
- `BRANCH_MANAGEMENT`
- `COMPANY_SETTINGS`
- `SYSTEM_SETTINGS`
- `FINANCIAL_REPORTS`
- `ANALYTICS_DASHBOARD`

### Available Actions:
- `CREATE`
- `READ`
- `UPDATE`
- `DELETE`
- `APPROVE`
- `REJECT`
- `EDIT`
- `VIEW`

### Examples:
- `INVENTORY_MANAGEMENT:CREATE`
- `PURCHASE_ORDERS:APPROVE`
- `USER_MANAGEMENT:EDIT`
- `FINANCIAL_REPORTS:VIEW`

## Advanced Usage

### 1. Multiple Permissions

```typescript
@Post('approve')
@UseGuards(PermissionsGuard)
@RequirePermissions('PURCHASE_ORDERS:APPROVE', 'PURCHASE_ORDERS:UPDATE')
async approvePurchaseOrder(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
  // User must have BOTH permissions
  return this.purchaseOrderService.approve(id, user);
}
```

### 2. Conditional Permission Checks

```typescript
async updateItem(id: string, dto: UpdateItemDto, user: AuthenticatedUser) {
  const item = await this.findById(id, user.companyId);
  
  // Check if user can update this specific item
  if (item.createdById !== user.id && 
      !this.permissionService.hasPermission(user, 'INVENTORY_MANAGEMENT', 'UPDATE')) {
    throw new ForbiddenException('Can only update your own items or need UPDATE permission');
  }
  
  return this.update(id, dto);
}
```

### 3. Super Admin Bypass

```typescript
async deleteItem(id: string, user: AuthenticatedUser) {
  // Super admins can delete anything
  if (!user.isSuperAdmin && 
      !this.permissionService.hasPermission(user, 'INVENTORY_MANAGEMENT', 'DELETE')) {
    throw new ForbiddenException('Insufficient permissions');
  }
  
  return this.delete(id, user.companyId);
}
```

## Database Queries with Company Isolation

### Always Include Company Filter

```typescript
// Good - Always include companyId
await this.prisma.item.findMany({
  where: {
    companyId: user.companyId,
    // other filters...
  },
});

// Better - Use helper method
const companyFilter = this.permissionService.createCompanyFilter(user);
await this.prisma.item.findMany({
  where: {
    ...companyFilter,
    // other filters...
  },
});
```

### Branch-Specific Queries

```typescript
// Single branch
await this.prisma.item.findMany({
  where: {
    companyId: user.companyId,
    branchId: branchId,
  },
});

// Multiple branches user has access to
await this.prisma.item.findMany({
  where: {
    companyId: user.companyId,
    branchId: {
      in: user.branchIds,
    },
  },
});
```

## Error Handling

The system throws standard NestJS exceptions:

```typescript
try {
  // Your code here
} catch (error) {
  if (error instanceof UnauthorizedException) {
    // Invalid token or not authenticated
  } else if (error instanceof ForbiddenException) {
    // Insufficient permissions
  }
  throw error;
}
```

## Testing

### Mock User for Tests

```typescript
const mockUser: AuthenticatedUser = {
  id: 'user-1',
  email: 'test@company.com',
  firstName: 'Test',
  lastName: 'User',
  companyId: 'company-1',
  roles: ['ADMIN'],
  permissions: ['INVENTORY_MANAGEMENT:CREATE', 'INVENTORY_MANAGEMENT:READ'],
  branchIds: ['branch-1', 'branch-2'],
  isSuperAdmin: false,
};
```

### Guard Testing

```typescript
describe('PermissionsGuard', () => {
  it('should allow access with correct permissions', async () => {
    const context = createMockExecutionContext(mockUser);
    const guard = new PermissionsGuard(new Reflector(), permissionService);
    
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });
});
```

## Migration Guide

To migrate existing controllers:

1. Add the required imports
2. Apply `JwtAuthGuard` and `CompanyIsolationGuard` to controller
3. Replace `@User()` with `@CurrentUser()`
4. Add permission decorators to routes
5. Update service methods to use company filtering
6. Test thoroughly with different user roles

## Common Patterns

### Controller Template

```typescript
@Controller('your-module')
@UseGuards(JwtAuthGuard, CompanyIsolationGuard)
@ApiTags('your-module')
@ApiBearerAuth()
export class YourController {
  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.service.findAll(user);
  }

  @Post()
  @UseGuards(PermissionsGuard)
  @RequirePermissions('YOUR_MODULE:CREATE')
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateDto) {
    return this.service.create(dto, user);
  }

  @Put(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('YOUR_MODULE:UPDATE')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateDto) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('YOUR_MODULE:DELETE')
  async delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.delete(id, user);
  }
}
```

This system provides comprehensive multi-tenant security while maintaining flexibility and ease of use.
