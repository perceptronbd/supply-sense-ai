import { PrismaService } from '@app/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { CreateRequestFormDto } from './dto/create-request-form.dto';
import { UpdateRequestFormDto } from './dto/update-request-form.dto';

// Define status enum locally to avoid import issues
enum RFStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  READY_FOR_MR = 'READY_FOR_MR',
}

@Injectable()
export class RequestFormService {
  constructor(private prisma: PrismaService) {}

  async create(createRequestFormDto: CreateRequestFormDto, userId: string) {
    // Generate RF number
    const count = await this.prisma.requestForm.count();
    const rfNumber = `RF${String(count + 1).padStart(6, '0')}`;

    return this.prisma.requestForm.create({
      data: {
        rfNumber,
        title: createRequestFormDto.title,
        description: createRequestFormDto.description,
        fromBranchId: createRequestFormDto.fromBranchId,
        toBranchId: createRequestFormDto.toBranchId,
        requiredDate: new Date(createRequestFormDto.requiredDate),
        createdById: userId,
        rfTemplateId: createRequestFormDto.rfTemplateId,
        reason: createRequestFormDto.reason,
        status: RFStatus.DRAFT,
        items: {
          create: createRequestFormDto.items.map((item) => ({
            itemId: item.itemId,
            requestedQty: new Decimal(item.requestedQty),
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
        rfTemplate: true,
      },
    });
  }

  async findAll(fromBranchId?: string, toBranchId?: string) {
    const where: { fromBranchId?: string; toBranchId?: string } = {};
    if (fromBranchId) where.fromBranchId = fromBranchId;
    if (toBranchId) where.toBranchId = toBranchId;

    return this.prisma.requestForm.findMany({
      where,
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
        rfTemplate: true,
        materialRequisitions: {
          select: {
            id: true,
            mrNumber: true,
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
    const requestForm = await this.prisma.requestForm.findUnique({
      where: { id },
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
        rfTemplate: true,
        materialRequisitions: {
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

    if (!requestForm) {
      throw new NotFoundException(`Request Form with ID ${id} not found`);
    }

    return requestForm;
  }

  async update(id: string, updateRequestFormDto: UpdateRequestFormDto) {
    const existingRF = await this.findOne(id);

    // Only allow updates if status is DRAFT
    if (existingRF.status !== RFStatus.DRAFT) {
      throw new Error('Can only update Request Forms in DRAFT status');
    }

    return this.prisma.requestForm.update({
      where: { id },
      data: {
        title: updateRequestFormDto.title,
        description: updateRequestFormDto.description,
        fromBranchId: updateRequestFormDto.fromBranchId,
        toBranchId: updateRequestFormDto.toBranchId,
        requiredDate: updateRequestFormDto.requiredDate
          ? new Date(updateRequestFormDto.requiredDate)
          : undefined,
        rfTemplateId: updateRequestFormDto.rfTemplateId,
        reason: updateRequestFormDto.reason,
        ...(updateRequestFormDto.items && {
          items: {
            deleteMany: { rfId: id },
            create: updateRequestFormDto.items.map((item) => ({
              itemId: item.itemId,
              requestedQty: new Decimal(item.requestedQty),
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
        rfTemplate: true,
      },
    });
  }

  async remove(id: string) {
    const existingRF = await this.findOne(id);

    // Only allow deletion if status is DRAFT
    if (existingRF.status !== RFStatus.DRAFT) {
      throw new Error('Can only delete Request Forms in DRAFT status');
    }

    return this.prisma.requestForm.delete({
      where: { id },
    });
  }

  async submit(id: string) {
    const existingRF = await this.findOne(id);

    if (existingRF.status !== RFStatus.DRAFT) {
      throw new Error('Can only submit Request Forms in DRAFT status');
    }

    return this.prisma.requestForm.update({
      where: { id },
      data: {
        status: RFStatus.SUBMITTED,
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
        rfTemplate: true,
      },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async approve(id: string, _userId: string) {
    const existingRF = await this.findOne(id);

    if (existingRF.status !== RFStatus.SUBMITTED) {
      throw new Error('Can only approve Request Forms in SUBMITTED status');
    }

    return this.prisma.requestForm.update({
      where: { id },
      data: {
        status: RFStatus.APPROVED,
        approvedDate: new Date(),
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
        rfTemplate: true,
      },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async reject(id: string, _userId: string) {
    const existingRF = await this.findOne(id);

    if (existingRF.status !== RFStatus.SUBMITTED) {
      throw new Error('Can only reject Request Forms in SUBMITTED status');
    }

    return this.prisma.requestForm.update({
      where: { id },
      data: {
        status: RFStatus.REJECTED,
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
        rfTemplate: true,
      },
    });
  }

  async markReadyForMR(id: string) {
    const existingRF = await this.findOne(id);

    if (existingRF.status !== RFStatus.APPROVED) {
      throw new Error('Can only mark APPROVED Request Forms as ready for MR');
    }

    return this.prisma.requestForm.update({
      where: { id },
      data: {
        status: RFStatus.READY_FOR_MR,
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
        rfTemplate: true,
      },
    });
  }

  // Create RF from template
  async createFromTemplate(
    templateId: string,
    fromBranchId: string,
    toBranchId: string,
    userId: string
  ) {
    const template = await this.prisma.rFTemplate.findUnique({
      where: { id: templateId },
      include: {
        items: {
          include: {
            item: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundException(`RF Template with ID ${templateId} not found`);
    }

    if (!template.isActive) {
      throw new Error('Cannot create RF from inactive template');
    }

    // Convert template items to RF items
    const rfItems = template.items.map((templateItem) => ({
      itemId: templateItem.itemId,
      requestedQty: Number(templateItem.defaultQty),
      remarks: templateItem.remarks || undefined,
    }));

    const createDto: CreateRequestFormDto = {
      title: `RF from ${template.name}`,
      description: template.description || undefined,
      fromBranchId,
      toBranchId,
      requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default 7 days from now
      rfTemplateId: template.id,
      items: rfItems,
    };

    // Update template usage count
    await this.prisma.rFTemplate.update({
      where: { id: templateId },
      data: {
        usageCount: template.usageCount + 1,
      },
    });

    return this.create(createDto, userId);
  }
}
