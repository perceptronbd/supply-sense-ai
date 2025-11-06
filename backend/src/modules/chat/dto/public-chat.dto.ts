import { IsNotEmpty, IsString } from 'class-validator';

export class PublicChatMessageDto {
  @IsString()
  @IsNotEmpty()
  query: string;
}
