import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
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
import { PURCHASE_REQUEST_PERMISSIONS } from '../auth/types/permissions.types';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import { UpdatePurchaseRequestDto } from './dto/update-purchase-request.dto';
import { PurchaseRequestService } from './purchase-request.service';

@ApiTags('purchase-request')
@Controller('purchase-request')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class PurchaseRequestController {
  constructor(
    @Inject(PurchaseRequestService) private readonly purchaseRequestService: PurchaseRequestService
  ) {}

  @Post()
  @RequirePermissions(PURCHASE_REQUEST_PERMISSIONS.CREATE)
  @ApiOperation({ summary: 'Create a new purchase request' })
  @ApiBody({ type: CreatePurchaseRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Purchase request created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async create(
    @Body() createPurchaseRequestDto: CreatePurchaseRequestDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    try {
      return await this.purchaseRequestService.create(createPurchaseRequestDto, user);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  @RequirePermissions(PURCHASE_REQUEST_PERMISSIONS.READ)
  @ApiOperation({ summary: 'Get all purchase requests' })
  @ApiQuery({
    name: 'branchId',
    required: false,
    description: 'Filter by branch ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'List of purchase requests retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return await this.purchaseRequestService.findAll(user);
  }

  @Get(':id')
  @RequirePermissions(PURCHASE_REQUEST_PERMISSIONS.READ)
  @ApiOperation({ summary: 'Get a purchase request by ID' })
  @ApiParam({
    name: 'id',
    description: 'Purchase request ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Purchase request retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Purchase request not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    try {
      return await this.purchaseRequestService.findOne(id, user);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Patch(':id')
  @RequirePermissions(PURCHASE_REQUEST_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: 'Update a purchase request' })
  @ApiParam({
    name: 'id',
    description: 'Purchase request ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiBody({ type: UpdatePurchaseRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Purchase request updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async update(
    @Param('id') id: string,
    @Body() updatePurchaseRequestDto: UpdatePurchaseRequestDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    try {
      return await this.purchaseRequestService.update(id, updatePurchaseRequestDto, user);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id')
  @RequirePermissions(PURCHASE_REQUEST_PERMISSIONS.DELETE)
  @ApiOperation({ summary: 'Delete a purchase request' })
  @ApiParam({
    name: 'id',
    description: 'Purchase request ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Purchase request deleted successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    try {
      return await this.purchaseRequestService.remove(id, user);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post(':id/submit')
  @RequirePermissions(PURCHASE_REQUEST_PERMISSIONS.SUBMIT)
  @ApiOperation({ summary: 'Submit a purchase request for approval' })
  @ApiParam({
    name: 'id',
    description: 'Purchase request ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Purchase request submitted successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async submit(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    try {
      return await this.purchaseRequestService.submit(id, user);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post(':id/approve')
  @RequirePermissions(PURCHASE_REQUEST_PERMISSIONS.APPROVE)
  @ApiOperation({ summary: 'Approve a purchase request' })
  @ApiParam({
    name: 'id',
    description: 'Purchase request ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Purchase request approved successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async approve(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    try {
      return await this.purchaseRequestService.approve(id, user);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post(':id/reject')
  @RequirePermissions(PURCHASE_REQUEST_PERMISSIONS.REJECT)
  @ApiOperation({ summary: 'Reject a purchase request' })
  @ApiParam({
    name: 'id',
    description: 'Purchase request ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Purchase request rejected successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async reject(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    try {
      return await this.purchaseRequestService.reject(id, user);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
