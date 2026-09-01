import { Module } from '@nestjs/common';
import { ChatController } from './presentation/chat.controller';
import { ChatService } from './application/chat.service';
import { HuggingFaceClient } from './infrastructure/huggingface.client';

@Module({
  controllers: [ChatController],
  providers: [ChatService, HuggingFaceClient],
})
export class ChatModule {}
