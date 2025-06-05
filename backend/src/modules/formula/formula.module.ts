import { Module } from '@nestjs/common';
import { FormulaService } from './formula.service';
import { FormulaController } from './formula.controller';
import { PrismaService } from '../../app/prisma.service';

@Module({
  controllers: [FormulaController],
  providers: [FormulaService, PrismaService],
  exports: [FormulaService],
})
export class FormulaModule {}
