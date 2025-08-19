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
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { USER_PERMISSIONS } from '@supplysense/types';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginatedUsersEntity, UserEntity } from './entities/user.entity';
import { UserService } from './user.service';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class UserController {
  constructor(@Inject(UserService) private readonly userService: UserService) {}

  @Post()
  @RequirePermissions(USER_PERMISSIONS.CREATE)
  @ApiOperation({
    summary: 'Create a new user',
    description: 'Creates a new user with specified roles and branch assignments',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed or roles/branches not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - email already exists in company or username already exists globally',
  })
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<UserEntity> {
    return this.userService.create(createUserDto, user.companyId);
  }

  @Get()
  @RequirePermissions(USER_PERMISSIONS.READ)
  @ApiOperation({
    summary: 'Get all users with optional filtering and pagination',
    description:
      'Returns all users if no pagination params provided, otherwise returns paginated results. Supports search, role/branch filtering, and includes.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term for user name, email, or username',
    example: 'john',
  })
  @ApiQuery({
    name: 'roleId',
    required: false,
    description: 'Filter by role ID',
    example: 'role-uuid',
  })
  @ApiQuery({
    name: 'branchId',
    required: false,
    description: 'Filter by branch ID',
    example: 'branch-uuid',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    description: 'Filter by active status',
    example: true,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination (1-based)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Sort field',
    example: 'firstName',
    enum: ['firstName', 'lastName', 'email', 'username', 'createdAt', 'lastLogin'],
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order',
    example: 'asc',
    enum: ['asc', 'desc'],
  })
  @ApiQuery({
    name: 'includeRoles',
    required: false,
    description: 'Include user roles in response',
    example: true,
  })
  @ApiQuery({
    name: 'includeBranches',
    required: false,
    description: 'Include user branches in response',
    example: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    schema: {
      oneOf: [
        {
          type: 'array',
          items: { $ref: '#/components/schemas/UserEntity' },
        },
        { $ref: '#/components/schemas/PaginatedUsersEntity' },
      ],
    },
  })
  async findAll(
    @Query() query: QueryUserDto,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<UserEntity[] | PaginatedUsersEntity> {
    return this.userService.findAll(query, user.companyId);
  }

  @Get(':id')
  @RequirePermissions(USER_PERMISSIONS.READ)
  @ApiOperation({
    summary: 'Get a specific user by ID',
    description: 'Returns detailed user information with roles and branches',
  })
  @ApiParam({
    name: 'id',
    description: 'User UUID',
    example: 'user-uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    type: UserEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<UserEntity> {
    return this.userService.findOne(id, user.companyId);
  }

  @Put(':id')
  @RequirePermissions(USER_PERMISSIONS.UPDATE)
  @ApiOperation({
    summary: 'Update user information',
    description: 'Updates user basic information (excluding roles and branches)',
  })
  @ApiParam({
    name: 'id',
    description: 'User UUID',
    example: 'user-uuid',
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - email or username already exists',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<UserEntity> {
    return this.userService.update(id, updateUserDto, user.companyId);
  }

  @Put(':id/roles')
  @RequirePermissions(USER_PERMISSIONS.MANAGE)
  @ApiOperation({
    summary: 'Manage user roles',
    description: 'Assign, remove, or replace user roles',
  })
  @ApiParam({
    name: 'id',
    description: 'User UUID',
    example: 'user-uuid',
  })
  @ApiBody({ type: AssignRolesDto })
  @ApiResponse({
    status: 200,
    description: 'User roles updated successfully',
    type: UserEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid roles or user must have at least one role',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async assignRoles(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignRolesDto: AssignRolesDto,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<UserEntity> {
    return this.userService.assignRoles(id, assignRolesDto, user.companyId);
  }

  @Put(':id/branches')
  @RequirePermissions(USER_PERMISSIONS.MANAGE)
  @ApiOperation({
    summary: 'Manage user branches',
    description: 'Assign, remove, or replace user branch assignments',
  })
  @ApiParam({
    name: 'id',
    description: 'User UUID',
    example: 'user-uuid',
  })

  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid branches or user must have at least one branch',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })

  @Delete(':id')
  @RequirePermissions(USER_PERMISSIONS.DELETE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Deactivate user (soft delete)',
    description: 'Marks a user as inactive. Cannot deactivate super admin users.',
  })
  @ApiParam({
    name: 'id',
    description: 'User UUID',
    example: 'user-uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'User deactivated successfully',
    type: UserEntity,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - cannot deactivate super admin',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<UserEntity> {
    return this.userService.remove(id, user.companyId);
  }

  @Put(':id/activate')
  @RequirePermissions(USER_PERMISSIONS.UPDATE)
  @ApiOperation({
    summary: 'Activate user',
    description: 'Marks a user as active',
  })
  @ApiParam({
    name: 'id',
    description: 'User UUID',
    example: 'user-uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'User activated successfully',
    type: UserEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async activate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<UserEntity> {
    return this.userService.activate(id, user.companyId);
  }
}
