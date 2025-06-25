import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
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
import { FORMULA_PERMISSIONS } from '../auth/types/permissions.types';
import { CreateFormulaDto } from './dto/create-formula.dto';
import { UpdateFormulaDto } from './dto/update-formula.dto';
import { FormulaService } from './formula.service';

@ApiTags('formula')
@Controller('formula')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class FormulaController {
  constructor(@Inject(FormulaService) private readonly formulaService: FormulaService) {}

  @Post()
  @RequirePermissions(FORMULA_PERMISSIONS.CREATE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new formula' })
  @ApiBody({ type: CreateFormulaDto })
  @ApiResponse({
    status: 201,
    description: 'Formula created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() createFormulaDto: CreateFormulaDto, @CurrentUser() user: AuthenticatedUser) {
    return await this.formulaService.create(createFormulaDto, user.id, user.companyId);
  }

  @Get()
  @RequirePermissions(FORMULA_PERMISSIONS.READ)
  @ApiOperation({ summary: 'Get all formulas' })
  @ApiQuery({
    name: 'isActive',
    required: false,
    description: 'Filter by active status',
    example: 'true',
  })
  @ApiResponse({
    status: 200,
    description: 'List of formulas retrieved successfully',
  })
  async findAll(@CurrentUser() user: AuthenticatedUser, @Query('isActive') isActive?: string) {
    const activeFilter = isActive ? isActive === 'true' : undefined;
    return await this.formulaService.findAll(activeFilter, user.companyId);
  }

  @Get('code/:code')
  @RequirePermissions(FORMULA_PERMISSIONS.READ)
  @ApiOperation({ summary: 'Get a formula by code' })
  @ApiParam({
    name: 'code',
    description: 'Formula code',
    example: 'FORM-001',
  })
  @ApiResponse({
    status: 200,
    description: 'Formula retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Formula not found' })
  async findByCode(@Param('code') code: string, @CurrentUser() user: AuthenticatedUser) {
    return await this.formulaService.findByCode(code, user.companyId);
  }

  @Get(':id')
  @RequirePermissions(FORMULA_PERMISSIONS.READ)
  @ApiOperation({ summary: 'Get a formula by ID' })
  @ApiParam({
    name: 'id',
    description: 'Formula ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Formula retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Formula not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return await this.formulaService.findOne(id, user.companyId);
  }

  @Get(':id/material-requirements')
  @RequirePermissions(FORMULA_PERMISSIONS.READ)
  @ApiOperation({ summary: 'Calculate material requirements for a formula' })
  @ApiParam({
    name: 'id',
    description: 'Formula ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiQuery({
    name: 'outputQuantity',
    description: 'Desired output quantity',
    example: 100,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description: 'Material requirements calculated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async calculateMaterialRequirements(
    @Param('id') id: string,
    @Query('outputQuantity', ParseIntPipe) outputQuantity: number,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return await this.formulaService.calculateMaterialRequirements(
      id,
      outputQuantity,
      user.companyId
    );
  }

  @Patch(':id')
  @RequirePermissions(FORMULA_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: 'Update a formula' })
  @ApiParam({
    name: 'id',
    description: 'Formula ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiBody({ type: UpdateFormulaDto })
  @ApiResponse({
    status: 200,
    description: 'Formula updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async update(
    @Param('id') id: string,
    @Body() updateFormulaDto: UpdateFormulaDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return await this.formulaService.update(id, updateFormulaDto, user.companyId);
  }

  @Patch(':id/toggle-active')
  @RequirePermissions(FORMULA_PERMISSIONS.UPDATE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle formula active status' })
  @ApiParam({
    name: 'id',
    description: 'Formula ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Formula active status toggled successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async toggleActive(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return await this.formulaService.toggleActive(id, user.companyId);
  }

  @Post(':id/clone')
  @RequirePermissions(FORMULA_PERMISSIONS.CREATE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Clone a formula with a new version' })
  @ApiParam({
    name: 'id',
    description: 'Formula ID to clone',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        newVersion: {
          type: 'string',
          description: 'New version for the cloned formula',
          example: 'v2.0',
        },
      },
      required: ['newVersion'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Formula cloned successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async cloneFormula(
    @Param('id') id: string,
    @Body('newVersion') newVersion: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return await this.formulaService.cloneFormula(id, newVersion, user.id, user.companyId);
  }

  @Delete(':id')
  @RequirePermissions(FORMULA_PERMISSIONS.DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a formula' })
  @ApiParam({
    name: 'id',
    description: 'Formula ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 204,
    description: 'Formula deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Formula not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return await this.formulaService.remove(id, user.companyId);
  }
}
