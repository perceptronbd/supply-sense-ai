import { PrismaService } from '@app/prisma.service';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FormulaController } from './formula.controller';
import { FormulaService } from './formula.service';

@Module({
  imports: [AuthModule],
  controllers: [FormulaController],
  providers: [FormulaService, PrismaService],
  exports: [FormulaService],
})
export class FormulaModule {}
