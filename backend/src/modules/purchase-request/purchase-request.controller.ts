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
  HttpException,
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
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import { UpdatePurchaseRequestDto } from './dto/update-purchase-request.dto';
import { PurchaseRequestService } from './purchase-request.service';

@ApiTags('purchase-request')
@Controller('purchase-request')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PurchaseRequestController {
  constructor(
    @Inject(PurchaseRequestService) private readonly purchaseRequestService: PurchaseRequestService
  ) {}

  @Get('debug-user')
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.PROCUREMENT_SPECIALIST,
    UserRole.INVENTORY_CLERK
  )
  @ApiOperation({ summary: 'Debug user information' })
  @ApiResponse({
    status: 200,
    description: 'User debug information retrieved successfully',
  })
  async debugUser(@CurrentUser() user: AuthenticatedUser) {
    console.log('Debug User Object:', user);
    return { user };
  }

  @Post()
  @Roles(UserRole.BRANCH_MANAGER, UserRole.PROCUREMENT_SPECIALIST)
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
      return await this.purchaseRequestService.create(createPurchaseRequestDto, user.id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.PROCUREMENT_SPECIALIST,
    UserRole.INVENTORY_CLERK
  )
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
  async findAll(@Query('branchId') branchId?: string) {
    return await this.purchaseRequestService.findAll(branchId);
  }

  @Get(':id')
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.PROCUREMENT_SPECIALIST,
    UserRole.INVENTORY_CLERK
  )
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
  async findOne(@Param('id') id: string) {
    try {
      return await this.purchaseRequestService.findOne(id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Patch(':id')
  @Roles(UserRole.BRANCH_MANAGER, UserRole.PROCUREMENT_SPECIALIST)
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
    @Body() updatePurchaseRequestDto: UpdatePurchaseRequestDto
  ) {
    try {
      return await this.purchaseRequestService.update(id, updatePurchaseRequestDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.BRANCH_MANAGER)
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
  async remove(@Param('id') id: string) {
    try {
      return await this.purchaseRequestService.remove(id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post(':id/submit')
  @Roles(UserRole.BRANCH_MANAGER, UserRole.PROCUREMENT_SPECIALIST)
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
  async submit(@Param('id') id: string) {
    try {
      return await this.purchaseRequestService.submit(id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post(':id/approve')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.BRANCH_MANAGER)
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
      return await this.purchaseRequestService.approve(id, user.id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post(':id/reject')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.BRANCH_MANAGER)
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
      return await this.purchaseRequestService.reject(id, user.id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
