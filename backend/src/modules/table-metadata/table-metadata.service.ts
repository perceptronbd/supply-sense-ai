import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@supplysense/prisma';

@Injectable()
export class TableMetadataService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getTableMetadata(dbConnectionId: string) {
    return await this.prisma.tableMetadata.findMany({
      where: {
        dbConnectionId,
      },
    });
  }

  async getSampleQuestions(dbConnectionId: string) {
    const sampleQuestions = await this.prisma.tableMetadata.findMany({
      where: {
        dbConnectionId,
      },
      select: {
        sampleQuestions: true,
      },
    });

    return sampleQuestions.flatMap(({ sampleQuestions }) => sampleQuestions);
  }
}
