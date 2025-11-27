import type { MastraModelOutput } from '@mastra/core/stream';
import { McpClientService } from '@modules/mcp-client/services/mcp-client.service';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { createRuntimeContext } from '@supplysense/utils/server';
import { appConfig } from '@/config/app.config';
import { AIChatResponse } from '../interfaces/chat.interface';
import { extractWorkflowResult } from '../utils/chat-utils';

interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'data';
  sessionId: string;
  userId: string;
  createdAt: Date;
}

@Injectable()
export class PublicChatService {
  private readonly logger = new Logger(PublicChatService.name);
  private readonly PUBLIC_SESSION_ID = 'public-session';
  private readonly PUBLIC_USER_ID = 'public-user';
  private readonly PUBLIC_DB_CONNECTION_ID = appConfig.publicDbConnectionId;
  private readonly MESSAGE_LIMIT = 50;

  private messages: Map<string, ChatMessage> = new Map();
  private messageCounter = 0;

  constructor(@Inject(McpClientService) private readonly mcpClientService: McpClientService) {}

  async processPublicMessage(message: string): Promise<AIChatResponse> {
    try {
      const userMsgId = (++this.messageCounter).toString();
      const userMessage: ChatMessage = {
        id: userMsgId,
        content: message,
        type: 'user',
        sessionId: this.PUBLIC_SESSION_ID,
        userId: this.PUBLIC_USER_ID,
        createdAt: new Date(),
      };

      this.messages.set(userMsgId, userMessage);

      // Generate AI response via MCP agent (same flow as ChatService)
      const mcpClient = await this.mcpClientService.initializeMcpClient();
      if (!mcpClient) {
        throw new Error('Chat agent not initialized');
      }

      const agent = await mcpClient.getAgent('chatAgent');
      this.logger.log('Agent:', agent);

      const runtimeContext = createRuntimeContext({ dbConnectionId: this.PUBLIC_DB_CONNECTION_ID });

      // Ensure the message has content
      if (!message || typeof message !== 'string' || message.trim() === '') {
        throw new Error('Message cannot be empty');
      }

      const messages = [
        {
          role: 'user' as const,
          content: message.trim(),
        },
      ];

      this.logger.log('Sending messages to agent:', JSON.stringify(messages, null, 2));

      const aiRawResponse = (await agent.generate(messages, {
        runId: this.PUBLIC_SESSION_ID,
        threadId: this.PUBLIC_SESSION_ID,
        resourceId: this.PUBLIC_USER_ID,
        runtimeContext,
      })) as Awaited<ReturnType<MastraModelOutput['getFullOutput']>>;

      const workflowResult = extractWorkflowResult(aiRawResponse);
      this.logger.log('Workflow Result:', workflowResult);
      const aiMsgId = (++this.messageCounter).toString();
      const aiMessage: ChatMessage = {
        id: aiMsgId,
        content: workflowResult.summary,
        type: 'data',
        sessionId: this.PUBLIC_SESSION_ID,
        userId: 'SYSTEM',
        createdAt: new Date(),
      };

      this.messages.set(aiMsgId, aiMessage);

      return {
        message: workflowResult.summary,
        sessionId: this.PUBLIC_SESSION_ID,
        type: 'data',
        timestamp: new Date().toISOString(),
        data: workflowResult,
      };
    } catch (error) {
      this.logger.error('Error processing public message:', error);
      throw new Error('Failed to process public message');
    }
  }

  async getPublicMessages(limit = this.MESSAGE_LIMIT) {
    const messages = Array.from(this.messages.values())
      .filter((m) => m.sessionId === this.PUBLIC_SESSION_ID)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(-limit);

    return messages;
  }
}
