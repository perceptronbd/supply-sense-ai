import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@supplysense/prisma';
import { appConfig } from '@/config/app.config';

@Injectable()
export class TableMetadataService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private readonly PUBLIC_DB_CONNECTION_ID = appConfig.publicDbConnectionId;

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

  async getPublicSampleQuestions() {
    const sampleQuestions = await this.prisma.tableMetadata.findMany({
      where: {
        dbConnectionId: this.PUBLIC_DB_CONNECTION_ID,
      },
      select: {
        sampleQuestions: true,
      },
    });

    return sampleQuestions.flatMap(({ sampleQuestions }) => sampleQuestions);
  }
}
