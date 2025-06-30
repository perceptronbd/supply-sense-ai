import { PrismaService } from '@app/prisma.service';
import { PrismaTransaction } from '@common/interfaces/prisma.interface';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { type AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { CreateGoodsReceiptDto } from './dto/create-goods-receipt.dto';
import { UpdateGoodsReceiptDto } from './dto/update-goods-receipt.dto';

// Define status enum locally to avoid import issues
enum GRStatus {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED',
  CANCELLED = 'CANCELLED',
}

@Injectable()
export class GoodsReceiptService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async create(createGoodsReceiptDto: CreateGoodsReceiptDto, user: AuthenticatedUser) {
    // Generate GR number
    const count = await this.prisma.goodsReceipt.count();
    const grNumber = `GR${String(count + 1).padStart(9, '0')}`;

    // Validate that not both PO and MR are provided (standalone GR is allowed)
    if (createGoodsReceiptDto.poId && createGoodsReceiptDto.mrId) {
      throw new BadRequestException(
        'Cannot specify both Purchase Order ID and Material Requisition ID'
      );
    }

    return this.prisma.goodsReceipt.create({
      data: {
        grNumber,
        poId: createGoodsReceiptDto.poId,
        mrId: createGoodsReceiptDto.mrId,
        receiptDate: createGoodsReceiptDto.receiptDate
          ? new Date(createGoodsReceiptDto.receiptDate)
          : new Date(),
        documentNumber: createGoodsReceiptDto.documentNumber,
        companyId: user.companyId, // Add company isolation
        branchId: createGoodsReceiptDto.branchId,
        receivedById: user.id,
        remarks: createGoodsReceiptDto.remarks,
        status: GRStatus.DRAFT,
        items: {
          create: createGoodsReceiptDto.items.map((item) => {
            const totalCost = item.unitPrice
              ? new Decimal(item.receivedQty).mul(item.unitPrice)
              : null;
            return {
              itemId: item.itemId,
              orderedQty: new Decimal(item.orderedQty),
              receivedQty: new Decimal(item.receivedQty),
              unitPrice: item.unitPrice ? new Decimal(item.unitPrice) : null,
              totalCost,
              qualityNotes: item.qualityNotes,
            };
          }),
        },
      },
      include: {
        items: {
          include: {
            item: true,
          },
        },
        purchaseOrder: {
          include: {
            supplier: true,
          },
        },
        materialRequisition: true,
        branch: true,
        receivedBy: {
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

  async findAll(user: AuthenticatedUser, branchId?: string) {
    // Build where clause with company isolation
    const where: {
      companyId: string;
      branchId?: string | { in: string[] };
    } = {
      companyId: user.companyId, // Add company isolation
    };

    // Add branch filtering if specified and validate user access
    if (branchId) {
      if (!user.branchIds.includes(branchId)) {
        throw new BadRequestException('You do not have access to this branch');
      }
      where.branchId = branchId;
    } else {
      // Limit to branches user has access to
      where.branchId = { in: user.branchIds };
    }

    return this.prisma.goodsReceipt.findMany({
      where,
      include: {
        items: {
          include: {
            item: true,
          },
        },
        purchaseOrder: {
          include: {
            supplier: true,
          },
        },
        materialRequisition: true,
        branch: true,
        receivedBy: {
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

  async findOne(id: string, user: AuthenticatedUser) {
    const goodsReceipt = await this.prisma.goodsReceipt.findFirst({
      where: {
        id,
        companyId: user.companyId, // Add company isolation
        branchId: { in: user.branchIds }, // Add branch access control
      },
      include: {
        items: {
          include: {
            item: true,
          },
        },
        purchaseOrder: {
          include: {
            supplier: true,
            items: {
              include: {
                item: true,
              },
            },
          },
        },
        materialRequisition: {
          include: {
            items: {
              include: {
                item: true,
              },
            },
          },
        },
        branch: true,
        receivedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!goodsReceipt) {
      throw new NotFoundException(`Goods Receipt with ID ${id} not found`);
    }

    return goodsReceipt;
  }

  async update(id: string, updateGoodsReceiptDto: UpdateGoodsReceiptDto, user: AuthenticatedUser) {
    const existingGR = await this.findOne(id, user);

    // Only allow updates if status is DRAFT
    if (existingGR.status !== GRStatus.DRAFT) {
      throw new BadRequestException('Can only update Goods Receipts in DRAFT status');
    }

    return this.prisma.goodsReceipt.update({
      where: { id },
      data: {
        poId: updateGoodsReceiptDto.poId,
        mrId: updateGoodsReceiptDto.mrId,
        receiptDate: updateGoodsReceiptDto.receiptDate
          ? new Date(updateGoodsReceiptDto.receiptDate)
          : undefined,
        documentNumber: updateGoodsReceiptDto.documentNumber,
        branchId: updateGoodsReceiptDto.branchId,
        remarks: updateGoodsReceiptDto.remarks,
        ...(updateGoodsReceiptDto.items && {
          items: {
            deleteMany: { grId: id },
            create: updateGoodsReceiptDto.items.map((item) => {
              const totalCost = item.unitPrice
                ? new Decimal(item.receivedQty).mul(item.unitPrice)
                : null;
              return {
                itemId: item.itemId,
                orderedQty: new Decimal(item.orderedQty),
                receivedQty: new Decimal(item.receivedQty),
                unitPrice: item.unitPrice ? new Decimal(item.unitPrice) : null,
                totalCost,
                qualityNotes: item.qualityNotes,
              };
            }),
          },
        }),
      },
      include: {
        items: {
          include: {
            item: true,
          },
        },
        purchaseOrder: {
          include: {
            supplier: true,
          },
        },
        materialRequisition: true,
        branch: true,
        receivedBy: {
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

  async remove(id: string, user: AuthenticatedUser) {
    const existingGR = await this.findOne(id, user);

    // Only allow removal if status is DRAFT
    if (existingGR.status !== GRStatus.DRAFT) {
      throw new BadRequestException('Can only delete Goods Receipts in DRAFT status');
    }

    return this.prisma.goodsReceipt.delete({
      where: { id },
    });
  }

  async post(id: string, user: AuthenticatedUser) {
    const existingGR = await this.findOne(id, user);

    // Only allow posting if status is DRAFT
    if (existingGR.status !== GRStatus.DRAFT) {
      throw new BadRequestException('Can only post Goods Receipts in DRAFT status');
    }

    // Start a transaction to post GR and update stock with moving average cost
    return this.prisma.$transaction(async (tx) => {
      // Update GR status to POSTED
      const postedGR = await tx.goodsReceipt.update({
        where: { id },
        data: {
          status: GRStatus.POSTED,
          postedAt: new Date(),
        },
        include: {
          items: {
            include: {
              item: true,
            },
          },
          branch: true,
        },
      });

      // Update stock levels and calculate moving average cost for each item
      for (const grItem of postedGR.items) {
        await this.updateStockWithMovingAverage(tx, {
          itemId: grItem.itemId,
          branchId: postedGR.branchId,
          receivedQty: grItem.receivedQty,
          unitCost: grItem.unitPrice || new Decimal(0), // Use unit price as cost
          item: grItem.item,
        });

        // Update PO item received quantity if this is a PO receipt
        if (postedGR.poId && grItem.unitPrice) {
          const poItem = await tx.pOItem.findFirst({
            where: {
              poId: postedGR.poId,
              itemId: grItem.itemId,
            },
          });

          if (poItem) {
            await tx.pOItem.update({
              where: { id: poItem.id },
              data: {
                receivedQty: poItem.receivedQty.add(grItem.receivedQty),
              },
            });
          }
        }
      }

      return postedGR;
    });
  }

  async cancel(id: string, user: AuthenticatedUser) {
    const existingGR = await this.findOne(id, user);

    // Only allow cancellation if status is POSTED
    if (existingGR.status !== GRStatus.POSTED) {
      throw new BadRequestException('Can only cancel Goods Receipts in POSTED status');
    }

    return this.prisma.goodsReceipt.update({
      where: { id },
      data: {
        status: GRStatus.CANCELLED,
        cancelledAt: new Date(),
      },
      include: {
        items: {
          include: {
            item: true,
          },
        },
        purchaseOrder: {
          include: {
            supplier: true,
          },
        },
        materialRequisition: true,
        branch: true,
        receivedBy: {
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

  // Helper method to update stock with moving average cost calculation
  private async updateStockWithMovingAverage(
    tx: PrismaTransaction,
    data: {
      itemId: string;
      branchId: string;
      receivedQty: Decimal;
      unitCost: Decimal;
      item: {
        buyingToMainRate: Decimal;
      };
    }
  ) {
    const { itemId, branchId, receivedQty, unitCost, item } = data;

    // Convert received quantity from buying unit to main unit
    const receivedQtyInMainUnit = receivedQty.mul(item.buyingToMainRate);

    // Get current stock
    let stock = await tx.stock.findUnique({
      where: {
        itemId_branchId: {
          itemId,
          branchId,
        },
      },
    });

    if (!stock) {
      // Create new stock record
      stock = await tx.stock.create({
        data: {
          itemId,
          branchId,
          quantity: receivedQtyInMainUnit,
          reservedQty: new Decimal(0),
          availableQty: receivedQtyInMainUnit,
          averageCost: unitCost,
          lastCost: unitCost,
        },
      });
    } else {
      // Calculate moving average cost
      const currentTotalValue = stock.quantity.mul(stock.averageCost);
      const receivedTotalValue = receivedQtyInMainUnit.mul(unitCost);
      const newTotalQty = stock.quantity.add(receivedQtyInMainUnit);
      const newTotalValue = currentTotalValue.add(receivedTotalValue);

      const newAverageCost = newTotalQty.gt(0) ? newTotalValue.div(newTotalQty) : new Decimal(0);

      // Update stock
      await tx.stock.update({
        where: {
          itemId_branchId: {
            itemId,
            branchId,
          },
        },
        data: {
          quantity: newTotalQty,
          availableQty: stock.availableQty.add(receivedQtyInMainUnit),
          averageCost: newAverageCost,
          lastCost: unitCost,
          lastStockDate: new Date(),
        },
      });
    }
  }

  // Create GR from PO
  async createFromPO(poId: string, user: AuthenticatedUser) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        items: {
          include: {
            item: true,
          },
        },
        supplier: true,
      },
    });

    if (!po) {
      throw new NotFoundException(`Purchase Order with ID ${poId} not found`);
    }

    if (po.status !== 'CONFIRMED') {
      throw new BadRequestException('Can only create GR from CONFIRMED Purchase Orders');
    }

    // Convert PO items to GR items
    const grItems = po.items.map((poItem) => ({
      itemId: poItem.itemId,
      orderedQty: Number(poItem.orderedQty),
      receivedQty: Number(poItem.orderedQty), // Default to ordered quantity
      unitPrice: Number(poItem.unitPrice),
      qualityNotes: undefined as string | undefined,
    }));

    const createDto: CreateGoodsReceiptDto = {
      poId: po.id,
      documentNumber: `Receipt for ${po.poNumber}`,
      branchId: po.branchId,
      items: grItems,
    };

    return this.create(createDto, user);
  }

  // Create GR from MR
  async createFromMR(mrId: string, user: AuthenticatedUser) {
    const mr = await this.prisma.materialRequisition.findUnique({
      where: { id: mrId },
      include: {
        items: {
          include: {
            item: true,
          },
        },
      },
    });

    if (!mr) {
      throw new NotFoundException(`Material Requisition with ID ${mrId} not found`);
    }

    if (mr.status !== 'APPROVED') {
      throw new BadRequestException('Can only create GR from APPROVED Material Requisitions');
    }

    // Convert MR items to GR items (no pricing for MR receipts)
    const grItems = mr.items.map((mrItem) => ({
      itemId: mrItem.itemId,
      orderedQty: Number(mrItem.quantity),
      receivedQty: Number(mrItem.quantity), // Default to requested quantity
      qualityNotes: undefined as string | undefined,
    }));

    const createDto: CreateGoodsReceiptDto = {
      mrId: mr.id,
      documentNumber: `Receipt for ${mr.mrNumber}`,
      branchId: mr.toBranchId || mr.branchId || '', // Use appropriate branch
      items: grItems,
    };

    return this.create(createDto, user);
  }
}
