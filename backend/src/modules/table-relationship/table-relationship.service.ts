import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@supplysense/prisma';
import type { TableRelations } from '@supplysense/prisma-client';
import { GetTableRelationshipsDto } from './dto/table-relationships.dto';

@Injectable()
export class TableRelationshipService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async getTableRelationships({ dbConnectionId }: GetTableRelationshipsDto) {
    console.log('🚀 > TableRelationshipService > dbConnectionId:', dbConnectionId);
    // Check if the database connection exists
    const dbConnection = await this.prisma.dbConnection.findUnique({
      where: { id: dbConnectionId },
    });

    if (!dbConnection) {
      throw new NotFoundException(`Database connection with ID ${dbConnectionId} not found`);
    }

    // Get the table relationships if they exist
    const tableRelations = await this.prisma.tableRelations.findUnique({
      where: { dbConnectionId },
    });

    // If no relationships exist, return empty array
    if (!tableRelations) {
      return { relationships: [] as never[] };
    }

    return {
      id: tableRelations.id,
      dbConnectionId: tableRelations.dbConnectionId,
      relationships: tableRelations.relationships as TableRelations[],
    };
  }
}
