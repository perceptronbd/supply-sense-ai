import { PrismaModule } from '@app/prisma.module';
import { AuthModule } from '@modules/auth/auth.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './services/chat.service';
import { DatabaseSchemaService } from './services/database-schema.service';
import { DynamicSQLService } from './services/dynamic-sql.service';
import { McpClientService } from './services/mcp-client.service';
import { MessageService } from './services/message.service';
import { SessionService } from './services/session.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
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
    McpClientService,
    ChatService, // Move ChatService after McpClientService
  ],
  exports: [ChatService, MessageService, SessionService, McpClientService],
})
export class ChatModule {}
