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
import { REQUEST_FORM_PERMISSIONS } from '../auth/types/permissions.types';
import { CreateRequestFormDto } from './dto/create-request-form.dto';
import { UpdateRequestFormDto } from './dto/update-request-form.dto';
import { RequestFormService } from './request-form.service';

@ApiTags('request-form')
@Controller('request-form')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class RequestFormController {
  constructor(
    @Inject(RequestFormService) private readonly requestFormService: RequestFormService
  ) {}

  @Post()
  @RequirePermissions(REQUEST_FORM_PERMISSIONS.CREATE)
  @ApiOperation({
    summary: 'Create a new request form',
    description: 'Creates a new request form for requesting materials from another branch',
  })
  @ApiBody({
    type: CreateRequestFormDto,
    description: 'Request form creation data',
  })
  @ApiResponse({
    status: 201,
    description: 'Request form created successfully',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      rfNumber: 'RF000001',
      title: 'Monthly inventory request for Branch B',
      status: 'DRAFT',
      fromBranchId: '550e8400-e29b-41d4-a716-446655440001',
      toBranchId: '550e8400-e29b-41d4-a716-446655440002',
      requiredDate: '2025-06-20',
      createdAt: '2025-06-06T10:00:00.000Z',
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(
    @Body() createRequestFormDto: CreateRequestFormDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return await this.requestFormService.create(createRequestFormDto, user.id);
  }

  @Get()
  @RequirePermissions(REQUEST_FORM_PERMISSIONS.READ)
  @ApiOperation({
    summary: 'Get all request forms',
    description:
      'Retrieves all request forms with optional filtering by source and destination branches',
  })
  @ApiQuery({
    name: 'fromBranchId',
    required: false,
    description: 'Filter by source branch ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiQuery({
    name: 'toBranchId',
    required: false,
    description: 'Filter by destination branch ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @ApiResponse({
    status: 200,
    description: 'Request forms retrieved successfully',
    example: [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        rfNumber: 'RF000001',
        title: 'Monthly inventory request for Branch B',
        status: 'DRAFT',
        createdAt: '2025-06-06T10:00:00.000Z',
      },
    ],
  })
  async findAll(
    @Query('fromBranchId') fromBranchId?: string,
    @Query('toBranchId') toBranchId?: string
  ) {
    return await this.requestFormService.findAll(fromBranchId, toBranchId);
  }

  @Get(':id')
  @RequirePermissions(REQUEST_FORM_PERMISSIONS.READ)
  @ApiOperation({
    summary: 'Get request form by ID',
    description: 'Retrieves a specific request form with all related data',
  })
  @ApiParam({
    name: 'id',
    description: 'Request form unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Request form found',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      rfNumber: 'RF000001',
      title: 'Monthly inventory request for Branch B',
      status: 'DRAFT',
      items: [
        {
          id: 'item-1',
          itemId: '550e8400-e29b-41d4-a716-446655440001',
          requestedQty: 50,
          item: { name: 'Raw Material A', code: 'RM001' },
        },
      ],
    },
  })
  @ApiResponse({ status: 404, description: 'Request form not found' })
  async findOne(@Param('id') id: string) {
    return await this.requestFormService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(REQUEST_FORM_PERMISSIONS.UPDATE)
  @ApiOperation({
    summary: 'Update request form',
    description: 'Updates a request form (only allowed in DRAFT status)',
  })
  @ApiParam({
    name: 'id',
    description: 'Request form unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({
    type: UpdateRequestFormDto,
    description: 'Updated request form data',
  })
  @ApiResponse({
    status: 200,
    description: 'Request form updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot update non-draft request form',
  })
  @ApiResponse({ status: 404, description: 'Request form not found' })
  async update(@Param('id') id: string, @Body() updateRequestFormDto: UpdateRequestFormDto) {
    return await this.requestFormService.update(id, updateRequestFormDto);
  }

  @Delete(':id')
  @RequirePermissions(REQUEST_FORM_PERMISSIONS.DELETE)
  @ApiOperation({
    summary: 'Delete request form',
    description: 'Deletes a request form (only allowed in DRAFT status)',
  })
  @ApiParam({
    name: 'id',
    description: 'Request form unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Request form deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete non-draft request form',
  })
  @ApiResponse({ status: 404, description: 'Request form not found' })
  async remove(@Param('id') id: string) {
    return await this.requestFormService.remove(id);
  }

  @Post(':id/submit')
  @RequirePermissions(REQUEST_FORM_PERMISSIONS.UPDATE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit request form',
    description: 'Submits a request form for approval (changes status from DRAFT to SUBMITTED)',
  })
  @ApiParam({
    name: 'id',
    description: 'Request form unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Request form submitted successfully',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      status: 'SUBMITTED',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Can only submit DRAFT request forms',
  })
  @ApiResponse({ status: 404, description: 'Request form not found' })
  async submit(@Param('id') id: string) {
    return await this.requestFormService.submit(id);
  }

  @Post(':id/approve')
  @RequirePermissions(REQUEST_FORM_PERMISSIONS.APPROVE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve request form',
    description: 'Approves a submitted request form',
  })
  @ApiParam({
    name: 'id',
    description: 'Request form unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Request form approved successfully',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      status: 'APPROVED',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Can only approve SUBMITTED request forms',
  })
  @ApiResponse({ status: 404, description: 'Request form not found' })
  async approve(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return await this.requestFormService.approve(id, user.id);
  }

  @Post(':id/reject')
  @RequirePermissions(REQUEST_FORM_PERMISSIONS.REJECT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reject request form',
    description: 'Rejects a submitted request form',
  })
  @ApiParam({
    name: 'id',
    description: 'Request form unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Request form rejected successfully',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      status: 'REJECTED',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Can only reject SUBMITTED request forms',
  })
  @ApiResponse({ status: 404, description: 'Request form not found' })
  async reject(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return await this.requestFormService.reject(id, user.id);
  }

  @Post(':id/ready-for-mr')
  @RequirePermissions(REQUEST_FORM_PERMISSIONS.UPDATE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark request form as ready for material requisition',
    description: 'Marks an approved request form as ready for material requisition creation',
  })
  @ApiParam({
    name: 'id',
    description: 'Request form unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Request form marked as ready for MR successfully',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      status: 'READY_FOR_MR',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Can only mark APPROVED request forms as ready for MR',
  })
  @ApiResponse({ status: 404, description: 'Request form not found' })
  async markReadyForMR(@Param('id') id: string) {
    return await this.requestFormService.markReadyForMR(id);
  }

  @Post('from-template/:templateId')
  @RequirePermissions(REQUEST_FORM_PERMISSIONS.CREATE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create request form from template',
    description: 'Creates a new request form based on a predefined template',
  })
  @ApiParam({
    name: 'templateId',
    description: 'Template unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fromBranchId: {
          type: 'string',
          description: 'Source branch ID',
          example: '550e8400-e29b-41d4-a716-446655440001',
        },
        toBranchId: {
          type: 'string',
          description: 'Destination branch ID',
          example: '550e8400-e29b-41d4-a716-446655440002',
        },
      },
      required: ['fromBranchId', 'toBranchId'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Request form created from template successfully',
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async createFromTemplate(
    @Param('templateId') templateId: string,
    @Body() body: { fromBranchId: string; toBranchId: string },
    @CurrentUser() user: AuthenticatedUser
  ) {
    return await this.requestFormService.createFromTemplate(
      templateId,
      body.fromBranchId,
      body.toBranchId,
      user.id
    );
  }
}
