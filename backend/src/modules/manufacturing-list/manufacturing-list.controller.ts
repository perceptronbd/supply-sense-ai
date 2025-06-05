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
  HttpCode,
} from '@nestjs/common';
import { ManufacturingListService } from './manufacturing-list.service';
import {
  CreateManufacturingListDto,
  MLStatus,
} from './dto/create-manufacturing-list.dto';
import { UpdateManufacturingListDto } from './dto/update-manufacturing-list.dto';

@Controller('manufacturing-list')
export class ManufacturingListController {
  constructor(
    private readonly manufacturingListService: ManufacturingListService
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createManufacturingListDto: CreateManufacturingListDto) {
    // TODO: Get actual user ID from authentication
    const userId = 'user-1'; // Placeholder
    return await this.manufacturingListService.create(
      createManufacturingListDto,
      userId
    );
  }

  @Get()
  async findAll(
    @Query('branchId') branchId?: string,
    @Query('status') status?: MLStatus
  ) {
    return await this.manufacturingListService.findAll(branchId, status);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.manufacturingListService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateManufacturingListDto: UpdateManufacturingListDto
  ) {
    return await this.manufacturingListService.update(
      id,
      updateManufacturingListDto
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return await this.manufacturingListService.remove(id);
  }

  // Workflow endpoints
  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  async startProduction(@Param('id') id: string) {
    return await this.manufacturingListService.startProduction(id);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  async completeProduction(@Param('id') id: string) {
    return await this.manufacturingListService.completeProduction(id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(@Param('id') id: string) {
    return await this.manufacturingListService.cancel(id);
  }

  // Reporting endpoints
  @Get('branch/:branchId/summary')
  async getProductionSummary(
    @Param('branchId') branchId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return await this.manufacturingListService.getProductionSummary(
      branchId,
      start,
      end
    );
  }

  @Get('branch/:branchId')
  async findByBranch(@Param('branchId') branchId: string) {
    return await this.manufacturingListService.findAll(branchId);
  }
}
