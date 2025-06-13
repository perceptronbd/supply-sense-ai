import { PrismaService } from '@app/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SupplierService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.supplier.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.supplier.findUnique({
      where: { id },
    });
  }
}
