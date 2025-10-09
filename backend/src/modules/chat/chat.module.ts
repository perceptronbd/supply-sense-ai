import { AuthModule } from '@modules/auth/auth.module';
import { McpClientModule } from '@modules/mcp-client/mcp-client.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from '@supplysense/prisma';
import { TokenAndCredit } from '../common/services/tokenAndCredit.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './services/chat.service';
import { MessageService } from './services/message.service';
import { SessionService } from './services/session.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    McpClientModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'query',
          ttl: 60000, // 1 minute
          limit: 5, // 5 requests per minute
        },
      ],
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [ChatController],
  providers: [ChatGateway, MessageService, SessionService, ChatService, TokenAndCredit],
  exports: [ChatService, MessageService, SessionService],
})
export class ChatModule {}
