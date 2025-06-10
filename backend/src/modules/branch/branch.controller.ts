import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { type AuthenticatedUser, CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles, UserRole } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BranchService } from './branch.service';
import { QueryBranchDto } from './dto/query-branch.dto';
import { BranchEntity } from './entities/branch.entity';

@ApiTags('branches')
@Controller('branches')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

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
  async findOne(@Param('id') id: string) {
    return this.branchService.findOne(id);
  }
}
