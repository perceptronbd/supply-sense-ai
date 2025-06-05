import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { PurchaseRequestService } from './purchase-request.service';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import { UpdatePurchaseRequestDto } from './dto/update-purchase-request.dto';

@Controller('purchase-request')
export class PurchaseRequestController {
  constructor(
    private readonly purchaseRequestService: PurchaseRequestService
  ) {}

  @Post()
  async create(@Body() createPurchaseRequestDto: CreatePurchaseRequestDto) {
    try {
      // TODO: Get userId from JWT token or session
      const userId = 'temp-user-id'; // Placeholder until auth is implemented
      return await this.purchaseRequestService.create(
        createPurchaseRequestDto,
        userId
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  async findAll(@Query('branchId') branchId?: string) {
    return await this.purchaseRequestService.findAll(branchId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.purchaseRequestService.findOne(id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePurchaseRequestDto: UpdatePurchaseRequestDto
  ) {
    try {
      return await this.purchaseRequestService.update(
        id,
        updatePurchaseRequestDto
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await this.purchaseRequestService.remove(id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post(':id/submit')
  async submit(@Param('id') id: string) {
    try {
      return await this.purchaseRequestService.submit(id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post(':id/approve')
  async approve(@Param('id') id: string) {
    try {
      // TODO: Get userId from JWT token or session
      const userId = 'temp-user-id'; // Placeholder until auth is implemented
      return await this.purchaseRequestService.approve(id, userId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post(':id/reject')
  async reject(@Param('id') id: string) {
    try {
      // TODO: Get userId from JWT token or session
      const userId = 'temp-user-id'; // Placeholder until auth is implemented
      return await this.purchaseRequestService.reject(id, userId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
