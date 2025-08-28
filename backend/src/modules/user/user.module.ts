import { AuthModule } from '@modules/auth/auth.module';
import { Module } from '@nestjs/common';
import { PrismaService } from '@supplysense/prisma';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [AuthModule],
  controllers: [UserController],
  providers: [UserService, PrismaService],
  exports: [UserService],
})
export class UserModule {}
