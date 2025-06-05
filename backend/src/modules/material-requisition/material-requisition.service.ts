import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../app/prisma.service';
import {
  CreateMaterialRequisitionDto,
  MRType,
} from './dto/create-material-requisition.dto';
import { UpdateMaterialRequisitionDto } from './dto/update-material-requisition.dto';
import { Decimal } from '@prisma/client/runtime/library';

// Define status enum locally to avoid import issues
enum MRStatus {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Injectable()
export class MaterialRequisitionService {
  constructor(private prisma: PrismaService) {}

  async create(
    createMaterialRequisitionDto: CreateMaterialRequisitionDto,
    userId: string
  ) {
    // Generate MR number
    const count = await this.prisma.materialRequisition.count();
    const mrNumber = `MR${String(count + 1).padStart(6, '0')}`;

    // Validate branch fields based on type
    if (createMaterialRequisitionDto.type === MRType.TRANSFER) {
      if (
        !createMaterialRequisitionDto.fromBranchId ||
        !createMaterialRequisitionDto.toBranchId
      ) {
        throw new Error(
          'Transfer MR requires both fromBranchId and toBranchId'
        );
      }
      if (
        createMaterialRequisitionDto.fromBranchId ===
        createMaterialRequisitionDto.toBranchId
      ) {
        throw new Error(
          'Transfer MR cannot have same source and destination branch'
        );
      }
    } else if (createMaterialRequisitionDto.type === MRType.TRIM_WASTE) {
      if (!createMaterialRequisitionDto.branchId) {
        throw new Error('Trim/Waste MR requires branchId');
      }
    }

    return this.prisma.materialRequisition.create({
      data: {
        mrNumber,
        title: createMaterialRequisitionDto.title,
        rfId: createMaterialRequisitionDto.rfId,
        type: createMaterialRequisitionDto.type,
        fromBranchId: createMaterialRequisitionDto.fromBranchId,
        toBranchId: createMaterialRequisitionDto.toBranchId,
        branchId: createMaterialRequisitionDto.branchId,
        transferDate: createMaterialRequisitionDto.transferDate
          ? new Date(createMaterialRequisitionDto.transferDate)
          : null,
        createdById: userId,
        notes: createMaterialRequisitionDto.notes,
        status: MRStatus.DRAFT,
        items: {
          create: createMaterialRequisitionDto.items.map((item) => ({
            itemId: item.itemId,
            quantity: new Decimal(item.quantity),
            wasteType: item.wasteType,
            remarks: item.remarks,
          })),
        },
      },
      include: {
        items: {
          include: {
            item: true,
          },
        },
        requestForm: true,
        fromBranch: true,
        toBranch: true,
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

  async findAll(branchId?: string, type?: MRType) {
    const where: any = {};
    if (branchId) {
      // For filtering by branch, include both transfer and trim/waste MRs
      where.OR = [
        { fromBranchId: branchId },
        { toBranchId: branchId },
        { branchId: branchId },
      ];
    }
    if (type) where.type = type;

    return this.prisma.materialRequisition.findMany({
      where,
      include: {
        items: {
          include: {
            item: true,
          },
        },
        requestForm: {
          select: {
            id: true,
            rfNumber: true,
            fromBranch: { select: { name: true } },
            toBranch: { select: { name: true } },
          },
        },
        fromBranch: true,
        toBranch: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        goodsReceipts: {
          select: {
            id: true,
            grNumber: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const materialRequisition =
      await this.prisma.materialRequisition.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              item: true,
            },
          },
          requestForm: {
            include: {
              fromBranch: true,
              toBranch: true,
              items: {
                include: {
                  item: true,
                },
              },
            },
          },
          fromBranch: true,
          toBranch: true,
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          goodsReceipts: {
            include: {
              items: {
                include: {
                  item: true,
                },
              },
            },
          },
        },
      });

    if (!materialRequisition) {
      throw new NotFoundException(
        `Material Requisition with ID ${id} not found`
      );
    }

    return materialRequisition;
  }

  async update(
    id: string,
    updateMaterialRequisitionDto: UpdateMaterialRequisitionDto
  ) {
    const existingMR = await this.findOne(id);

    // Only allow updates if status is DRAFT
    if (existingMR.status !== MRStatus.DRAFT) {
      throw new Error('Can only update Material Requisitions in DRAFT status');
    }

    return this.prisma.materialRequisition.update({
      where: { id },
      data: {
        title: updateMaterialRequisitionDto.title,
        fromBranchId: updateMaterialRequisitionDto.fromBranchId,
        toBranchId: updateMaterialRequisitionDto.toBranchId,
        branchId: updateMaterialRequisitionDto.branchId,
        transferDate: updateMaterialRequisitionDto.transferDate
          ? new Date(updateMaterialRequisitionDto.transferDate)
          : undefined,
        notes: updateMaterialRequisitionDto.notes,
        ...(updateMaterialRequisitionDto.items && {
          items: {
            deleteMany: { mrId: id },
            create: updateMaterialRequisitionDto.items.map((item) => ({
              itemId: item.itemId,
              quantity: new Decimal(item.quantity),
              wasteType: item.wasteType,
              remarks: item.remarks,
            })),
          },
        }),
      },
      include: {
        items: {
          include: {
            item: true,
          },
        },
        requestForm: true,
        fromBranch: true,
        toBranch: true,
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
    const existingMR = await this.findOne(id);

    // Only allow deletion if status is DRAFT
    if (existingMR.status !== MRStatus.DRAFT) {
      throw new Error('Can only delete Material Requisitions in DRAFT status');
    }

    return this.prisma.materialRequisition.delete({
      where: { id },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async approve(id: string, userId: string) {
    const existingMR = await this.findOne(id);

    if (existingMR.status !== MRStatus.DRAFT) {
      throw new Error('Can only approve Material Requisitions in DRAFT status');
    }

    // For TRIM_WASTE type, immediately deduct stock when approved
    if (existingMR.type === MRType.TRIM_WASTE) {
      return this.prisma.$transaction(async (tx) => {
        // Update MR status
        const approvedMR = await tx.materialRequisition.update({
          where: { id },
          data: {
            status: MRStatus.APPROVED,
          },
          include: {
            items: {
              include: {
                item: true,
              },
            },
            fromBranch: true,
            toBranch: true,
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

        // Deduct stock for trim/waste items
        for (const mrItem of approvedMR.items) {
          await this.deductStockForTrimWaste(tx, {
            itemId: mrItem.itemId,
            branchId: approvedMR.branchId!,
            quantity: mrItem.quantity,
            item: mrItem.item,
          });
        }

        return approvedMR;
      });
    } else {
      // For TRANSFER type, just approve - stock will be deducted when transfer is completed
      return this.prisma.materialRequisition.update({
        where: { id },
        data: {
          status: MRStatus.APPROVED,
        },
        include: {
          items: {
            include: {
              item: true,
            },
          },
          requestForm: true,
          fromBranch: true,
          toBranch: true,
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
  }

  async complete(id: string) {
    const existingMR = await this.findOne(id);

    if (existingMR.status !== MRStatus.APPROVED) {
      throw new Error('Can only complete APPROVED Material Requisitions');
    }

    // For TRANSFER type, deduct stock from source branch when completed
    if (existingMR.type === MRType.TRANSFER) {
      return this.prisma.$transaction(async (tx) => {
        // Update MR status
        const completedMR = await tx.materialRequisition.update({
          where: { id },
          data: {
            status: MRStatus.COMPLETED,
            transferDate: new Date(),
          },
          include: {
            items: {
              include: {
                item: true,
              },
            },
            fromBranch: true,
            toBranch: true,
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

        // Deduct stock from source branch
        for (const mrItem of completedMR.items) {
          await this.deductStockForTransfer(tx, {
            itemId: mrItem.itemId,
            fromBranchId: completedMR.fromBranchId!,
            quantity: mrItem.quantity,
            item: mrItem.item,
          });
        }

        return completedMR;
      });
    } else {
      // For TRIM_WASTE type, just mark as completed (stock was already deducted on approval)
      return this.prisma.materialRequisition.update({
        where: { id },
        data: {
          status: MRStatus.COMPLETED,
        },
        include: {
          items: {
            include: {
              item: true,
            },
          },
          fromBranch: true,
          toBranch: true,
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
  }

  async cancel(id: string) {
    const existingMR = await this.findOne(id);

    if (existingMR.status === MRStatus.COMPLETED) {
      throw new Error('Cannot cancel completed Material Requisitions');
    }

    return this.prisma.materialRequisition.update({
      where: { id },
      data: {
        status: MRStatus.CANCELLED,
      },
      include: {
        items: {
          include: {
            item: true,
          },
        },
        requestForm: true,
        fromBranch: true,
        toBranch: true,
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

  // Create MR from approved RF
  async createFromRF(rfId: string, userId: string) {
    const rf = await this.prisma.requestForm.findUnique({
      where: { id: rfId },
      include: {
        items: {
          include: {
            item: true,
          },
        },
        fromBranch: true,
        toBranch: true,
      },
    });

    if (!rf) {
      throw new NotFoundException(`Request Form with ID ${rfId} not found`);
    }

    if (rf.status !== 'APPROVED' && rf.status !== 'READY_FOR_MR') {
      throw new Error(
        'Can only create MR from APPROVED or READY_FOR_MR Request Forms'
      );
    }

    // Convert RF items to MR items (using transfer unit quantities)
    const mrItems = rf.items.map((rfItem) => ({
      itemId: rfItem.itemId,
      quantity: Number(rfItem.requestedQty),
      remarks: rfItem.remarks || undefined,
    }));

    const createDto: CreateMaterialRequisitionDto = {
      title: `MR for ${rf.rfNumber}`,
      rfId: rf.id,
      type: MRType.TRANSFER,
      fromBranchId: rf.fromBranchId,
      toBranchId: rf.toBranchId,
      items: mrItems,
    };

    return this.create(createDto, userId);
  }

  // Helper method to deduct stock for transfer
  private async deductStockForTransfer(
    tx: any,
    data: {
      itemId: string;
      fromBranchId: string;
      quantity: Decimal;
      item: any;
    }
  ) {
    const { itemId, fromBranchId, quantity, item } = data;

    // Convert quantity from transfer unit to main unit
    const quantityInMainUnit = quantity.mul(item.transferToMainRate);

    // Get current stock
    const stock = await tx.stock.findUnique({
      where: {
        itemId_branchId: {
          itemId,
          branchId: fromBranchId,
        },
      },
    });

    if (!stock || stock.availableQty.lt(quantityInMainUnit)) {
      throw new Error(
        `Insufficient stock for item ${
          item.name
        } in source branch. Required: ${quantityInMainUnit}, Available: ${
          stock?.availableQty || 0
        }`
      );
    }

    // Update stock - deduct from source
    await tx.stock.update({
      where: {
        itemId_branchId: {
          itemId,
          branchId: fromBranchId,
        },
      },
      data: {
        quantity: stock.quantity.sub(quantityInMainUnit),
        availableQty: stock.availableQty.sub(quantityInMainUnit),
        lastStockDate: new Date(),
      },
    });
  }

  // Helper method to deduct stock for trim/waste
  private async deductStockForTrimWaste(
    tx: any,
    data: {
      itemId: string;
      branchId: string;
      quantity: Decimal;
      item: any;
    }
  ) {
    const { itemId, branchId, quantity, item } = data;

    // For trim/waste, quantity is already in main unit
    const quantityInMainUnit = quantity;

    // Get current stock
    const stock = await tx.stock.findUnique({
      where: {
        itemId_branchId: {
          itemId,
          branchId,
        },
      },
    });

    if (!stock || stock.availableQty.lt(quantityInMainUnit)) {
      throw new Error(
        `Insufficient stock for item ${
          item.name
        }. Required: ${quantityInMainUnit}, Available: ${
          stock?.availableQty || 0
        }`
      );
    }

    // Update stock - deduct for trim/waste
    await tx.stock.update({
      where: {
        itemId_branchId: {
          itemId,
          branchId,
        },
      },
      data: {
        quantity: stock.quantity.sub(quantityInMainUnit),
        availableQty: stock.availableQty.sub(quantityInMainUnit),
        lastStockDate: new Date(),
      },
    });
  }
}
