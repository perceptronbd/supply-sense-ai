import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../app/prisma.service';
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
  constructor(private prisma: PrismaService) {}

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

    // Convert PR items to PO items (convert units from buying to buying - no conversion needed)
    const poItems = pr.items.map((prItem) => ({
      itemId: prItem.itemId,
      orderedQty: prItem.requestedQty,
      unitPrice: prItem.estimatedPrice, // This should be updated with actual supplier price
      deliveryDate: prItem.requiredDate,
      remarks: prItem.remarks,
    }));

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
}
