import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export enum MessageType {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
  ERROR = 'error',
}

export enum MessageContentType {
  TEXT = 'text',
  DATA = 'data',
  CHART = 'chart',
  TABLE = 'table',
}

export class CreateChatSessionDto {
  @ApiProperty({ description: 'Session title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: 'Initial context or description', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;
}

export class SendMessageDto {
  @ApiProperty({ description: 'Session ID' })
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ description: 'Message content' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  content: string;

  @ApiProperty({
    description: 'Message type',
    enum: MessageType,
    default: MessageType.USER,
  })
  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType = MessageType.USER;

  @ApiProperty({ description: 'Parent message ID for threading', required: false })
  @IsUUID()
  @IsOptional()
  parentMessageId?: string;
}

export class ChatMessageDto {
  @ApiProperty({ description: 'Message ID' })
  id: string;

  @ApiProperty({ description: 'Session ID' })
  sessionId: string;

  @ApiProperty({ description: 'Message content' })
  content: string;

  @ApiProperty({ description: 'Message type', enum: MessageType })
  type: MessageType;

  @ApiProperty({ description: 'Content type', enum: MessageContentType })
  contentType: MessageContentType;
  @ApiProperty({ description: 'Message metadata', required: false })
  metadata?: Record<string, unknown>;

  @ApiProperty({ description: 'Parent message ID', required: false })
  parentMessageId?: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Update timestamp' })
  updatedAt: Date;
}

export class ChatSessionDto {
  @ApiProperty({ description: 'Session ID' })
  id: string;

  @ApiProperty({ description: 'Session title' })
  title: string;

  @ApiProperty({ description: 'Session description', required: false })
  description?: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Last activity timestamp' })
  lastActivityAt: Date;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Update timestamp' })
  updatedAt: Date;

  @ApiProperty({ description: 'Recent messages', type: [ChatMessageDto], required: false })
  messages?: ChatMessageDto[];
}

export class ChatQueryDto {
  @ApiProperty({ description: 'User query' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  query: string;

  @ApiProperty({ description: 'Session ID for context' })
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ description: 'Include database query capability', default: true })
  @IsOptional()
  includeDatabaseQuery?: boolean = true;

  @ApiProperty({ description: 'Query context or filters', required: false })
  @IsOptional()
  context?: Record<string, unknown>;

  @ApiProperty({ description: 'Database connection ID', required: true })
  @IsString({ message: 'Database connection ID must be a string' })
  @IsNotEmpty({ message: 'Database connection ID is required' })
  dbConnectionId: string;
}
