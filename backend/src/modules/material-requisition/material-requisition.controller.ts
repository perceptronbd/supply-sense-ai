import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
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
import { type AuthenticatedUser, CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { MATERIAL_REQUISITION_PERMISSIONS } from '../auth/types/permissions.types';
import { CreateMaterialRequisitionDto, MRType } from './dto/create-material-requisition.dto';
import { UpdateMaterialRequisitionDto } from './dto/update-material-requisition.dto';
import { MaterialRequisitionService } from './material-requisition.service';

@ApiTags('material-requisition')
@Controller('material-requisition')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class MaterialRequisitionController {
  constructor(
    @Inject(MaterialRequisitionService)
    private readonly materialRequisitionService: MaterialRequisitionService
  ) {}

  @Post()
  @RequirePermissions(MATERIAL_REQUISITION_PERMISSIONS.CREATE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new material requisition',
    description:
      'Creates a new material requisition for either transfer between branches or trim/waste disposal',
  })
  @ApiBody({
    type: CreateMaterialRequisitionDto,
    description: 'Material requisition creation data',
  })
  @ApiResponse({
    status: 201,
    description: 'Material requisition created successfully',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      mrNumber: 'MR000001',
      title: 'Monthly material transfer to Branch B',
      type: 'TRANSFER',
      fromBranchId: '550e8400-e29b-41d4-a716-446655440002',
      toBranchId: '550e8400-e29b-41d4-a716-446655440003',
      status: 'DRAFT',
      createdAt: '2025-06-06T10:00:00.000Z',
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(
    @Body() createMaterialRequisitionDto: CreateMaterialRequisitionDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return await this.materialRequisitionService.create(createMaterialRequisitionDto, user.id);
  }

  @Get()
  @RequirePermissions(MATERIAL_REQUISITION_PERMISSIONS.READ)
  @ApiOperation({
    summary: 'Get all material requisitions',
    description: 'Retrieves all material requisitions with optional filtering by branch and type',
  })
  @ApiQuery({
    name: 'branchId',
    required: false,
    description: 'Filter by branch ID (includes source, destination, or waste branch)',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by material requisition type',
    enum: MRType,
  })
  @ApiResponse({
    status: 200,
    description: 'Material requisitions retrieved successfully',
    example: [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        mrNumber: 'MR000001',
        title: 'Monthly material transfer to Branch B',
        type: 'TRANSFER',
        status: 'DRAFT',
        createdAt: '2025-06-06T10:00:00.000Z',
      },
    ],
  })
  async findAll(@Query('branchId') branchId?: string, @Query('type') type?: MRType) {
    return await this.materialRequisitionService.findAll(branchId, type);
  }

  @Get(':id')
  @RequirePermissions(MATERIAL_REQUISITION_PERMISSIONS.READ)
  @ApiOperation({
    summary: 'Get material requisition by ID',
    description: 'Retrieves a specific material requisition with all related data',
  })
  @ApiParam({
    name: 'id',
    description: 'Material requisition unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Material requisition found',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      mrNumber: 'MR000001',
      title: 'Monthly material transfer to Branch B',
      type: 'TRANSFER',
      status: 'DRAFT',
      items: [
        {
          id: 'item-1',
          itemId: '550e8400-e29b-41d4-a716-446655440001',
          quantity: 100,
          item: { name: 'Raw Material A', code: 'RM001' },
        },
      ],
    },
  })
  @ApiResponse({ status: 404, description: 'Material requisition not found' })
  async findOne(@Param('id') id: string) {
    return await this.materialRequisitionService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(MATERIAL_REQUISITION_PERMISSIONS.UPDATE)
  @ApiOperation({
    summary: 'Update material requisition',
    description: 'Updates a material requisition (only allowed in DRAFT status)',
  })
  @ApiParam({
    name: 'id',
    description: 'Material requisition unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({
    type: UpdateMaterialRequisitionDto,
    description: 'Updated material requisition data',
  })
  @ApiResponse({
    status: 200,
    description: 'Material requisition updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot update non-draft material requisition',
  })
  @ApiResponse({ status: 404, description: 'Material requisition not found' })
  async update(
    @Param('id') id: string,
    @Body() updateMaterialRequisitionDto: UpdateMaterialRequisitionDto
  ) {
    return await this.materialRequisitionService.update(id, updateMaterialRequisitionDto);
  }

  @Delete(':id')
  @RequirePermissions(MATERIAL_REQUISITION_PERMISSIONS.DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete material requisition',
    description: 'Deletes a material requisition (only allowed in DRAFT status)',
  })
  @ApiParam({
    name: 'id',
    description: 'Material requisition unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 204,
    description: 'Material requisition deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete non-draft material requisition',
  })
  @ApiResponse({ status: 404, description: 'Material requisition not found' })
  async remove(@Param('id') id: string) {
    return await this.materialRequisitionService.remove(id);
  }

  // Workflow endpoints
  @Post(':id/approve')
  @RequirePermissions(MATERIAL_REQUISITION_PERMISSIONS.APPROVE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve material requisition',
    description: 'Approves a material requisition. For TRIM_WASTE type, immediately deducts stock.',
  })
  @ApiParam({
    name: 'id',
    description: 'Material requisition unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Material requisition approved successfully',
    example: { id: '550e8400-e29b-41d4-a716-446655440000', status: 'APPROVED' },
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot approve non-submitted material requisition',
  })
  @ApiResponse({ status: 404, description: 'Material requisition not found' })
  async approve(@Param('id') id: string) {
    return await this.materialRequisitionService.approve(id);
  }

  @Post(':id/complete')
  @RequirePermissions(MATERIAL_REQUISITION_PERMISSIONS.UPDATE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete material requisition',
    description: 'Marks material requisition as completed (for TRANSFER type)',
  })
  @ApiParam({
    name: 'id',
    description: 'Material requisition unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Material requisition completed successfully',
    example: { id: '550e8400-e29b-41d4-a716-446655440000', status: 'COMPLETED' },
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot complete non-approved material requisition',
  })
  @ApiResponse({ status: 404, description: 'Material requisition not found' })
  async complete(@Param('id') id: string) {
    return await this.materialRequisitionService.complete(id);
  }

  @Post(':id/cancel')
  @RequirePermissions(MATERIAL_REQUISITION_PERMISSIONS.REJECT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel material requisition',
    description: 'Cancels a material requisition',
  })
  @ApiParam({
    name: 'id',
    description: 'Material requisition unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Material requisition cancelled successfully',
    example: { id: '550e8400-e29b-41d4-a716-446655440000', status: 'CANCELLED' },
  })
  @ApiResponse({ status: 404, description: 'Material requisition not found' })
  async cancel(@Param('id') id: string) {
    return await this.materialRequisitionService.cancel(id);
  }

  @Post('from-rf/:rfId')
  @RequirePermissions(MATERIAL_REQUISITION_PERMISSIONS.CREATE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create material requisition from request form',
    description: 'Creates a new material requisition based on an approved request form',
  })
  @ApiParam({
    name: 'rfId',
    description: 'Request form unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 201,
    description: 'Material requisition created from request form successfully',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440001',
      mrNumber: 'MR000002',
      title: 'Auto-generated from RF000001',
      type: 'TRANSFER',
      status: 'DRAFT',
    },
  })
  @ApiResponse({ status: 400, description: 'Cannot create MR from non-approved RF' })
  @ApiResponse({ status: 404, description: 'Request form not found' })
  async createFromRF(@Param('rfId') rfId: string) {
    return await this.materialRequisitionService.createFromRequestForm(rfId);
  }

  @Get('branch/:branchId')
  @RequirePermissions(MATERIAL_REQUISITION_PERMISSIONS.READ)
  @ApiOperation({
    summary: 'Get material requisitions by branch',
    description: 'Retrieves material requisitions for a specific branch',
  })
  @ApiParam({
    name: 'branchId',
    description: 'Branch unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @ApiResponse({
    status: 200,
    description: 'Branch material requisitions retrieved successfully',
  })
  async findByBranch(@Param('branchId') branchId: string) {
    return await this.materialRequisitionService.findByBranch(branchId);
  }
}
