import {
  type AuthenticatedUser,
  CurrentUser,
} from '@modules/auth/decorators/current-user.decorator';
import { RequirePermissions } from '@modules/auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@modules/auth/guards/permissions.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PERMISSION_PERMISSIONS, ROLE_PERMISSIONS } from '@supplysense/types';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PermissionEntity, RoleEntity } from './entities/role.entity';
import { RoleService } from './role.service';

@ApiTags('roles')
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class RoleController {
  constructor(@Inject(RoleService) private readonly roleService: RoleService) {}

  @Post()
  @RequirePermissions(ROLE_PERMISSIONS.CREATE)
  @ApiOperation({
    summary: 'Create a new role (Discord-style)',
    description: 'Creates a new custom role with specified permissions for the company',
  })
  @ApiBody({ type: CreateRoleDto })
  @ApiResponse({
    status: 201,
    description: 'Role created successfully',
    type: RoleEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed or permissions not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - role name already exists in company',
  })
  async create(
    @Body() createRoleDto: CreateRoleDto,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<RoleEntity> {
    return this.roleService.create(createRoleDto, user.companyId);
  }

  @Get()
  @RequirePermissions(ROLE_PERMISSIONS.READ)
  @ApiOperation({
    summary: 'Get all roles for the company',
    description: 'Returns all active roles with their permissions and user counts',
  })
  @ApiResponse({
    status: 200,
    description: 'Roles retrieved successfully',
    type: [RoleEntity],
  })
  async findAll(@CurrentUser() user: AuthenticatedUser): Promise<RoleEntity[]> {
    return this.roleService.findAll(user.companyId);
  }

  @Get('permissions')
  @RequirePermissions(PERMISSION_PERMISSIONS.READ)
  @ApiOperation({
    summary: 'Get all available permissions',
    description: 'Returns all permissions organized by module for role creation/editing',
  })
  @ApiResponse({
    status: 200,
    description: 'Permissions retrieved successfully',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'array',
        items: { $ref: '#/components/schemas/PermissionEntity' },
      },
      example: {
        USERS: [
          {
            id: 'perm-uuid-1',
            module: 'USERS',
            action: 'CREATE',
            permission: 'USERS:CREATE',
            description: 'Create new users',
          },
        ],
        ROLES: [
          {
            id: 'perm-uuid-2',
            module: 'ROLES',
            action: 'READ',
            permission: 'ROLES:READ',
            description: 'View roles',
          },
        ],
      },
    },
  })
  async getPermissions(): Promise<Record<string, PermissionEntity[]>> {
    return this.roleService.getPermissionsByModule();
  }

  @Get('permissions/all')
  @RequirePermissions(PERMISSION_PERMISSIONS.READ)
  @ApiOperation({
    summary: 'Get all permissions as flat list',
    description: 'Returns all permissions as a flat array for simple selection',
  })
  @ApiResponse({
    status: 200,
    description: 'All permissions retrieved successfully',
    type: [PermissionEntity],
  })
  async getAllPermissions(): Promise<PermissionEntity[]> {
    return this.roleService.getAllPermissions();
  }

  @Get(':id')
  @RequirePermissions(ROLE_PERMISSIONS.READ)
  @ApiOperation({
    summary: 'Get a specific role by ID',
    description: 'Returns detailed role information with permissions and user count',
  })
  @ApiParam({
    name: 'id',
    description: 'Role UUID',
    example: 'role-uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Role retrieved successfully',
    type: RoleEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<RoleEntity> {
    return this.roleService.findOne(id, user.companyId);
  }

  @Put(':id')
  @RequirePermissions(ROLE_PERMISSIONS.UPDATE)
  @ApiOperation({
    summary: 'Update role information',
    description: 'Updates role basic information (name, description, active status)',
  })
  @ApiParam({
    name: 'id',
    description: 'Role UUID',
    example: 'role-uuid',
  })
  @ApiBody({ type: UpdateRoleDto })
  @ApiResponse({
    status: 200,
    description: 'Role updated successfully',
    type: RoleEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - role name already exists',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<RoleEntity> {
    return this.roleService.update(id, updateRoleDto, user.companyId);
  }

  @Put(':id/permissions')
  @RequirePermissions(ROLE_PERMISSIONS.MANAGE)
  @ApiOperation({
    summary: 'Manage role permissions (Discord-style)',
    description: 'Assign, remove, or replace permissions for a role',
  })
  @ApiParam({
    name: 'id',
    description: 'Role UUID',
    example: 'role-uuid',
  })
  @ApiBody({ type: AssignPermissionsDto })
  @ApiResponse({
    status: 200,
    description: 'Role permissions updated successfully',
    type: RoleEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid permissions or role must have at least one permission',
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found',
  })
  async assignPermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignPermissionsDto: AssignPermissionsDto,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<RoleEntity> {
    return this.roleService.assignPermissions(id, assignPermissionsDto, user.companyId);
  }

  @Delete(':id')
  @RequirePermissions(ROLE_PERMISSIONS.DELETE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Deactivate role (soft delete)',
    description: 'Marks a role as inactive. Cannot delete roles that are assigned to users.',
  })
  @ApiParam({
    name: 'id',
    description: 'Role UUID',
    example: 'role-uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Role deactivated successfully',
    type: RoleEntity,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - cannot delete role assigned to users',
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<RoleEntity> {
    return this.roleService.remove(id, user.companyId);
  }

  @Put(':id/activate')
  @RequirePermissions(ROLE_PERMISSIONS.UPDATE)
  @ApiOperation({
    summary: 'Activate role',
    description: 'Marks a role as active',
  })
  @ApiParam({
    name: 'id',
    description: 'Role UUID',
    example: 'role-uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Role activated successfully',
    type: RoleEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found',
  })
  async activate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<RoleEntity> {
    return this.roleService.activate(id, user.companyId);
  }
}
