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
  ParseIntPipe,
} from '@nestjs/common';
import { FormulaService } from './formula.service';
import { CreateFormulaDto } from './dto/create-formula.dto';
import { UpdateFormulaDto } from './dto/update-formula.dto';

@Controller('formula')
export class FormulaController {
  constructor(private readonly formulaService: FormulaService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createFormulaDto: CreateFormulaDto) {
    // TODO: Replace with actual user ID from JWT token
    const userId = 'user-123';
    return await this.formulaService.create(createFormulaDto, userId);
  }

  @Get()
  async findAll(@Query('isActive') isActive?: string) {
    const activeFilter = isActive ? isActive === 'true' : undefined;
    return await this.formulaService.findAll(activeFilter);
  }

  @Get('code/:code')
  async findByCode(@Param('code') code: string) {
    return await this.formulaService.findByCode(code);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.formulaService.findOne(id);
  }

  @Get(':id/material-requirements')
  async calculateMaterialRequirements(
    @Param('id') id: string,
    @Query('outputQuantity', ParseIntPipe) outputQuantity: number
  ) {
    return await this.formulaService.calculateMaterialRequirements(
      id,
      outputQuantity
    );
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateFormulaDto: UpdateFormulaDto
  ) {
    return await this.formulaService.update(id, updateFormulaDto);
  }

  @Patch(':id/toggle-active')
  @HttpCode(HttpStatus.OK)
  async toggleActive(@Param('id') id: string) {
    return await this.formulaService.toggleActive(id);
  }

  @Post(':id/clone')
  @HttpCode(HttpStatus.CREATED)
  async cloneFormula(
    @Param('id') id: string,
    @Body('newVersion') newVersion: string
  ) {
    // TODO: Replace with actual user ID from JWT token
    const userId = 'user-456';
    return await this.formulaService.cloneFormula(id, newVersion, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return await this.formulaService.remove(id);
  }
}
