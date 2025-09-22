import { AuthModule } from '@modules/auth/auth.module';
import { McpClientModule } from '@modules/mcp-client/mcp-client.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '@supplysense/prisma';
import { TokenAndCredit } from '../common/services/tokenAndCredit.service';
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
    PrismaModule,
    AuthModule,
    McpClientModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [ChatController],
  providers: [
    ChatGateway,
    MessageService,
    SessionService,
    DynamicSQLService,
    DatabaseSchemaService,
    ChatService,
    TokenAndCredit,
  ],
  exports: [ChatService, MessageService, SessionService],
})
export class ChatModule {}
