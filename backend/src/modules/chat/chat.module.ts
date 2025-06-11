import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../app/prisma.service';
import { AiModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './services/chat.service';
import { DatabaseQueryService } from './services/database-query.service';
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
    DatabaseQueryService,
    DynamicSQLService,
    PrismaService,
  ],
  exports: [ChatService, MessageService, SessionService],
})
export class ChatModule {}
