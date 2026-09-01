import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from '../application/chat.service';
import { of, Subject } from 'rxjs';
import type { SseEvent } from '../application/chat.service';

// Mock mínimo do objeto Response do Express
function makeMockResponse(): {
  setHeader: ReturnType<typeof vi.fn>;
  flushHeaders: ReturnType<typeof vi.fn>;
  write: ReturnType<typeof vi.fn>;
  end: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
} {
  return {
    setHeader: vi.fn(),
    flushHeaders: vi.fn(),
    write: vi.fn(),
    end: vi.fn(),
    on: vi.fn(),
  };
}

describe('ChatController', () => {
  let controller: ChatController;
  let chatService: ChatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        {
          provide: ChatService,
          useValue: {
            streamMessage: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
    chatService = module.get<ChatService>(ChatService);
  });

  describe('GET /health', () => {
    it('retorna { status: "ok" }', () => {
      expect(controller.health()).toEqual({ status: 'ok' });
    });
  });

  describe('POST /chat', () => {
    it('lança BadRequestException para mensagem vazia', async () => {
      const res = makeMockResponse();
      await expect(controller.chat({ message: '' }, res as never)).rejects.toThrow(
        'A mensagem não pode ser vazia.',
      );
    });

    it('lança BadRequestException para mensagem somente com espaços', async () => {
      const res = makeMockResponse();
      await expect(controller.chat({ message: '   ' }, res as never)).rejects.toThrow(
        'A mensagem não pode ser vazia.',
      );
    });

    it('lança BadRequestException quando body não tem campo message', async () => {
      const res = makeMockResponse();
      await expect(controller.chat({}, res as never)).rejects.toThrow();
    });

    it('configura headers SSE corretamente para requisição válida', async () => {
      const res = makeMockResponse();
      vi.mocked(chatService.streamMessage).mockReturnValue(of({ type: 'done' }));

      await controller.chat({ message: 'Olá' }, res as never);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
      expect(res.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
      expect(res.flushHeaders).toHaveBeenCalled();
    });

    it('escreve eventos SSE no formato correto', async () => {
      const res = makeMockResponse();
      const events: SseEvent[] = [{ type: 'chunk', content: 'Olá' }, { type: 'done' }];
      vi.mocked(chatService.streamMessage).mockReturnValue(of(...events));

      await controller.chat({ message: 'Olá' }, res as never);

      expect(res.write).toHaveBeenCalledWith(
        `data: ${JSON.stringify({ type: 'chunk', content: 'Olá' })}\n\n`,
      );
      expect(res.write).toHaveBeenCalledWith(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    });

    it('encerra a resposta ao completar o stream', async () => {
      const res = makeMockResponse();
      vi.mocked(chatService.streamMessage).mockReturnValue(of({ type: 'done' }));

      await controller.chat({ message: 'Olá' }, res as never);

      expect(res.end).toHaveBeenCalled();
    });

    it('registra o evento close para cancelar o stream quando cliente desconecta', async () => {
      const res = makeMockResponse();
      const subject = new Subject<SseEvent>();
      vi.mocked(chatService.streamMessage).mockReturnValue(subject.asObservable());

      // Não await — o stream fica pendente
      void controller.chat({ message: 'Olá' }, res as never);

      // Pequeno delay para garantir que o subscribe foi chamado
      await new Promise((r) => setTimeout(r, 0));

      expect(res.on).toHaveBeenCalledWith('close', expect.any(Function));
    });

    it('passa a mensagem correta para o ChatService', async () => {
      const res = makeMockResponse();
      vi.mocked(chatService.streamMessage).mockReturnValue(of({ type: 'done' }));

      await controller.chat({ message: 'Explique RAG' }, res as never);

      expect(chatService.streamMessage).toHaveBeenCalledWith(
        'Explique RAG',
        expect.any(AbortSignal),
      );
    });
  });
});
