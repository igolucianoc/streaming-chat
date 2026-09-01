import {
  Controller,
  Post,
  Body,
  Res,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
  Get,
} from '@nestjs/common';
import { Response } from 'express';
import { ChatService, SseEvent } from '../application/chat.service';
import { chatSchema } from '../schemas/chat.schema';

/**
 * Expõe o endpoint POST /chat que retorna uma resposta SSE.
 *
 * O NestJS possui suporte nativo a SSE via @Sse() + Observable, mas esse
 * mecanismo não permite usar POST com body. Por isso gerenciamos o SSE
 * manualmente via Response do Express, mantendo total controle sobre o
 * protocolo e o ciclo de vida da conexão.
 */
@Controller()
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  health(): { status: string } {
    return { status: 'ok' };
  }

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async chat(@Body() body: unknown, @Res() res: Response): Promise<void> {
    // Valida a entrada com Zod
    const parsed = chatSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Requisição inválida.';
      throw new BadRequestException(message);
    }

    const { message } = parsed.data;

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

    const stream = this.chatService.streamMessage(message, controller.signal);

    stream.subscribe({
      next: (event: SseEvent) => {
        this.sendSseEvent(res, event);
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

  private sendSseEvent(res: Response, event: SseEvent): void {
    const data = JSON.stringify(event);
    res.write(`data: ${data}\n\n`);
  }
}
