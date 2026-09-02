import { Module } from '@nestjs/common';
import { ChatController } from './message/presentation';
import { StreamMessageUseCase } from './message/application';
import { TEXT_GENERATION_PROVIDER } from './message/domain';
import { HuggingFaceTextGenerationProvider } from './message/persistence';

@Module({
  controllers: [ChatController],
  providers: [
    StreamMessageUseCase,
    {
      provide: TEXT_GENERATION_PROVIDER,
      useClass: HuggingFaceTextGenerationProvider,
    },
  ],
})
export class ChatModule {}
