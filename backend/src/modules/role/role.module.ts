import { PrismaService } from '@app/prisma.service';
import { AuthModule } from '@modules/auth/auth.module';
import { Module } from '@nestjs/common';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';

@Module({
  imports: [AuthModule],
  controllers: [RoleController],
  providers: [RoleService, PrismaService],
  exports: [RoleService],
})
export class RoleModule {}
