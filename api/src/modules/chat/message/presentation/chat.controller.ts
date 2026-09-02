import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { SseEvent } from '../../../../core';
import { ZodValidationPipe } from '../../../../infra/http/zod-validation.pipe';
import { StreamMessageUseCase } from '../application';
import { ChatInput, chatSchema } from './schemas/chat.schema';
import { SsePresenter } from './sse.presenter';

/**
 * Expõe o endpoint POST /chat que retorna uma resposta SSE.
 *
 * O NestJS possui suporte nativo a SSE via @Sse() + Observable, mas esse
 * mecanismo não permite usar POST com body. Por isso gerenciamos o SSE
 * manualmente via Response do Express, mantendo total controle sobre o
 * protocolo e o ciclo de vida da conexão.
 *
 * A validação de entrada é feita pelo ZodValidationPipe transversal, que
 * lança BadRequestException (HTTP 400) com a primeira mensagem do schema.
 */
@Controller()
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly streamMessageUseCase: StreamMessageUseCase) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  health(): { status: string } {
    return { status: 'ok' };
  }

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async chat(
    @Body(new ZodValidationPipe(chatSchema)) body: ChatInput,
    @Res() res: Response,
  ): Promise<void> {
    const { message } = body;

    // Configura os headers SSE antes de iniciar o stream
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // desativa buffer do nginx
    res.flushHeaders();

    // AbortController para cancelar o stream se o cliente desconectar
    const controller = new AbortController();

    res.on('close', () => {
      this.logger.log('Cliente desconectou. Cancelando stream.');
      controller.abort();
    });

    const stream = this.streamMessageUseCase.execute(message, controller.signal);

    stream.subscribe({
      next: (event: SseEvent) => {
        res.write(SsePresenter.format(event));
      },
      error: (err: unknown) => {
        this.logger.error('Erro no Observable do stream:', err);
        res.end();
      },
      complete: () => {
        res.end();
      },
    });
  }
}
