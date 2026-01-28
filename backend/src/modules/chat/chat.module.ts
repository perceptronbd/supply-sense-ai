import { AuthModule } from '@modules/auth/auth.module';
import { CommonModule } from '@modules/common/common.module';
import { McpClientModule } from '@modules/mcp-client/mcp-client.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '@supplysense/prisma';
import { appConfig } from '@/config/app.config';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './services/chat.service';
import { MessageService } from './services/message.service';
import { PublicChatService } from './services/public-chat.service';
import { SessionService } from './services/session.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    McpClientModule,
    CommonModule,
    JwtModule.register({
      secret: appConfig.jwtSecret,
      signOptions: { expiresIn: appConfig.jwtExpiresIn },
    }),
  ],
  controllers: [ChatController],
  providers: [ChatGateway, MessageService, SessionService, ChatService, PublicChatService],
  exports: [ChatService, MessageService, SessionService, PublicChatService],
})
export class ChatModule {}
