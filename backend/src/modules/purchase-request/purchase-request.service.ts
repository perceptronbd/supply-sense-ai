import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PRStatus, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../app/prisma.service';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import { UpdatePurchaseRequestDto } from './dto/update-purchase-request.dto';

@Injectable()
export class PurchaseRequestService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(createPurchaseRequestDto: CreatePurchaseRequestDto, user: AuthenticatedUser) {
    // Validate that the branch belongs to the user's company
    const branch = await this.prisma.branch.findFirst({
      where: {
        id: createPurchaseRequestDto.branchId,
        companyId: user.companyId,
      },
    });

    if (!branch) {
      throw new ForbiddenException('Branch does not belong to your company');
    }

    // Check if user has access to this branch
    if (!user.branchIds.includes(createPurchaseRequestDto.branchId)) {
      throw new ForbiddenException('You do not have access to this branch');
    }

    // Validate that items array is not empty
    if (!createPurchaseRequestDto.items || createPurchaseRequestDto.items.length === 0) {
      throw new ForbiddenException('Purchase request must contain at least one item');
    }

    // Validate that all items belong to the company
    const itemIds = createPurchaseRequestDto.items.map((item) => item.itemId);
    const items = await this.prisma.item.findMany({
      where: {
        id: { in: itemIds },
        companyId: user.companyId,
      },
      select: {
        id: true,
        name: true,
        sku: true,
      },
    });

    if (items.length !== itemIds.length) {
      const foundItemIds = items.map((item) => item.id);
      const missingItemIds = itemIds.filter((id) => !foundItemIds.includes(id));
      throw new ForbiddenException(
        `Some items do not belong to your company. Invalid item IDs: ${missingItemIds.join(', ')}`
      );
    }

    // Validate item quantities and prices
    const validationErrors: string[] = [];
    createPurchaseRequestDto.items.forEach((item, index) => {
      if (item.requestedQty <= 0) {
        validationErrors.push(`Item ${index + 1}: Requested quantity must be greater than 0`);
      }
      if (item.estimatedPrice !== undefined && item.estimatedPrice < 0) {
        validationErrors.push(`Item ${index + 1}: Estimated price cannot be negative`);
      }
    });

    if (validationErrors.length > 0) {
      throw new ForbiddenException(`Validation errors: ${validationErrors.join('; ')}`);
    }

    // Generate PR number
    const count = await this.prisma.purchaseRequest.count({
      where: { companyId: user.companyId },
    });
    const prNumber = `PR${String(count + 1).padStart(6, '0')}`;

    // Calculate total amount
    let totalAmount = new Decimal(0);
    for (const item of createPurchaseRequestDto.items) {
      const itemTotal = new Decimal(item.requestedQty).mul(item.estimatedPrice || 0);
      totalAmount = totalAmount.add(itemTotal);
    }

    try {
      return await this.prisma.purchaseRequest.create({
        data: {
          prNumber,
          title: createPurchaseRequestDto.title,
          description: createPurchaseRequestDto.description,
          requiredDate: new Date(createPurchaseRequestDto.requiredDate),
          companyId: user.companyId,
          branchId: createPurchaseRequestDto.branchId,
          createdById: user.id,
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
          company: true,
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
          items: {
            include: {
              item: true,
            },
          },
        },
      });
    } catch (error) {
      // Handle database errors
      if (error.code === 'P2002') {
        throw new ForbiddenException('A purchase request with this information already exists');
      }
      if (error.code === 'P2003') {
        throw new ForbiddenException('Referenced item or template does not exist');
      }
      throw error;
    }
  }

  async findAll(user: AuthenticatedUser, branchId?: string) {
    // Apply company isolation and branch access control
    const whereClause: Prisma.PurchaseRequestWhereInput = {
      companyId: user.companyId,
    };

    // If branchId is specified, validate user has access to it
    if (branchId) {
      if (!user.branchIds.includes(branchId)) {
        throw new ForbiddenException('You do not have access to this branch');
      }
      whereClause.branchId = branchId;
    } else {
      // Limit to branches user has access to
      whereClause.branchId = { in: user.branchIds };
    }

    return this.prisma.purchaseRequest.findMany({
      where: whereClause,
      include: {
        company: true,
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
        items: {
          include: {
            item: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getTemplates(user: AuthenticatedUser) {
    // Get purchase request templates for the user's company
    return this.prisma.pRTemplate.findMany({
      where: {
        companyId: user.companyId,
        isActive: true,
      },
      include: {
        items: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
                sku: true,
                description: true,
                mainUnit: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const purchaseRequest = await this.prisma.purchaseRequest.findFirst({
      where: {
        id,
        companyId: user.companyId,
        branchId: { in: user.branchIds },
      },
      include: {
        company: true,
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
        items: {
          include: {
            item: true,
          },
        },
      },
    });

    if (!purchaseRequest) {
      throw new NotFoundException(`Purchase Request with ID ${id} not found`);
    }

    return purchaseRequest;
  }

  async update(
    id: string,
    updatePurchaseRequestDto: UpdatePurchaseRequestDto,
    user: AuthenticatedUser
  ) {
    const existingPR = await this.findOne(id, user);

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

  async remove(id: string, user: AuthenticatedUser) {
    const existingPR = await this.findOne(id, user);

    // Only allow deletion if status is DRAFT
    if (existingPR.status !== PRStatus.DRAFT) {
      throw new ForbiddenException('Can only delete Purchase Requests in DRAFT status');
    }

    return this.prisma.purchaseRequest.delete({
      where: { id },
    });
  }

  async approve(id: string, user: AuthenticatedUser) {
    const existingPR = await this.findOne(id, user);

    if (existingPR.status !== PRStatus.SUBMITTED) {
      throw new ForbiddenException('Can only approve Purchase Requests in SUBMITTED status');
    }

    // Check if user has approval permissions
    if (!user.permissions.includes('PURCHASE_REQUESTS:APPROVE')) {
      throw new ForbiddenException('You do not have permission to approve purchase requests');
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

  async submit(id: string, user: AuthenticatedUser) {
    const existingPR = await this.findOne(id, user);

    if (existingPR.status !== PRStatus.DRAFT) {
      throw new ForbiddenException('Can only submit Purchase Requests in DRAFT status');
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
  async reject(id: string, user: AuthenticatedUser) {
    const existingPR = await this.findOne(id, user);

    if (existingPR.status !== PRStatus.SUBMITTED) {
      throw new ForbiddenException('Can only reject Purchase Requests in SUBMITTED status');
    }

    // Check if user has approval permissions
    if (!user.permissions.includes('PURCHASE_REQUESTS:APPROVE')) {
      throw new ForbiddenException('You do not have permission to reject purchase requests');
    }

    return this.prisma.purchaseRequest.update({
      where: { id },
      data: {
        status: PRStatus.REJECTED,
        rejectedAt: new Date(),
      },
    });
  }
}
