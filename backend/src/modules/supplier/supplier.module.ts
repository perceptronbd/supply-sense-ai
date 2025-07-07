import { PrismaService } from '@app/prisma.service';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SupplierController } from './supplier.controller';
import { SupplierService } from './supplier.service';

@Module({
  imports: [AuthModule],
  controllers: [SupplierController],
  providers: [SupplierService, PrismaService],
  exports: [SupplierService],
})
export class SupplierModule {}
