import { Injectable, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaService } from '../../app/prisma.service';
import type { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import type { UpdatePurchaseRequestDto } from './dto/update-purchase-request.dto';

// Define status enum locally to avoid import issues
enum PRStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CONVERTED_TO_PO = 'CONVERTED_TO_PO',
}

@Injectable()
export class PurchaseRequestService {
  constructor(private prisma: PrismaService) {}

  async create(createPurchaseRequestDto: CreatePurchaseRequestDto, userId: string) {
    // Generate PR number
    const count = await this.prisma.purchaseRequest.count();
    const prNumber = `PR${String(count + 1).padStart(6, '0')}`;

    // Calculate total amount
    let totalAmount = new Decimal(0);
    for (const item of createPurchaseRequestDto.items) {
      const itemTotal = new Decimal(item.requestedQty).mul(item.estimatedPrice || 0);
      totalAmount = totalAmount.add(itemTotal);
    }

    return this.prisma.purchaseRequest.create({
      data: {
        prNumber,
        title: createPurchaseRequestDto.title,
        description: createPurchaseRequestDto.description,
        requiredDate: new Date(createPurchaseRequestDto.requiredDate),
        branchId: createPurchaseRequestDto.branchId,
        createdById: userId,
        prTemplateId: createPurchaseRequestDto.prTemplateId,
        justification: createPurchaseRequestDto.justification,
        totalAmount,
        status: PRStatus.DRAFT,
        items: {
          create: createPurchaseRequestDto.items.map((item) => ({
            itemId: item.itemId,
            requestedQty: new Decimal(item.requestedQty),
            estimatedPrice: new Decimal(item.estimatedPrice || 0),
            totalAmount: new Decimal(item.requestedQty).mul(item.estimatedPrice || 0),
            requiredDate: new Date(item.requiredDate),
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
        branch: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        prTemplate: true,
      },
    });
  }

  async findAll(branchId?: string) {
    return this.prisma.purchaseRequest.findMany({
      where: branchId ? { branchId } : undefined,
      include: {
        items: {
          include: {
            item: true,
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
        prTemplate: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const purchaseRequest = await this.prisma.purchaseRequest.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            item: true,
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
        prTemplate: true,
      },
    });

    if (!purchaseRequest) {
      throw new NotFoundException(`Purchase Request with ID ${id} not found`);
    }

    return purchaseRequest;
  }

  async update(id: string, updatePurchaseRequestDto: UpdatePurchaseRequestDto) {
    const existingPR = await this.findOne(id);

    // Only allow updates if status is DRAFT
    if (existingPR.status !== PRStatus.DRAFT) {
      throw new Error('Can only update Purchase Requests in DRAFT status');
    }

    // Calculate new total if items are provided
    let totalAmount: Decimal | undefined;
    if (updatePurchaseRequestDto.items) {
      totalAmount = new Decimal(0);
      for (const item of updatePurchaseRequestDto.items) {
        const itemTotal = new Decimal(item.requestedQty).mul(item.estimatedPrice || 0);
        totalAmount = totalAmount.add(itemTotal);
      }
    }

    return this.prisma.purchaseRequest.update({
      where: { id },
      data: {
        title: updatePurchaseRequestDto.title,
        description: updatePurchaseRequestDto.description,
        requiredDate: updatePurchaseRequestDto.requiredDate
          ? new Date(updatePurchaseRequestDto.requiredDate)
          : undefined,
        branchId: updatePurchaseRequestDto.branchId,
        prTemplateId: updatePurchaseRequestDto.prTemplateId,
        justification: updatePurchaseRequestDto.justification,
        totalAmount,
        ...(updatePurchaseRequestDto.items && {
          items: {
            deleteMany: { prId: id },
            create: updatePurchaseRequestDto.items.map((item) => ({
              itemId: item.itemId,
              requestedQty: new Decimal(item.requestedQty),
              estimatedPrice: new Decimal(item.estimatedPrice || 0),
              totalAmount: new Decimal(item.requestedQty).mul(item.estimatedPrice || 0),
              requiredDate: new Date(item.requiredDate),
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
        branch: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        prTemplate: true,
      },
    });
  }

  async remove(id: string) {
    const existingPR = await this.findOne(id);

    // Only allow deletion if status is DRAFT
    if (existingPR.status !== PRStatus.DRAFT) {
      throw new Error('Can only delete Purchase Requests in DRAFT status');
    }

    return this.prisma.purchaseRequest.delete({
      where: { id },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async approve(id: string, _userId: string) {
    const existingPR = await this.findOne(id);

    if (existingPR.status !== PRStatus.SUBMITTED) {
      throw new Error('Can only approve Purchase Requests in SUBMITTED status');
    }

    return this.prisma.purchaseRequest.update({
      where: { id },
      data: {
        status: PRStatus.APPROVED,
        approvedDate: new Date(),
      },
      include: {
        items: {
          include: {
            item: true,
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

  async submit(id: string) {
    const existingPR = await this.findOne(id);

    if (existingPR.status !== PRStatus.DRAFT) {
      throw new Error('Can only submit Purchase Requests in DRAFT status');
    }

    return this.prisma.purchaseRequest.update({
      where: { id },
      data: {
        status: PRStatus.SUBMITTED,
      },
      include: {
        items: {
          include: {
            item: true,
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async reject(id: string, _userId: string) {
    const existingPR = await this.findOne(id);

    if (existingPR.status !== PRStatus.SUBMITTED) {
      throw new Error('Can only reject Purchase Requests in SUBMITTED status');
    }

    return this.prisma.purchaseRequest.update({
      where: { id },
      data: {
        status: PRStatus.REJECTED,
      },
      include: {
        items: {
          include: {
            item: true,
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
}
