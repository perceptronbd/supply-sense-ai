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
import { MaterialRequisitionService } from './material-requisition.service';
import {
  CreateMaterialRequisitionDto,
  MRType,
} from './dto/create-material-requisition.dto';
import { UpdateMaterialRequisitionDto } from './dto/update-material-requisition.dto';

@Controller('material-requisition')
export class MaterialRequisitionController {
  constructor(
    private readonly materialRequisitionService: MaterialRequisitionService
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createMaterialRequisitionDto: CreateMaterialRequisitionDto
  ) {
    // TODO: Get actual user ID from authentication
    const userId = 'user-1'; // Placeholder
    return await this.materialRequisitionService.create(
      createMaterialRequisitionDto,
      userId
    );
  }

  @Get()
  async findAll(
    @Query('branchId') branchId?: string,
    @Query('type') type?: MRType
  ) {
    return await this.materialRequisitionService.findAll(branchId, type);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.materialRequisitionService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateMaterialRequisitionDto: UpdateMaterialRequisitionDto
  ) {
    return await this.materialRequisitionService.update(
      id,
      updateMaterialRequisitionDto
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return await this.materialRequisitionService.remove(id);
  }

  // Workflow endpoints
  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  async approve(@Param('id') id: string) {
    // TODO: Get actual user ID from authentication
    const userId = 'user-1'; // Placeholder
    return await this.materialRequisitionService.approve(id, userId);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  async complete(@Param('id') id: string) {
    return await this.materialRequisitionService.complete(id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(@Param('id') id: string) {
    return await this.materialRequisitionService.cancel(id);
  }

  // Utility endpoints
  @Post('from-rf/:rfId')
  @HttpCode(HttpStatus.CREATED)
  async createFromRF(@Param('rfId') rfId: string) {
    // TODO: Get actual user ID from authentication
    const userId = 'user-1'; // Placeholder
    return await this.materialRequisitionService.createFromRF(rfId, userId);
  }

  @Get('branch/:branchId')
  async findByBranch(@Param('branchId') branchId: string) {
    return await this.materialRequisitionService.findAll(branchId);
  }
}
