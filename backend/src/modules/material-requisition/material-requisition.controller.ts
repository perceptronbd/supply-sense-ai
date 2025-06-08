import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateMaterialRequisitionDto, MRType } from './dto/create-material-requisition.dto';
import { UpdateMaterialRequisitionDto } from './dto/update-material-requisition.dto';
import { MaterialRequisitionService } from './material-requisition.service';

@ApiTags('material-requisition')
@Controller('material-requisition')
export class MaterialRequisitionController {
  constructor(private readonly materialRequisitionService: MaterialRequisitionService) {}

  @Post()
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
  async create(@Body() createMaterialRequisitionDto: CreateMaterialRequisitionDto) {
    // TODO: Get actual user ID from authentication
    const userId = 'user-1'; // Placeholder
    return await this.materialRequisitionService.create(createMaterialRequisitionDto, userId);
  }

  @Get()
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
    description: 'Can only approve DRAFT material requisitions',
  })
  @ApiResponse({ status: 404, description: 'Material requisition not found' })
  async approve(@Param('id') id: string) {
    // TODO: Get actual user ID from authentication
    const userId = 'user-1'; // Placeholder
    return await this.materialRequisitionService.approve(id, userId);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete material requisition',
    description:
      'Completes a material requisition. For TRANSFER type, deducts stock from source branch.',
  })
  @ApiParam({
    name: 'id',
    description: 'Material requisition unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Material requisition completed successfully',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      status: 'COMPLETED',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Can only complete APPROVED material requisitions',
  })
  @ApiResponse({ status: 404, description: 'Material requisition not found' })
  async complete(@Param('id') id: string) {
    return await this.materialRequisitionService.complete(id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel material requisition',
    description: 'Cancels a material requisition (cannot cancel COMPLETED requisitions)',
  })
  @ApiParam({
    name: 'id',
    description: 'Material requisition unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Material requisition cancelled successfully',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      status: 'CANCELLED',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot cancel completed material requisitions',
  })
  @ApiResponse({ status: 404, description: 'Material requisition not found' })
  async cancel(@Param('id') id: string) {
    return await this.materialRequisitionService.cancel(id);
  }

  // Utility endpoints
  @Post('from-rf/:rfId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create material requisition from request form',
    description: 'Creates a new material requisition based on an approved request form',
  })
  @ApiParam({
    name: 'rfId',
    description: 'Request form unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 201,
    description: 'Material requisition created from request form successfully',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      mrNumber: 'MR000001',
      title: 'MR for RF000001',
      rfId: '550e8400-e29b-41d4-a716-446655440001',
      type: 'TRANSFER',
      status: 'DRAFT',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Can only create MR from APPROVED or READY_FOR_MR request forms',
  })
  @ApiResponse({ status: 404, description: 'Request form not found' })
  async createFromRF(@Param('rfId') rfId: string) {
    // TODO: Get actual user ID from authentication
    const userId = 'user-1'; // Placeholder
    return await this.materialRequisitionService.createFromRF(rfId, userId);
  }

  @Get('branch/:branchId')
  @ApiOperation({
    summary: 'Get material requisitions by branch',
    description: 'Retrieves all material requisitions associated with a specific branch',
  })
  @ApiParam({
    name: 'branchId',
    description: 'Branch unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @ApiResponse({
    status: 200,
    description: 'Material requisitions for branch retrieved successfully',
    example: [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        mrNumber: 'MR000001',
        type: 'TRANSFER',
        status: 'DRAFT',
      },
    ],
  })
  async findByBranch(@Param('branchId') branchId: string) {
    return await this.materialRequisitionService.findAll(branchId);
  }
}
