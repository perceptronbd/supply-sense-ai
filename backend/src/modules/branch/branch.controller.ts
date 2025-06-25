import {
  type AuthenticatedUser,
  CurrentUser,
} from '@modules/auth/decorators/current-user.decorator';
import { RequirePermissions } from '@modules/auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@modules/auth/guards/permissions.guard';
import { BRANCH_PERMISSIONS } from '@modules/auth/types/permissions.types';
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
import { BranchService } from './branch.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { QueryBranchDto } from './dto/query-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { BranchEntity } from './entities/branch.entity';

@ApiTags('branches')
@Controller('branches')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class BranchController {
  constructor(@Inject(BranchService) private readonly branchService: BranchService) {}

  @Post()
  @RequirePermissions(BRANCH_PERMISSIONS.CREATE)
  @ApiOperation({
    summary: 'Create a new branch',
    description: 'Creates a new branch in the system',
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
  async create(@Body() createBranchDto: CreateBranchDto, @CurrentUser() user: AuthenticatedUser) {
    return this.branchService.create(createBranchDto, user.companyId);
  }

  @Get()
  @RequirePermissions(BRANCH_PERMISSIONS.READ)
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
  async findAll(@Query() query: QueryBranchDto, @CurrentUser() user: AuthenticatedUser) {
    return this.branchService.findAll(query, user.companyId);
  }

  @Get('my-branch')
  @RequirePermissions(BRANCH_PERMISSIONS.READ)
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
  @RequirePermissions(BRANCH_PERMISSIONS.READ)
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
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.branchService.findOne(id, user.companyId);
  }

  @Put(':id')
  @RequirePermissions(BRANCH_PERMISSIONS.UPDATE)
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
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBranchDto: UpdateBranchDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.branchService.update(id, updateBranchDto, user.companyId);
  }

  @Delete(':id')
  @RequirePermissions(BRANCH_PERMISSIONS.DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft delete a branch',
    description: 'Marks a branch as inactive (soft delete)',
  })
  @ApiParam({
    name: 'id',
    description: 'Branch UUID',
    example: 'uuid',
  })
  @ApiResponse({
    status: 204,
    description: 'Branch deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Branch not found',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.branchService.remove(id, user.companyId);
  }

  @Delete(':id/hard')
  @RequirePermissions(BRANCH_PERMISSIONS.DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Permanently delete a branch',
    description: 'Permanently removes a branch from the system (hard delete)',
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
  async hardDelete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.branchService.hardDelete(id, user.companyId);
  }
}
