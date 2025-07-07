import { PrismaService } from '@app/prisma.service';
import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { CreateFormulaDto } from './dto/create-formula.dto';
import { UpdateFormulaDto } from './dto/update-formula.dto';

@Injectable()
export class FormulaService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async create(createFormulaDto: CreateFormulaDto, userId: string, companyId: string) {
    // Check if code is unique within the company
    const existingFormula = await this.prisma.formula.findUnique({
      where: {
        companyId_code: {
          companyId,
          code: createFormulaDto.code,
        },
      },
    });

    if (existingFormula) {
      throw new ConflictException(`Formula with code ${createFormulaDto.code} already exists`);
    }

    // Validate all item IDs exist
    for (const item of createFormulaDto.items) {
      const itemExists = await this.prisma.item.findUnique({
        where: { id: item.itemId },
      });
      if (!itemExists) {
        throw new NotFoundException(`Item with ID ${item.itemId} not found`);
      }
    }

    // Validate output item if specified
    if (createFormulaDto.outputItem) {
      const outputItemExists = await this.prisma.item.findUnique({
        where: { id: createFormulaDto.outputItem },
      });
      if (!outputItemExists) {
        throw new NotFoundException(`Output item with ID ${createFormulaDto.outputItem} not found`);
      }
    }

    return this.prisma.formula.create({
      data: {
        name: createFormulaDto.name,
        code: createFormulaDto.code,
        description: createFormulaDto.description,
        version: createFormulaDto.version || '1.0',
        outputItem: createFormulaDto.outputItem,
        outputQuantity: new Decimal(createFormulaDto.outputQuantity || 1),
        isActive: createFormulaDto.isActive ?? true,
        company: {
          connect: { id: companyId },
        },
        createdBy: {
          connect: { id: userId },
        },
        items: {
          create: createFormulaDto.items.map((item) => ({
            itemId: item.itemId,
            quantity: new Decimal(item.quantity),
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
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        manufacturingLists: {
          select: {
            id: true,
            mlNumber: true,
            status: true,
          },
        },
      },
    });
  }

  async findAll(isActive?: boolean, companyId?: string) {
    const where: { isActive?: boolean; companyId?: string } = {};
    if (typeof isActive === 'boolean') where.isActive = isActive;
    if (companyId) where.companyId = companyId;

    return this.prisma.formula.findMany({
      where,
      include: {
        items: {
          include: {
            item: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        manufacturingLists: {
          select: {
            id: true,
            mlNumber: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, companyId?: string) {
    const where: { id: string; companyId?: string } = { id };
    if (companyId) {
      where.companyId = companyId;
    }

    const formula = await this.prisma.formula.findUnique({
      where,
      include: {
        items: {
          include: {
            item: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        manufacturingLists: {
          include: {
            branch: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!formula) {
      throw new NotFoundException(`Formula with ID ${id} not found`);
    }

    return formula;
  }

  async findByCode(code: string, companyId: string) {
    const formula = await this.prisma.formula.findUnique({
      where: {
        companyId_code: {
          companyId,
          code,
        },
      },
      include: {
        items: {
          include: {
            item: true,
          },
        },
      },
    });

    if (!formula) {
      throw new NotFoundException(`Formula with code ${code} not found`);
    }

    return formula;
  }

  async update(id: string, updateFormulaDto: UpdateFormulaDto, companyId: string) {
    const existingFormula = await this.findOne(id);

    // Check if code is being updated and is unique
    if (updateFormulaDto.code && updateFormulaDto.code !== existingFormula.code) {
      const codeExists = await this.prisma.formula.findUnique({
        where: {
          companyId_code: {
            companyId,
            code: updateFormulaDto.code,
          },
        },
      });
      if (codeExists) {
        throw new ConflictException(`Formula with code ${updateFormulaDto.code} already exists`);
      }
    }

    // Validate new item IDs if items are being updated
    if (updateFormulaDto.items) {
      for (const item of updateFormulaDto.items) {
        const itemExists = await this.prisma.item.findUnique({
          where: { id: item.itemId },
        });
        if (!itemExists) {
          throw new NotFoundException(`Item with ID ${item.itemId} not found`);
        }
      }
    }

    // Validate output item if being updated
    if (updateFormulaDto.outputItem) {
      const outputItemExists = await this.prisma.item.findUnique({
        where: { id: updateFormulaDto.outputItem },
      });
      if (!outputItemExists) {
        throw new NotFoundException(`Output item with ID ${updateFormulaDto.outputItem} not found`);
      }
    }

    return this.prisma.formula.update({
      where: { id },
      data: {
        name: updateFormulaDto.name,
        code: updateFormulaDto.code,
        description: updateFormulaDto.description,
        version: updateFormulaDto.version,
        outputItem: updateFormulaDto.outputItem,
        outputQuantity: updateFormulaDto.outputQuantity
          ? new Decimal(updateFormulaDto.outputQuantity)
          : undefined,
        isActive: updateFormulaDto.isActive,
        ...(updateFormulaDto.items && {
          items: {
            deleteMany: { formulaId: id },
            create: updateFormulaDto.items.map((item) => ({
              itemId: item.itemId,
              quantity: new Decimal(item.quantity),
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
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        manufacturingLists: {
          select: {
            id: true,
            mlNumber: true,
            status: true,
          },
        },
      },
    });
  }

  async remove(id: string, companyId?: string) {
    await this.findOne(id, companyId); // Validate formula exists

    // Check if formula is being used in any active manufacturing lists
    const activeMLs = await this.prisma.manufacturingList.findMany({
      where: {
        formulaId: id,
        status: {
          in: ['DRAFT', 'IN_PROGRESS'],
        },
      },
    });

    if (activeMLs.length > 0) {
      throw new Error('Cannot delete formula that is being used in active Manufacturing Lists');
    }

    return this.prisma.formula.delete({
      where: { id },
    });
  }

  // Activate/Deactivate formula
  async toggleActive(id: string, companyId?: string) {
    const existingFormula = await this.findOne(id, companyId);

    // If trying to deactivate, check if used in any manufacturing lists
    if (existingFormula.isActive) {
      const activeMls = await this.prisma.manufacturingList.findMany({
        where: {
          formulaId: id,
          status: {
            in: ['IN_PROGRESS', 'COMPLETED'],
          },
        },
      });

      if (activeMls.length > 0) {
        throw new Error('Cannot deactivate formula that is used in manufacturing lists');
      }
    }

    return this.prisma.formula.update({
      where: { id },
      data: {
        isActive: !existingFormula.isActive,
      },
      include: {
        items: {
          include: {
            item: true,
          },
        },
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

  // Clone formula with new version
  async cloneFormula(id: string, newVersion: string, userId: string, companyId: string) {
    const originalFormula = await this.findOne(id);

    // Generate new code based on original
    const newCode = `${originalFormula.code}_v${newVersion}`;

    // Check if new code is unique
    const codeExists = await this.prisma.formula.findUnique({
      where: {
        companyId_code: {
          companyId,
          code: newCode,
        },
      },
    });
    if (codeExists) {
      throw new ConflictException(`Formula with code ${newCode} already exists`);
    }

    return this.prisma.formula.create({
      data: {
        name: `${originalFormula.name} (v${newVersion})`,
        code: newCode,
        description: originalFormula.description,
        version: newVersion,
        outputItem: originalFormula.outputItem,
        outputQuantity: originalFormula.outputQuantity,
        isActive: true,
        company: {
          connect: { id: companyId },
        },
        createdBy: {
          connect: { id: userId },
        },
        items: {
          create: originalFormula.items.map((item) => ({
            itemId: item.itemId,
            quantity: item.quantity,
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
      },
    });
  }

  // Clone an existing formula with a new version
  async clone(id: string, userId: string) {
    const originalFormula = await this.findOne(id);

    // Generate a new version number
    const currentVersion = Number.parseFloat(originalFormula.version || '1.0');
    let newVersion = (currentVersion + 0.1).toFixed(1);

    // Check if this version already exists
    const versionExists = await this.prisma.formula.findUnique({
      where: {
        companyId_code: {
          companyId: originalFormula.companyId,
          code: originalFormula.code,
        },
      },
    });

    if (versionExists && versionExists.version === newVersion) {
      // Increment version if this one already exists
      const incrementedVersion = Number.parseFloat(newVersion) + 0.1;
      newVersion = incrementedVersion.toFixed(1);
    }

    // Create a clone with the same properties but new version
    return this.prisma.formula.create({
      data: {
        name: originalFormula.name,
        code: originalFormula.code,
        description: originalFormula.description,
        version: newVersion,
        outputItem: originalFormula.outputItem,
        outputQuantity: originalFormula.outputQuantity,
        isActive: true,
        company: {
          connect: { id: originalFormula.companyId },
        },
        createdBy: {
          connect: { id: userId },
        },
        items: {
          create: originalFormula.items.map((item) => ({
            itemId: item.itemId,
            quantity: item.quantity,
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

  // Calculate material requirements for given output quantity
  async calculateMaterialRequirements(id: string, outputQuantity: number, companyId?: string) {
    const formula = await this.findOne(id, companyId);

    if (!formula.isActive) {
      throw new Error('Cannot calculate requirements for inactive formula');
    }

    const scaleFactor = new Decimal(outputQuantity).div(formula.outputQuantity);

    const requirements = formula.items.map((item) => ({
      itemId: item.itemId,
      itemName: item.item.name,
      itemSku: item.item.sku,
      requiredQuantityInUsingUnit: item.quantity.mul(scaleFactor),
      requiredQuantityInMainUnit: item.quantity.mul(scaleFactor).mul(item.item.usingToMainRate),
      usingUnit: item.item.usingUnit,
      mainUnit: item.item.mainUnit,
      remarks: item.remarks,
    }));

    return {
      formulaId: formula.id,
      formulaName: formula.name,
      formulaCode: formula.code,
      requestedOutputQuantity: outputQuantity,
      formulaStandardOutput: formula.outputQuantity,
      scaleFactor,
      requirements,
    };
  }
}
