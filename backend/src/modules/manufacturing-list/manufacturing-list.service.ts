import { PrismaService } from '@app/prisma.service';
import { PrismaTransaction } from '@common/interfaces/prisma.interface';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { type CreateManufacturingListDto, MLStatus } from './dto/create-manufacturing-list.dto';
import { UpdateManufacturingListDto } from './dto/update-manufacturing-list.dto';

@Injectable()
export class ManufacturingListService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async create(createManufacturingListDto: CreateManufacturingListDto, userId: string) {
    // Get user's company information
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Generate ML number
    const count = await this.prisma.manufacturingList.count();
    const mlNumber = `ML${String(count + 1).padStart(6, '0')}`;

    // Validate formula exists and is active
    const formula = await this.prisma.formula.findUnique({
      where: { id: createManufacturingListDto.formulaId },
      include: {
        items: {
          include: {
            item: true,
          },
        },
      },
    });

    if (!formula) {
      throw new NotFoundException(
        `Formula with ID ${createManufacturingListDto.formulaId} not found`
      );
    }

    if (!formula.isActive) {
      throw new Error('Cannot create ML from inactive formula');
    }

    // Calculate material requirements and validate stock availability
    const scaleFactor = new Decimal(createManufacturingListDto.outputQuantity).div(
      formula.outputQuantity
    );

    // Get all required item IDs
    const requiredItemIds = formula.items.map((item) => item.itemId);

    // Check stock availability for all required items
    if (requiredItemIds.length > 0) {
      const stockRecords = await this.prisma.stock.findMany({
        where: {
          branchId: createManufacturingListDto.branchId,
          itemId: {
            in: requiredItemIds,
          },
        },
      });

      // Validate stock availability
      for (const formulaItem of formula.items) {
        const requiredQty = formulaItem.quantity.mul(scaleFactor);
        const requiredQtyInMainUnit = requiredQty.mul(formulaItem.item.usingToMainRate);

        const stockRecord = stockRecords.find((s) => s.itemId === formulaItem.itemId);

        if (!stockRecord || stockRecord.availableQty.lt(requiredQtyInMainUnit)) {
          throw new Error(
            `Insufficient stock for item ${
              formulaItem.item.name
            }. Required: ${requiredQtyInMainUnit}, Available: ${stockRecord?.availableQty || 0}`
          );
        }
      }
    }

    return this.prisma.manufacturingList.create({
      data: {
        mlNumber,
        title: createManufacturingListDto.title,
        formulaId: createManufacturingListDto.formulaId,
        outputQuantity: new Decimal(createManufacturingListDto.outputQuantity),
        companyId: user.companyId, // Add company isolation
        branchId: createManufacturingListDto.branchId,
        plannedDate: createManufacturingListDto.plannedDate
          ? new Date(createManufacturingListDto.plannedDate)
          : new Date(),
        createdById: userId,
        remarks: createManufacturingListDto.remarks,
        status: MLStatus.DRAFT,
      },
      include: {
        formula: {
          include: {
            items: {
              include: {
                item: true,
              },
            },
          },
        },
        branch: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(branchId?: string, status?: MLStatus) {
    const where: Prisma.ManufacturingListWhereInput = {};
    if (branchId) where.branchId = branchId;
    if (status) where.status = status;

    return this.prisma.manufacturingList.findMany({
      where,
      include: {
        formula: {
          include: {
            items: {
              include: {
                item: true,
              },
            },
          },
        },
        branch: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const manufacturingList = await this.prisma.manufacturingList.findUnique({
      where: { id },
      include: {
        formula: {
          include: {
            items: {
              include: {
                item: true,
              },
            },
          },
        },
        branch: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!manufacturingList) {
      throw new NotFoundException(`Manufacturing List with ID ${id} not found`);
    }

    return manufacturingList;
  }

  async update(id: string, updateManufacturingListDto: UpdateManufacturingListDto) {
    const existingML = await this.findOne(id);

    // Only allow updates if status is DRAFT
    if (existingML.status !== MLStatus.DRAFT) {
      throw new Error('Can only update Manufacturing Lists in DRAFT status');
    }

    return this.prisma.manufacturingList.update({
      where: { id },
      data: {
        title: updateManufacturingListDto.title,
        outputQuantity: updateManufacturingListDto.outputQuantity
          ? new Decimal(updateManufacturingListDto.outputQuantity)
          : undefined,
        branchId: updateManufacturingListDto.branchId,
        plannedDate: updateManufacturingListDto.plannedDate
          ? new Date(updateManufacturingListDto.plannedDate)
          : undefined,
        remarks: updateManufacturingListDto.remarks,
      },
      include: {
        formula: {
          include: {
            items: {
              include: {
                item: true,
              },
            },
          },
        },
        branch: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const existingML = await this.findOne(id);

    // Only allow deletion if status is DRAFT
    if (existingML.status !== MLStatus.DRAFT) {
      throw new Error('Can only delete Manufacturing Lists in DRAFT status');
    }

    return this.prisma.manufacturingList.delete({
      where: { id },
    });
  }

  // Start production - deduct raw materials and move to IN_PROGRESS
  async startProduction(id: string) {
    const existingML = await this.findOne(id);

    if (existingML.status !== MLStatus.DRAFT) {
      throw new Error('Can only start production for DRAFT Manufacturing Lists');
    }

    return this.prisma.$transaction(async (tx) => {
      // Calculate required materials based on formula and output quantity
      const scaleFactor = existingML.outputQuantity.div(existingML.formula.outputQuantity);

      // Check and deduct stock for each formula item
      for (const formulaItem of existingML.formula.items) {
        const requiredQty = formulaItem.quantity.mul(scaleFactor);

        // Convert from using unit to main unit
        const requiredQtyInMainUnit = requiredQty.mul(formulaItem.item.usingToMainRate);

        // Get current stock
        const stock = await tx.stock.findUnique({
          where: {
            itemId_branchId: {
              itemId: formulaItem.itemId,
              branchId: existingML.branchId,
            },
          },
        });

        if (!stock || stock.availableQty.lt(requiredQtyInMainUnit)) {
          throw new Error(
            `Insufficient stock for item ${
              formulaItem.item.name
            }. Required: ${requiredQtyInMainUnit}, Available: ${stock?.availableQty || 0}`
          );
        }

        // Deduct stock
        await tx.stock.update({
          where: {
            itemId_branchId: {
              itemId: formulaItem.itemId,
              branchId: existingML.branchId,
            },
          },
          data: {
            quantity: stock.quantity.sub(requiredQtyInMainUnit),
            availableQty: stock.availableQty.sub(requiredQtyInMainUnit),
            lastStockDate: new Date(),
          },
        });
      }

      // Update ML status to IN_PROGRESS
      const updatedML = await tx.manufacturingList.update({
        where: { id },
        data: {
          status: MLStatus.IN_PROGRESS,
          startedDate: new Date(),
        },
        include: {
          formula: {
            include: {
              items: {
                include: {
                  item: true,
                },
              },
            },
          },
          branch: true,
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      return updatedML;
    });
  }

  // Complete production - add finished goods to stock and move to COMPLETED
  async completeProduction(id: string) {
    const existingML = await this.findOne(id);

    if (existingML.status !== MLStatus.IN_PROGRESS) {
      throw new Error('Can only complete IN_PROGRESS Manufacturing Lists');
    }

    return this.prisma.$transaction(async (tx) => {
      // If formula has output item, add to stock
      if (existingML.formula.outputItem) {
        // Get or create stock record for the output item
        const outputQtyInMainUnit = existingML.outputQuantity.mul(
          await this.getItemUsingToMainRate(tx, existingML.formula.outputItem)
        );

        const existingStock = await tx.stock.findUnique({
          where: {
            itemId_branchId: {
              itemId: existingML.formula.outputItem,
              branchId: existingML.branchId,
            },
          },
        });

        if (existingStock) {
          // Update existing stock
          await tx.stock.update({
            where: {
              itemId_branchId: {
                itemId: existingML.formula.outputItem,
                branchId: existingML.branchId,
              },
            },
            data: {
              quantity: existingStock.quantity.add(outputQtyInMainUnit),
              availableQty: existingStock.availableQty.add(outputQtyInMainUnit),
              lastStockDate: new Date(),
            },
          });
        } else {
          // Create new stock record
          await tx.stock.create({
            data: {
              itemId: existingML.formula.outputItem,
              branchId: existingML.branchId,
              quantity: outputQtyInMainUnit,
              availableQty: outputQtyInMainUnit,
              lastStockDate: new Date(),
            },
          });
        }
      }

      // Update ML status to COMPLETED
      const updatedML = await tx.manufacturingList.update({
        where: { id },
        data: {
          status: MLStatus.COMPLETED,
          completedDate: new Date(),
        },
        include: {
          formula: {
            include: {
              items: {
                include: {
                  item: true,
                },
              },
            },
          },
          branch: true,
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      return updatedML;
    });
  }

  // Cancel production
  async cancel(id: string) {
    const existingML = await this.findOne(id);

    if (existingML.status === MLStatus.COMPLETED) {
      throw new Error('Cannot cancel completed Manufacturing Lists');
    }

    return this.prisma.manufacturingList.update({
      where: { id },
      data: {
        status: MLStatus.CANCELLED,
      },
      include: {
        formula: {
          include: {
            items: {
              include: {
                item: true,
              },
            },
          },
        },
        branch: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  // Helper method to get item's using to main rate
  private async getItemUsingToMainRate(tx: PrismaTransaction, itemId: string): Promise<Decimal> {
    const item = await tx.item.findUnique({
      where: { id: itemId },
      select: { usingToMainRate: true },
    });
    return item?.usingToMainRate || new Decimal(1);
  }

  // Get production summary for a branch
  async getProductionSummary(branchId: string, startDate?: Date, endDate?: Date) {
    const where: Prisma.ManufacturingListWhereInput = { branchId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const summary = await this.prisma.manufacturingList.groupBy({
      by: ['status'],
      where,
      _count: {
        id: true,
      },
    });

    const totalOutput = await this.prisma.manufacturingList.aggregate({
      where: {
        ...where,
        status: MLStatus.COMPLETED,
      },
      _sum: {
        outputQuantity: true,
      },
    });

    return {
      summary,
      totalCompletedOutput: totalOutput._sum.outputQuantity || 0,
    };
  }
}
