import { PrismaService } from '@app/prisma.service';
import { AiModule } from '@modules/ai/ai.module';
import { AuthModule } from '@modules/auth/auth.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './services/chat.service';
import { DatabaseSchemaService } from './services/database-schema.service';
import { DynamicSQLService } from './services/dynamic-sql.service';
import { MessageService } from './services/message.service';
import { SessionService } from './services/session.service';

@Module({
  imports: [
    ConfigModule,
    AiModule,
    AuthModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [ChatController],
  providers: [
    ChatGateway,
    ChatService,
    MessageService,
    SessionService,
    DynamicSQLService,
    DatabaseSchemaService,
    PrismaService,
  ],
  exports: [ChatService, MessageService, SessionService],
})
export class ChatModule {}
