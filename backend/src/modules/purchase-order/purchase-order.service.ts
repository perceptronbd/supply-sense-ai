import { PrismaService } from '@app/prisma.service';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';

// Define status enum locally to avoid import issues
enum POStatus {
  DRAFT = 'DRAFT',
  SENT_TO_SUPPLIER = 'SENT_TO_SUPPLIER',
  CONFIRMED = 'CONFIRMED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

@Injectable()
export class PurchaseOrderService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async create(createPurchaseOrderDto: CreatePurchaseOrderDto, userId: string) {
    // Generate unique PO number using timestamp and random number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const poNumber = `PO${timestamp.toString().slice(-6)}${random.toString().padStart(3, '0')}`;

    // Calculate totals
    let subtotal = new Decimal(0);
    for (const item of createPurchaseOrderDto.items) {
      const itemTotal = new Decimal(item.orderedQty).mul(item.unitPrice);
      subtotal = subtotal.add(itemTotal);
    }

    const taxAmount = new Decimal(0); // TODO: Implement tax calculation
    const totalAmount = subtotal.add(taxAmount);

    return this.prisma.purchaseOrder.create({
      data: {
        poNumber,
        title: createPurchaseOrderDto.title,
        prId: createPurchaseOrderDto.prId,
        supplierId: createPurchaseOrderDto.supplierId,
        expectedDeliveryDate: new Date(createPurchaseOrderDto.expectedDeliveryDate),
        paymentTerms: createPurchaseOrderDto.paymentTerms,
        deliveryTerms: createPurchaseOrderDto.deliveryTerms,
        branchId: createPurchaseOrderDto.branchId,
        createdById: userId,
        notes: createPurchaseOrderDto.notes,
        subtotal,
        taxAmount,
        totalAmount,
        status: POStatus.DRAFT,
        items: {
          create: createPurchaseOrderDto.items.map((item) => ({
            itemId: item.itemId,
            orderedQty: new Decimal(item.orderedQty),
            unitPrice: new Decimal(item.unitPrice),
            totalAmount: new Decimal(item.orderedQty).mul(item.unitPrice),
            deliveryDate: new Date(item.deliveryDate),
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
        supplier: true,
        branch: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        purchaseRequest: true,
      },
    });
  }

  async findAll(branchId?: string) {
    return this.prisma.purchaseOrder.findMany({
      where: branchId ? { branchId } : undefined,
      include: {
        items: {
          include: {
            item: true,
          },
        },
        supplier: true,
        branch: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        purchaseRequest: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const purchaseOrder = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            item: true,
          },
        },
        supplier: true,
        branch: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        purchaseRequest: true,
        goodsReceipts: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!purchaseOrder) {
      throw new NotFoundException(`Purchase Order with ID ${id} not found`);
    }

    return purchaseOrder;
  }

  async update(id: string, updatePurchaseOrderDto: UpdatePurchaseOrderDto) {
    const existingPO = await this.findOne(id);

    // Only allow updates if status is DRAFT
    if (existingPO.status !== POStatus.DRAFT) {
      throw new BadRequestException('Can only update Purchase Orders in DRAFT status');
    }

    // Calculate new totals if items are provided
    let subtotal: Decimal | undefined;
    let taxAmount: Decimal | undefined;
    let totalAmount: Decimal | undefined;

    if (updatePurchaseOrderDto.items) {
      subtotal = new Decimal(0);
      for (const item of updatePurchaseOrderDto.items) {
        const itemTotal = new Decimal(item.orderedQty).mul(item.unitPrice);
        subtotal = subtotal.add(itemTotal);
      }
      taxAmount = new Decimal(0); // TODO: Implement tax calculation
      totalAmount = subtotal.add(taxAmount);
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        title: updatePurchaseOrderDto.title,
        prId: updatePurchaseOrderDto.prId,
        supplierId: updatePurchaseOrderDto.supplierId,
        expectedDeliveryDate: updatePurchaseOrderDto.expectedDeliveryDate
          ? new Date(updatePurchaseOrderDto.expectedDeliveryDate)
          : undefined,
        paymentTerms: updatePurchaseOrderDto.paymentTerms,
        deliveryTerms: updatePurchaseOrderDto.deliveryTerms,
        branchId: updatePurchaseOrderDto.branchId,
        notes: updatePurchaseOrderDto.notes,
        subtotal,
        taxAmount,
        totalAmount,
        ...(updatePurchaseOrderDto.items && {
          items: {
            deleteMany: { poId: id },
            create: updatePurchaseOrderDto.items.map((item) => ({
              itemId: item.itemId,
              orderedQty: new Decimal(item.orderedQty),
              unitPrice: new Decimal(item.unitPrice),
              totalAmount: new Decimal(item.orderedQty).mul(item.unitPrice),
              deliveryDate: new Date(item.deliveryDate),
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
        supplier: true,
        branch: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        purchaseRequest: true,
      },
    });
  }

  async remove(id: string) {
    const existingPO = await this.findOne(id);

    // Only allow deletion if status is DRAFT
    if (existingPO.status !== POStatus.DRAFT) {
      throw new BadRequestException('Can only delete Purchase Orders in DRAFT status');
    }

    return this.prisma.purchaseOrder.delete({
      where: { id },
    });
  }

  async sendToSupplier(id: string) {
    const existingPO = await this.findOne(id);

    if (existingPO.status !== POStatus.DRAFT) {
      throw new BadRequestException('Can only send Purchase Orders in DRAFT status');
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: POStatus.SENT_TO_SUPPLIER,
        sentToSupplierAt: new Date(),
      },
      include: {
        items: {
          include: {
            item: true,
          },
        },
        supplier: true,
        branch: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        purchaseRequest: true,
      },
    });
  }

  async confirm(id: string) {
    const existingPO = await this.findOne(id);

    if (existingPO.status !== POStatus.SENT_TO_SUPPLIER) {
      throw new BadRequestException('Can only confirm Purchase Orders in SENT_TO_SUPPLIER status');
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: POStatus.CONFIRMED,
        confirmedDate: new Date(),
        confirmedAt: new Date(),
      },
      include: {
        items: {
          include: {
            item: true,
          },
        },
        supplier: true,
        branch: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        purchaseRequest: true,
      },
    });
  }

  async cancel(id: string) {
    const existingPO = await this.findOne(id);

    if (existingPO.status === POStatus.CLOSED || existingPO.status === POStatus.CANCELLED) {
      throw new BadRequestException(
        'Cannot cancel Purchase Orders that are already CLOSED or CANCELLED'
      );
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: POStatus.CANCELLED,
      },
      include: {
        items: {
          include: {
            item: true,
          },
        },
        supplier: true,
        branch: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        purchaseRequest: true,
      },
    });
  }

  async close(id: string) {
    const existingPO = await this.findOne(id);

    if (existingPO.status !== POStatus.CONFIRMED) {
      throw new BadRequestException('Can only close Purchase Orders in CONFIRMED status');
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: POStatus.CLOSED,
        closedAt: new Date(),
      },
      include: {
        items: {
          include: {
            item: true,
          },
        },
        supplier: true,
        branch: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        purchaseRequest: true,
      },
    });
  }

  // Create PO from approved PR
  async createFromPR(prId: string, supplierId: string, userId: string) {
    // TODO: ENHANCEMENT - Add support for selective item conversion
    // TODO: Currently converts ALL items from PR to PO automatically
    // TODO: Future enhancement should allow selecting specific items and adjusting quantities
    // TODO: API signature could be: createFromPR(prId, supplierId, userId, selectedItems?: SelectedItemDto[])
    // TODO: where SelectedItemDto = { prItemId: string, orderedQty: number, unitPrice: number }

    const pr = await this.prisma.purchaseRequest.findUnique({
      where: { id: prId },
      include: {
        items: {
          include: {
            item: true,
          },
        },
        branch: true,
      },
    });

    if (!pr) {
      throw new NotFoundException(`Purchase Request with ID ${prId} not found`);
    }

    if (pr.status !== 'APPROVED') {
      throw new BadRequestException('Can only create PO from APPROVED Purchase Requests');
    }

    // TODO: VALIDATION - Add minimum items validation
    // TODO: Add validation to ensure PR has at least 1 item
    // TODO: if (pr.items.length === 0) throw new BadRequestException('Cannot create PO from PR with no items')

    // TODO: ENHANCEMENT - Add support for multiple PR to single PO conversion
    // TODO: Create new method: createFromMultiplePRs(prIds: string[], supplierId: string, userId: string)
    // TODO: This would validate all PRs are approved, from same branch, and merge items

    // Convert PR items to PO items (convert units from buying to buying - no conversion needed)
    const poItems = pr.items.map((prItem) => ({
      itemId: prItem.itemId,
      orderedQty: prItem.requestedQty,
      // TODO: PRICING - Replace estimated price with actual supplier pricing
      // TODO: Look up actual supplier price from ItemSupplier table instead of using estimated price
      // TODO: const supplierPrice = await this.getSupplierPrice(prItem.itemId, supplierId)
      unitPrice: prItem.estimatedPrice, // This should be updated with actual supplier price
      deliveryDate: prItem.requiredDate,
      remarks: prItem.remarks,
    }));

    // TODO: QUANTITY VALIDATION - Add validation for reasonable quantities
    // TODO: Validate orderedQty > 0 and within reasonable limits
    // TODO: Validate unitPrice > 0 and matches supplier pricing

    // TODO: BUSINESS LOGIC - Add handling for unavailable items
    // TODO: Check if all items are available from the selected supplier
    // TODO: Handle partial fulfillment scenarios

    const createDto: CreatePurchaseOrderDto = {
      title: `PO for ${pr.prNumber}`,
      prId: pr.id,
      supplierId,
      expectedDeliveryDate: pr.requiredDate.toISOString(),
      branchId: pr.branchId,
      items: poItems.map((item) => ({
        itemId: item.itemId,
        orderedQty: Number(item.orderedQty),
        unitPrice: Number(item.unitPrice),
        deliveryDate: item.deliveryDate.toISOString(),
        remarks: item.remarks || undefined,
      })),
    };

    // Create the PO
    const po = await this.create(createDto, userId);

    // Update PR status to CONVERTED_TO_PO
    await this.prisma.purchaseRequest.update({
      where: { id: prId },
      data: {
        status: 'CONVERTED_TO_PO',
      },
    });

    return po;
  }

  // TODO: NEW METHOD - Create PO from multiple PRs
  // TODO: async createFromMultiplePRs(prIds: string[], supplierId: string, userId: string) {
  // TODO:   // Validate all PRs exist and are approved
  // TODO:   // Validate all PRs belong to same branch
  // TODO:   // Merge items from multiple PRs (handle duplicate items by summing quantities)
  // TODO:   // Create single PO with all items
  // TODO:   // Update all source PRs to CONVERTED_TO_PO status
  // TODO: }

  // TODO: NEW METHOD - Create PO with selective items
  // TODO: async createFromPRWithSelection(
  // TODO:   prId: string,
  // TODO:   supplierId: string,
  // TODO:   userId: string,
  // TODO:   selectedItems: { prItemId: string, orderedQty: number, unitPrice: number }[]
  // TODO: ) {
  // TODO:   // Validate selected items exist in the PR
  // TODO:   // Allow quantity adjustments and price updates
  // TODO:   // Create PO with only selected items
  // TODO:   // Optionally update PR status or create partial conversion tracking
  // TODO: }

  // TODO: HELPER METHOD - Get actual supplier pricing
  // TODO: private async getSupplierPrice(itemId: string, supplierId: string): Promise<Decimal> {
  // TODO:   const supplierItem = await this.prisma.itemSupplier.findUnique({
  // TODO:     where: { itemId_supplierId: { itemId, supplierId } }
  // TODO:   });
  // TODO:   return supplierItem?.unitPrice || new Decimal(0);
  // TODO: }

  // TODO: HELPER METHOD - Validate supplier can supply all items
  // TODO: private async validateSupplierItems(itemIds: string[], supplierId: string): Promise<boolean> {
  // TODO:   const availableItems = await this.prisma.itemSupplier.findMany({
  // TODO:     where: { supplierId, itemId: { in: itemIds }, isActive: true }
  // TODO:   });
  // TODO:   return availableItems.length === itemIds.length;
  // TODO: }
}
