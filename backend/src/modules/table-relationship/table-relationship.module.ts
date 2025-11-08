import { Module } from '@nestjs/common';
import { PrismaModule } from '@supplysense/prisma';
import { TableRelationshipController } from './table-relationship.controller';
import { TableRelationshipService } from './table-relationship.service';

@Module({
  imports: [PrismaModule],
  controllers: [TableRelationshipController],
  providers: [TableRelationshipService],
  exports: [TableRelationshipService],
})
export class TableRelationshipModule {}
