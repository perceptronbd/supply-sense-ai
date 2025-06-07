import { Module } from '@nestjs/common';
import { PrismaService } from '../../app/prisma.service';
import { FormulaController } from './formula.controller';
import { FormulaService } from './formula.service';

@Module({
  controllers: [FormulaController],
  providers: [FormulaService, PrismaService],
  exports: [FormulaService],
})
export class FormulaModule {}
