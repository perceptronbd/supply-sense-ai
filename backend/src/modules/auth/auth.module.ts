import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from '../../app/prisma.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BranchAccessGuard } from './guards/branch-access.guard';
import { CompanyIsolationGuard } from './guards/company-isolation.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { PermissionService } from './services/permission.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PermissionService,
    JwtStrategy,
    PrismaService,
    JwtAuthGuard,
    PermissionsGuard,
    BranchAccessGuard,
    CompanyIsolationGuard,
  ],
  exports: [
    AuthService,
    PermissionService,
    JwtAuthGuard,
    PermissionsGuard,
    BranchAccessGuard,
    CompanyIsolationGuard,
  ],
})
export class AuthModule {}
