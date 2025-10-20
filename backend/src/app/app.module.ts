import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { PrismaModule } from '@supplysense/prisma';
import { ChatModule } from '@/modules/chat/chat.module';
import { OnboardingModule } from '@/modules/onboarding/onboarding.module';
import { TableMetadataModule } from '@/modules/table-metadata/table-metadata.module';
import { AiModule } from '../modules/ai/ai.module';
import { AuthModule } from '../modules/auth/auth.module';
import { ConnectionsModule } from '../modules/connections/connections.module';
import { RoleModule } from '../modules/role/role.module';
import { UserModule } from '../modules/user/user.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AiModule,
    AuthModule,
    ChatModule,
    ConnectionsModule,
    RoleModule,
    UserModule,
    OnboardingModule,
    TableMetadataModule,
  ],
  controllers: [AppController],
  providers: [AppService, Reflector],
})
export class AppModule {}
