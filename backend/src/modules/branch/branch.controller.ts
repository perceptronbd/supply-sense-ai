import {
  type AuthenticatedUser,
  CurrentUser,
} from '@modules/auth/decorators/current-user.decorator';
import { Roles, UserRole } from '@modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { BranchService } from './branch.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { QueryBranchDto } from './dto/query-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { BranchEntity } from './entities/branch.entity';

@ApiTags('branches')
@Controller('branches')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @Post()
  @Roles(UserRole.SYSTEM_ADMIN)
  @ApiOperation({
    summary: 'Create a new branch',
    description: 'Creates a new branch in the system. Only system admins can create branches.',
  })
  @ApiBody({ type: CreateBranchDto })
  @ApiResponse({
    status: 201,
    description: 'Branch created successfully',
    type: BranchEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - branch code already exists',
  })
  async create(@Body() createBranchDto: CreateBranchDto) {
    return this.branchService.create(createBranchDto);
  }

  @Get()
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.PROCUREMENT_SPECIALIST,
    UserRole.INVENTORY_CLERK,
    UserRole.PRODUCTION_PLANNER
  )
  @ApiOperation({
    summary: 'Get all branches with optional pagination and search',
    description:
      'Returns all branches if no pagination params provided, otherwise returns paginated results',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term for branch name or code',
    example: 'Main',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (1-based). If provided, limit must also be provided.',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page. If provided, page must also be provided.',
    example: 10,
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    description: 'Include inactive branches',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Branches retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/BranchEntity' },
        },
        pagination: {
          type: 'object',
          nullable: true,
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            total: { type: 'number', example: 25 },
            totalPages: { type: 'number', example: 3 },
            hasNext: { type: 'boolean', example: true },
            hasPrev: { type: 'boolean', example: false },
          },
        },
      },
    },
  })
  async findAll(@Query() query: QueryBranchDto) {
    return this.branchService.findAll(query);
  }

  @Get('my-branch')
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.PROCUREMENT_SPECIALIST,
    UserRole.INVENTORY_CLERK,
    UserRole.PRODUCTION_PLANNER
  )
  @ApiOperation({
    summary: "Get current user's branch",
    description: 'Returns the branch associated with the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'User branch retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/BranchEntity' },
        },
        pagination: { type: 'null' },
      },
    },
  })
  async findUserBranch(@CurrentUser() user: AuthenticatedUser) {
    return this.branchService.findUserBranches(user.id);
  }

  @Get(':id')
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.PROCUREMENT_SPECIALIST,
    UserRole.INVENTORY_CLERK,
    UserRole.PRODUCTION_PLANNER
  )
  @ApiOperation({ summary: 'Get a specific branch by ID' })
  @ApiParam({
    name: 'id',
    description: 'Branch UUID',
    example: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Branch retrieved successfully',
    type: BranchEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'Branch not found',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.branchService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.BRANCH_MANAGER)
  @ApiOperation({
    summary: 'Update an existing branch',
    description: 'Updates an existing branch with the provided data',
  })
  @ApiParam({
    name: 'id',
    description: 'Branch UUID',
    example: 'uuid',
  })
  @ApiBody({ type: UpdateBranchDto })
  @ApiResponse({
    status: 200,
    description: 'Branch updated successfully',
    type: BranchEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'Branch not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - branch code already exists',
  })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateBranchDto: UpdateBranchDto) {
    return this.branchService.update(id, updateBranchDto);
  }

  @Delete(':id')
  @Roles(UserRole.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Soft delete a branch',
    description:
      'Deactivates a branch (sets isActive to false). Only system admins can delete branches.',
  })
  @ApiParam({
    name: 'id',
    description: 'Branch UUID',
    example: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Branch deleted successfully',
    type: BranchEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'Branch not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete branch - it has active users or records',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.branchService.remove(id);
  }

  @Delete(':id/hard')
  @Roles(UserRole.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Permanently delete a branch',
    description:
      'Permanently deletes a branch from the system. Only possible if no references exist.',
  })
  @ApiParam({
    name: 'id',
    description: 'Branch UUID',
    example: 'uuid',
  })
  @ApiResponse({
    status: 204,
    description: 'Branch permanently deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Branch not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete branch - it has references in the system',
  })
  async hardDelete(@Param('id', ParseUUIDPipe) id: string) {
    await this.branchService.hardDelete(id);
  }
}
