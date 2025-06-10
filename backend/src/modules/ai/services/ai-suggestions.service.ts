import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AISuggestion, AISuggestionType, Prisma, SuggestionStatus } from '@prisma/client';
import { PrismaService } from '../../../app/prisma.service';
import {
  AISuggestionFiltersDto,
  CreateAISuggestionDto,
  UpdateAISuggestionDto,
} from '../dto/ai-suggestions.dto';
import { GeminiService } from './gemini.service';

// Interface for suggestion data based on different types
interface StockReorderSuggestionData {
  itemId: string;
  itemName: string;
  currentStock: number;
  minimumStock: number;
  recommendedQuantity: number;
}

interface SuggestionImplementationData {
  type: AISuggestionType;
  suggestionData: StockReorderSuggestionData | Record<string, unknown>;
  userId: string;
  title: string;
}

@Injectable()
export class AISuggestionsService {
  constructor(
    private prisma: PrismaService,
    private geminiService: GeminiService
  ) {}

  /**
   * Create a new AI suggestion
   */
  async createSuggestion(data: CreateAISuggestionDto) {
    try {
      const suggestion = await this.prisma.aISuggestion.create({
        data: {
          type: data.type,
          title: data.title,
          description: data.description,
          userId: data.userId,
          suggestionData: data.suggestionData as Prisma.InputJsonValue,
          reasoning: data.reasoning,
          confidence: data.confidence,
          entityType: data.entityType,
          entityId: data.entityId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return suggestion;
    } catch (error) {
      throw new BadRequestException(`Failed to create AI suggestion: ${error.message}`);
    }
  }

  /**
   * Get all suggestions with optional filters
   */
  async getAllSuggestions(filters: AISuggestionFiltersDto = {}) {
    const where = this.buildWhereClause(filters);

    const suggestions = await this.prisma.aISuggestion.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: filters.skip || 0,
      take: filters.take || 50,
    });

    // Get total count for pagination
    const total = await this.prisma.aISuggestion.count({ where });

    return {
      suggestions,
      pagination: {
        total,
        page: Math.floor((filters.skip || 0) / (filters.take || 50)) + 1,
        pageSize: filters.take || 50,
        totalPages: Math.ceil(total / (filters.take || 50)),
      },
    };
  }

  /**
   * Helper method to build where clause for filtering
   */
  private buildWhereClause(filters: AISuggestionFiltersDto) {
    const where: Record<string, unknown> = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;

    // Date range filters
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate)
        (where.createdAt as Record<string, unknown>).gte = new Date(filters.startDate);
      if (filters.endDate)
        (where.createdAt as Record<string, unknown>).lte = new Date(filters.endDate);
    }

    return where;
  }

  /**
   * Get suggestion by ID
   */
  async getSuggestionById(id: string) {
    const suggestion = await this.prisma.aISuggestion.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!suggestion) {
      throw new NotFoundException(`AI suggestion with ID ${id} not found`);
    }

    return suggestion;
  }

  /**
   * Update suggestion status and action taken
   */
  async updateSuggestion(id: string, data: UpdateAISuggestionDto) {
    try {
      const suggestion = await this.prisma.aISuggestion.update({
        where: { id },
        data: {
          status: data.status,
          actionTaken: data.actionTaken,
          reviewedDate: data.status !== SuggestionStatus.PENDING ? new Date() : null,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return suggestion;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`AI suggestion with ID ${id} not found`);
      }
      throw new BadRequestException(`Failed to update AI suggestion: ${error.message}`);
    }
  }

  /**
   * Delete suggestion
   */
  async deleteSuggestion(id: string) {
    try {
      await this.prisma.aISuggestion.delete({
        where: { id },
      });

      return { message: 'AI suggestion deleted successfully' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`AI suggestion with ID ${id} not found`);
      }
      throw new BadRequestException(`Failed to delete AI suggestion: ${error.message}`);
    }
  }

  /**
   * Accept a suggestion and implement the recommended action
   */
  async acceptSuggestion(id: string, _userId: string) {
    const suggestion = await this.getSuggestionById(id);

    if (suggestion.status !== SuggestionStatus.PENDING) {
      throw new BadRequestException('Only pending suggestions can be accepted');
    }

    try {
      // Update suggestion status
      await this.updateSuggestion(id, {
        status: SuggestionStatus.ACCEPTED,
        actionTaken: 'Accepted by user',
      });

      // Implement the suggestion based on type
      const implementationResult = await this.implementSuggestion({
        type: suggestion.type,
        suggestionData: suggestion.suggestionData as
          | StockReorderSuggestionData
          | Record<string, unknown>,
        userId: suggestion.userId,
        title: suggestion.title,
      });

      // Update with implementation details
      await this.updateSuggestion(id, {
        status: SuggestionStatus.IMPLEMENTED,
        actionTaken: `Implemented: ${implementationResult.action}`,
      });

      return {
        message: 'Suggestion accepted and implemented successfully',
        implementation: implementationResult,
      };
    } catch (error) {
      // If implementation fails, mark as accepted but not implemented
      await this.updateSuggestion(id, {
        status: SuggestionStatus.ACCEPTED,
        actionTaken: `Accepted but implementation failed: ${error.message}`,
      });

      throw new BadRequestException(`Failed to implement suggestion: ${error.message}`);
    }
  }

  /**
   * Reject a suggestion
   */
  async rejectSuggestion(id: string, reason?: string) {
    const suggestion = await this.getSuggestionById(id);

    if (suggestion.status !== SuggestionStatus.PENDING) {
      throw new BadRequestException('Only pending suggestions can be rejected');
    }

    return this.updateSuggestion(id, {
      status: SuggestionStatus.REJECTED,
      actionTaken: reason || 'Rejected by user',
    });
  }

  /**
   * Get suggestions statistics for dashboard
   */
  async getSuggestionsStats(userId?: string) {
    const where = userId ? { userId } : {};

    const [total, pending, accepted, rejected, implemented] = await Promise.all([
      this.prisma.aISuggestion.count({ where }),
      this.prisma.aISuggestion.count({
        where: { ...where, status: SuggestionStatus.PENDING },
      }),
      this.prisma.aISuggestion.count({
        where: { ...where, status: SuggestionStatus.ACCEPTED },
      }),
      this.prisma.aISuggestion.count({
        where: { ...where, status: SuggestionStatus.REJECTED },
      }),
      this.prisma.aISuggestion.count({
        where: { ...where, status: SuggestionStatus.IMPLEMENTED },
      }),
    ]);

    // Get suggestion type distribution
    const typeDistribution = await this.prisma.aISuggestion.groupBy({
      by: ['type'],
      where,
      _count: { type: true },
    });

    // Get recent suggestions
    const recentSuggestions = await this.prisma.aISuggestion.findMany({
      where,
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        title: true,
        status: true,
        createdAt: true,
        confidence: true,
      },
    });

    return {
      summary: {
        total,
        pending,
        accepted,
        rejected,
        implemented,
        acceptanceRate: total > 0 ? (((accepted + implemented) / total) * 100).toFixed(1) : '0',
      },
      typeDistribution: typeDistribution.map((item) => ({
        type: item.type,
        count: item._count.type,
      })),
      recentSuggestions,
    };
  }

  /**
   * Generate AI suggestions based on current system state
   */
  async generateSuggestions(branchId: string, userId: string) {
    try {
      // Analyze current stock levels for reorder suggestions
      const stockSuggestions = await this.generateStockReorderSuggestions(branchId, userId);

      // Analyze for transfer request suggestions
      const transferSuggestions = await this.generateTransferSuggestions(branchId, userId);

      // Analyze for cost variance alerts
      const costVarianceSuggestions = await this.generateCostVarianceSuggestions(branchId, userId);

      const allSuggestions = [
        ...stockSuggestions,
        ...transferSuggestions,
        ...costVarianceSuggestions,
      ];

      return {
        generated: allSuggestions.length,
        suggestions: allSuggestions,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to generate suggestions: ${error.message}`);
    }
  }
  /**
   * Private method to implement suggestion based on type
   */
  private async implementSuggestion(suggestion: SuggestionImplementationData) {
    switch (suggestion.type) {
      case AISuggestionType.STOCK_REORDER:
        return this.implementStockReorderSuggestion(suggestion);
      case AISuggestionType.TRANSFER_REQUEST:
        return this.implementTransferRequestSuggestion(suggestion);
      case AISuggestionType.COST_VARIANCE:
        return this.implementCostVarianceSuggestion(suggestion);
      default:
        throw new Error(`Unknown suggestion type: ${suggestion.type}`);
    }
  }

  /**
   * Private methods for generating specific types of suggestions
   */ private async generateStockReorderSuggestions(branchId: string, userId: string) {
    // Get items with low stock levels using a simplified approach
    const lowStockItems = await this.prisma.stock.findMany({
      where: {
        branchId,
        quantity: {
          lte: 10, // Simple threshold for demo - would be dynamic in production
        },
      },
      include: {
        item: true,
        branch: true,
      },
    });

    const suggestions = [];

    for (const stock of lowStockItems) {
      const reorderLevel = Number(stock.item.reorderLevel);
      const currentStock = Number(stock.quantity);

      const suggestionData = {
        itemId: stock.itemId,
        itemName: stock.item.name,
        currentStock,
        reorderLevel,
        recommendedQuantity: Math.max(reorderLevel * 2 - currentStock, reorderLevel),
      };

      const suggestion = await this.createSuggestion({
        type: AISuggestionType.STOCK_REORDER,
        title: `Reorder Required: ${stock.item.name}`,
        description: `Stock level (${currentStock}) is below safe threshold`,
        userId,
        suggestionData,
        reasoning:
          'Current stock level is below the reorder threshold, indicating potential stockout risk',
        confidence: 0.9,
        entityType: 'Item',
        entityId: stock.itemId,
      });

      suggestions.push(suggestion);
    }

    return suggestions;
  }

  private async generateTransferSuggestions(
    _branchId: string,
    _userId: string
  ): Promise<AISuggestion[]> {
    // This would analyze stock distribution across branches
    // and suggest transfers from overstocked to understocked branches
    return []; // Placeholder for now
  }

  private async generateCostVarianceSuggestions(
    _branchId: string,
    _userId: string
  ): Promise<AISuggestion[]> {
    // This would analyze recent purchase prices vs historical averages
    // and suggest cost variance alerts
    return []; // Placeholder for now
  }

  /**
   * Private methods for implementing specific types of suggestions
   */
  private async implementStockReorderSuggestion(suggestion: SuggestionImplementationData) {
    const data = suggestion.suggestionData as StockReorderSuggestionData;

    // For demo purposes, we'll just log the action instead of creating actual PR
    // In a real implementation, this would create a purchase request
    const actionDetails = {
      action: `Would create Purchase Request for ${data.itemName}`,
      details: {
        itemId: data.itemId,
        quantity: data.recommendedQuantity,
        reason: suggestion.title,
      },
    };

    console.log('AI Suggestion Implementation:', actionDetails);

    return {
      action: `Logged reorder recommendation for ${data.itemName} (${data.recommendedQuantity} units)`,
      details: actionDetails,
    };
  }

  private async implementTransferRequestSuggestion(_suggestion: SuggestionImplementationData) {
    // Implement transfer request creation
    return { action: 'Transfer request implementation pending' };
  }

  private async implementCostVarianceSuggestion(_suggestion: SuggestionImplementationData) {
    // Implement cost variance notification
    return { action: 'Cost variance alert logged' };
  }

  /**
   * Bulk update multiple suggestions
   */
  async bulkUpdateSuggestions(
    suggestionIds: string[],
    status: SuggestionStatus,
    actionTaken?: string
  ) {
    try {
      const updatedSuggestions = await this.prisma.aISuggestion.updateMany({
        where: {
          id: { in: suggestionIds },
        },
        data: {
          status,
          actionTaken,
          reviewedDate: status !== SuggestionStatus.PENDING ? new Date() : null,
        },
      });

      return {
        message: `${updatedSuggestions.count} suggestions updated successfully`,
        updatedCount: updatedSuggestions.count,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to bulk update suggestions: ${error.message}`);
    }
  }
}
