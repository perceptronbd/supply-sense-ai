import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser, CurrentUser } from './decorators/current-user.decorator';
import { RequirePermissions } from './decorators/permissions.decorator';
import { CompanyIsolationGuard } from './guards/company-isolation.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { PermissionService } from './services/permission.service';

/**
 * Example controller demonstrating multi-tenant auth usage
 * This shows how to use the new authentication and authorization system
 */
@ApiTags('auth-examples')
@Controller('auth-examples')
@UseGuards(JwtAuthGuard, CompanyIsolationGuard) // Apply to all routes
@ApiBearerAuth()
export class AuthExampleController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get('profile')
  @ApiOperation({
    summary: 'Get current user profile',
    description: "Returns the authenticated user's profile with company and permissions info",
  })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        companyId: user.companyId,
        roles: user.roles,
        permissions: user.permissions,
        isSuperAdmin: user.isSuperAdmin,
      },
      context: this.permissionService.getUserContext(user),
    };
  }

  @Get('permissions')
  @ApiOperation({
    summary: 'Get user permissions',
    description: 'Returns detailed information about user permissions and access',
  })
  async getPermissions(@CurrentUser() user: AuthenticatedUser) {
    return {
      allPermissions: user.permissions,
      purchaseRequestPermissions: this.permissionService.getModulePermissions(
        user,
        'PURCHASE_REQUESTS'
      ),
      inventoryPermissions: this.permissionService.getModulePermissions(
        user,
        'INVENTORY_MANAGEMENT'
      ),
      roles: user.roles,
      isSuperAdmin: user.isSuperAdmin,
    };
  }

  @Post('protected-action')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('PURCHASE_REQUESTS:CREATE')
  @ApiOperation({
    summary: 'Example protected action',
    description: 'Demonstrates permission-based access control',
  })
  async protectedAction(
    @CurrentUser() user: AuthenticatedUser,
    @Body() data: Record<string, unknown>
  ) {
    return {
      message: 'Action performed successfully',
      performedBy: `${user.firstName} ${user.lastName}`,
      companyId: user.companyId,
      data,
    };
  }

  @Post('admin-only-action')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('SYSTEM_SETTINGS:EDIT')
  @ApiOperation({
    summary: 'Admin-only action',
    description: 'Demonstrates admin-level permission requirement',
  })
  async adminOnlyAction(@CurrentUser() user: AuthenticatedUser) {
    return {
      message: 'Admin action performed',
      user: `${user.firstName} ${user.lastName}`,
      isSuperAdmin: user.isSuperAdmin,
    };
  }

  @Get('company-data')
  @ApiOperation({
    summary: 'Get company-scoped data',
    description: 'Demonstrates automatic company isolation',
  })
  async getCompanyData(@CurrentUser() user: AuthenticatedUser) {
    // CompanyIsolationGuard automatically ensures data is scoped to user's company
    const companyFilter = this.permissionService.createCompanyFilter(user);

    return {
      message: 'Company data retrieved',
      filter: companyFilter,
      companyId: user.companyId,
    };
  }

  @Get('permission-check/:module/:action')
  @ApiOperation({
    summary: 'Check specific permission',
    description: 'Utility endpoint to check if user has a specific permission',
  })
  async checkPermission(
    @CurrentUser() user: AuthenticatedUser,
    @Param('module') module: string,
    @Param('action') action: string
  ) {
    const hasPermission = this.permissionService.hasPermission(user, module, action);

    return {
      hasPermission,
      permission: `${module}:${action}`,
      userPermissions: user.permissions,
      isSuperAdmin: user.isSuperAdmin,
    };
  }
}
