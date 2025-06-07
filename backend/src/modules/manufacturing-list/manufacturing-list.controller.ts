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
} from "@nestjs/common";
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import {
  CreateManufacturingListDto,
  MLStatus,
} from "./dto/create-manufacturing-list.dto";
import { UpdateManufacturingListDto } from "./dto/update-manufacturing-list.dto";
import { ManufacturingListService } from "./manufacturing-list.service";

@ApiTags("manufacturing-list")
@Controller("manufacturing-list")
export class ManufacturingListController {
  constructor(
    private readonly manufacturingListService: ManufacturingListService
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create a new manufacturing list",
    description: "Creates a new manufacturing list for production planning",
  })
  @ApiBody({
    type: CreateManufacturingListDto,
    description: "Manufacturing list creation data",
  })
  @ApiResponse({
    status: 201,
    description: "Manufacturing list created successfully",
    example: {
      id: "550e8400-e29b-41d4-a716-446655440000",
      mlNumber: "ML000001",
      title: "Weekly production batch for Product A",
      formulaId: "550e8400-e29b-41d4-a716-446655440001",
      outputQuantity: 100,
      branchId: "550e8400-e29b-41d4-a716-446655440002",
      status: "DRAFT",
      createdAt: "2025-06-06T10:00:00.000Z",
    },
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  async create(@Body() createManufacturingListDto: CreateManufacturingListDto) {
    // TODO: Get actual user ID from authentication
    const userId = "user-1"; // Placeholder
    return await this.manufacturingListService.create(
      createManufacturingListDto,
      userId
    );
  }

  @Get()
  @ApiOperation({
    summary: "Get all manufacturing lists",
    description:
      "Retrieves all manufacturing lists with optional filtering by branch and status",
  })
  @ApiQuery({
    name: "branchId",
    required: false,
    description: "Filter by branch ID",
    example: "550e8400-e29b-41d4-a716-446655440002",
  })
  @ApiQuery({
    name: "status",
    required: false,
    description: "Filter by manufacturing list status",
    enum: MLStatus,
  })
  @ApiResponse({
    status: 200,
    description: "Manufacturing lists retrieved successfully",
    example: [
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        mlNumber: "ML000001",
        title: "Weekly production batch for Product A",
        status: "DRAFT",
        outputQuantity: 100,
        createdAt: "2025-06-06T10:00:00.000Z",
      },
    ],
  })
  async findAll(
    @Query("branchId") branchId?: string,
    @Query("status") status?: MLStatus
  ) {
    return await this.manufacturingListService.findAll(branchId, status);
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get manufacturing list by ID",
    description:
      "Retrieves a specific manufacturing list with all related data including formula and material requirements",
  })
  @ApiParam({
    name: "id",
    description: "Manufacturing list unique identifier",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @ApiResponse({
    status: 200,
    description: "Manufacturing list found",
    example: {
      id: "550e8400-e29b-41d4-a716-446655440000",
      mlNumber: "ML000001",
      title: "Weekly production batch for Product A",
      status: "DRAFT",
      outputQuantity: 100,
      formula: {
        id: "550e8400-e29b-41d4-a716-446655440001",
        name: "Product A Formula",
        outputQuantity: 1,
        isActive: true,
      },
      materialRequirements: [
        {
          itemId: "550e8400-e29b-41d4-a716-446655440002",
          requiredQuantity: 50,
          item: { name: "Raw Material A", code: "RM001" },
        },
      ],
    },
  })
  @ApiResponse({ status: 404, description: "Manufacturing list not found" })
  async findOne(@Param("id") id: string) {
    return await this.manufacturingListService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Update manufacturing list",
    description: "Updates a manufacturing list (only allowed in DRAFT status)",
  })
  @ApiParam({
    name: "id",
    description: "Manufacturing list unique identifier",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @ApiBody({
    type: UpdateManufacturingListDto,
    description: "Updated manufacturing list data",
  })
  @ApiResponse({
    status: 200,
    description: "Manufacturing list updated successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Cannot update non-draft manufacturing list",
  })
  @ApiResponse({ status: 404, description: "Manufacturing list not found" })
  async update(
    @Param("id") id: string,
    @Body() updateManufacturingListDto: UpdateManufacturingListDto
  ) {
    return await this.manufacturingListService.update(
      id,
      updateManufacturingListDto
    );
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete manufacturing list",
    description: "Deletes a manufacturing list (only allowed in DRAFT status)",
  })
  @ApiParam({
    name: "id",
    description: "Manufacturing list unique identifier",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @ApiResponse({
    status: 204,
    description: "Manufacturing list deleted successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Cannot delete non-draft manufacturing list",
  })
  @ApiResponse({ status: 404, description: "Manufacturing list not found" })
  async remove(@Param("id") id: string) {
    return await this.manufacturingListService.remove(id);
  }

  // Workflow endpoints
  @Post(":id/start")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Start production",
    description:
      "Starts production for a manufacturing list (changes status to IN_PROGRESS)",
  })
  @ApiParam({
    name: "id",
    description: "Manufacturing list unique identifier",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @ApiResponse({
    status: 200,
    description: "Production started successfully",
    example: {
      id: "550e8400-e29b-41d4-a716-446655440000",
      status: "IN_PROGRESS",
    },
  })
  @ApiResponse({
    status: 400,
    description: "Can only start DRAFT manufacturing lists",
  })
  @ApiResponse({ status: 404, description: "Manufacturing list not found" })
  async startProduction(@Param("id") id: string) {
    return await this.manufacturingListService.startProduction(id);
  }

  @Post(":id/complete")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Complete production",
    description:
      "Completes production for a manufacturing list. Deducts raw materials and adds finished goods to stock.",
  })
  @ApiParam({
    name: "id",
    description: "Manufacturing list unique identifier",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @ApiResponse({
    status: 200,
    description: "Production completed successfully",
    example: {
      id: "550e8400-e29b-41d4-a716-446655440000",
      status: "COMPLETED",
    },
  })
  @ApiResponse({
    status: 400,
    description: "Can only complete IN_PROGRESS manufacturing lists",
  })
  @ApiResponse({ status: 404, description: "Manufacturing list not found" })
  async completeProduction(@Param("id") id: string) {
    return await this.manufacturingListService.completeProduction(id);
  }

  @Post(":id/cancel")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Cancel manufacturing list",
    description: "Cancels a manufacturing list (cannot cancel COMPLETED lists)",
  })
  @ApiParam({
    name: "id",
    description: "Manufacturing list unique identifier",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @ApiResponse({
    status: 200,
    description: "Manufacturing list cancelled successfully",
    example: {
      id: "550e8400-e29b-41d4-a716-446655440000",
      status: "CANCELLED",
    },
  })
  @ApiResponse({
    status: 400,
    description: "Cannot cancel completed manufacturing lists",
  })
  @ApiResponse({ status: 404, description: "Manufacturing list not found" })
  async cancel(@Param("id") id: string) {
    return await this.manufacturingListService.cancel(id);
  }

  // Reporting endpoints
  @Get("branch/:branchId/summary")
  @ApiOperation({
    summary: "Get production summary for branch",
    description:
      "Retrieves production summary statistics for a specific branch within a date range",
  })
  @ApiParam({
    name: "branchId",
    description: "Branch unique identifier",
    example: "550e8400-e29b-41d4-a716-446655440002",
  })
  @ApiQuery({
    name: "startDate",
    required: false,
    description: "Start date for the summary period (ISO 8601 format)",
    example: "2025-06-01",
  })
  @ApiQuery({
    name: "endDate",
    required: false,
    description: "End date for the summary period (ISO 8601 format)",
    example: "2025-06-30",
  })
  @ApiResponse({
    status: 200,
    description: "Production summary retrieved successfully",
    example: {
      branchId: "550e8400-e29b-41d4-a716-446655440002",
      totalManufacturingLists: 15,
      completedProductions: 12,
      inProgressProductions: 2,
      totalOutputQuantity: 1500,
      period: { startDate: "2025-06-01", endDate: "2025-06-30" },
    },
  })
  async getProductionSummary(
    @Param("branchId") branchId: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return await this.manufacturingListService.getProductionSummary(
      branchId,
      start,
      end
    );
  }

  @Get("branch/:branchId")
  @ApiOperation({
    summary: "Get manufacturing lists by branch",
    description: "Retrieves all manufacturing lists for a specific branch",
  })
  @ApiParam({
    name: "branchId",
    description: "Branch unique identifier",
    example: "550e8400-e29b-41d4-a716-446655440002",
  })
  @ApiResponse({
    status: 200,
    description: "Manufacturing lists for branch retrieved successfully",
    example: [
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        mlNumber: "ML000001",
        title: "Weekly production batch for Product A",
        status: "DRAFT",
        outputQuantity: 100,
      },
    ],
  })
  async findByBranch(@Param("branchId") branchId: string) {
    return await this.manufacturingListService.findAll(branchId);
  }
}
