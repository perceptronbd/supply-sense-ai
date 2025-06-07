import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { CreateFormulaDto } from "./dto/create-formula.dto";
import { UpdateFormulaDto } from "./dto/update-formula.dto";
import { FormulaService } from "./formula.service";

@ApiTags("formula")
@Controller("formula")
export class FormulaController {
  constructor(private readonly formulaService: FormulaService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a new formula" })
  @ApiBody({ type: CreateFormulaDto })
  @ApiResponse({
    status: 201,
    description: "Formula created successfully",
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  async create(@Body() createFormulaDto: CreateFormulaDto) {
    // TODO: Replace with actual user ID from JWT token
    const userId = "user-123";
    return await this.formulaService.create(createFormulaDto, userId);
  }

  @Get()
  @ApiOperation({ summary: "Get all formulas" })
  @ApiQuery({
    name: "isActive",
    required: false,
    description: "Filter by active status",
    example: "true",
  })
  @ApiResponse({
    status: 200,
    description: "List of formulas retrieved successfully",
  })
  async findAll(@Query("isActive") isActive?: string) {
    const activeFilter = isActive ? isActive === "true" : undefined;
    return await this.formulaService.findAll(activeFilter);
  }

  @Get("code/:code")
  @ApiOperation({ summary: "Get a formula by code" })
  @ApiParam({
    name: "code",
    description: "Formula code",
    example: "FORM-001",
  })
  @ApiResponse({
    status: 200,
    description: "Formula retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Formula not found" })
  async findByCode(@Param("code") code: string) {
    return await this.formulaService.findByCode(code);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a formula by ID" })
  @ApiParam({
    name: "id",
    description: "Formula ID",
    example: "550e8400-e29b-41d4-a716-446655440001",
  })
  @ApiResponse({
    status: 200,
    description: "Formula retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Formula not found" })
  async findOne(@Param("id") id: string) {
    return await this.formulaService.findOne(id);
  }

  @Get(":id/material-requirements")
  @ApiOperation({ summary: "Calculate material requirements for a formula" })
  @ApiParam({
    name: "id",
    description: "Formula ID",
    example: "550e8400-e29b-41d4-a716-446655440001",
  })
  @ApiQuery({
    name: "outputQuantity",
    description: "Desired output quantity",
    example: 100,
    type: "integer",
  })
  @ApiResponse({
    status: 200,
    description: "Material requirements calculated successfully",
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  async calculateMaterialRequirements(
    @Param("id") id: string,
    @Query("outputQuantity", ParseIntPipe) outputQuantity: number
  ) {
    return await this.formulaService.calculateMaterialRequirements(
      id,
      outputQuantity
    );
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a formula" })
  @ApiParam({
    name: "id",
    description: "Formula ID",
    example: "550e8400-e29b-41d4-a716-446655440001",
  })
  @ApiBody({ type: UpdateFormulaDto })
  @ApiResponse({
    status: 200,
    description: "Formula updated successfully",
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  async update(
    @Param("id") id: string,
    @Body() updateFormulaDto: UpdateFormulaDto
  ) {
    return await this.formulaService.update(id, updateFormulaDto);
  }

  @Patch(":id/toggle-active")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Toggle formula active status" })
  @ApiParam({
    name: "id",
    description: "Formula ID",
    example: "550e8400-e29b-41d4-a716-446655440001",
  })
  @ApiResponse({
    status: 200,
    description: "Formula active status toggled successfully",
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  async toggleActive(@Param("id") id: string) {
    return await this.formulaService.toggleActive(id);
  }

  @Post(":id/clone")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Clone a formula with a new version" })
  @ApiParam({
    name: "id",
    description: "Formula ID to clone",
    example: "550e8400-e29b-41d4-a716-446655440001",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        newVersion: {
          type: "string",
          description: "New version for the cloned formula",
          example: "v2.0",
        },
      },
      required: ["newVersion"],
    },
  })
  @ApiResponse({
    status: 201,
    description: "Formula cloned successfully",
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  async cloneFormula(
    @Param("id") id: string,
    @Body("newVersion") newVersion: string
  ) {
    // TODO: Replace with actual user ID from JWT token
    const userId = "user-456";
    return await this.formulaService.cloneFormula(id, newVersion, userId);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a formula" })
  @ApiParam({
    name: "id",
    description: "Formula ID",
    example: "550e8400-e29b-41d4-a716-446655440001",
  })
  @ApiResponse({
    status: 204,
    description: "Formula deleted successfully",
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  async remove(@Param("id") id: string) {
    return await this.formulaService.remove(id);
  }
}
