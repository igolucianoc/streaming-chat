import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { of, Subject } from 'rxjs';
import { ChatController } from './chat.controller';
import { StreamMessageUseCase } from '../application';
import { ZodValidationPipe } from '../../../../infra/http/zod-validation.pipe';
import { chatSchema } from './schemas/chat.schema';
import type { SseEvent } from '../../../../core';

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
  let useCase: StreamMessageUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        {
          provide: StreamMessageUseCase,
          useValue: {
            execute: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
    useCase = module.get<StreamMessageUseCase>(StreamMessageUseCase);
  });

  describe('GET /health', () => {
    it('retorna { status: "ok" }', () => {
      expect(controller.health()).toEqual({ status: 'ok' });
    });
  });

  // A validação de entrada agora vive no ZodValidationPipe transversal.
  // O contrato observável (HTTP 400 + primeira mensagem do schema) é o mesmo.
  describe('validação de entrada (ZodValidationPipe)', () => {
    const pipe = new ZodValidationPipe(chatSchema);

    it('rejeita mensagem vazia com a mensagem do schema', () => {
      expect(() => pipe.transform({ message: '' })).toThrow('A mensagem não pode ser vazia.');
    });

    it('rejeita mensagem somente com espaços', () => {
      expect(() => pipe.transform({ message: '   ' })).toThrow('A mensagem não pode ser vazia.');
    });

    it('rejeita body sem campo message', () => {
      expect(() => pipe.transform({})).toThrow();
    });

    it('aceita e normaliza (trim) mensagem válida', () => {
      expect(pipe.transform({ message: '  Olá  ' })).toEqual({ message: 'Olá' });
    });
  });

  describe('POST /chat', () => {
    it('configura headers SSE corretamente para requisição válida', async () => {
      const res = makeMockResponse();
      vi.mocked(useCase.execute).mockReturnValue(of({ type: 'done' }));

      await controller.chat({ message: 'Olá' }, res as never);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
      expect(res.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
      expect(res.flushHeaders).toHaveBeenCalled();
    });

    it('escreve eventos SSE no formato correto', async () => {
      const res = makeMockResponse();
      const events: SseEvent[] = [{ type: 'chunk', content: 'Olá' }, { type: 'done' }];
      vi.mocked(useCase.execute).mockReturnValue(of(...events));

      await controller.chat({ message: 'Olá' }, res as never);

      expect(res.write).toHaveBeenCalledWith(
        `data: ${JSON.stringify({ type: 'chunk', content: 'Olá' })}\n\n`,
      );
      expect(res.write).toHaveBeenCalledWith(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    });

    it('encerra a resposta ao completar o stream', async () => {
      const res = makeMockResponse();
      vi.mocked(useCase.execute).mockReturnValue(of({ type: 'done' }));

      await controller.chat({ message: 'Olá' }, res as never);

      expect(res.end).toHaveBeenCalled();
    });

    it('registra o evento close para cancelar o stream quando cliente desconecta', async () => {
      const res = makeMockResponse();
      const subject = new Subject<SseEvent>();
      vi.mocked(useCase.execute).mockReturnValue(subject.asObservable());

      // Não await — o stream fica pendente
      void controller.chat({ message: 'Olá' }, res as never);

      // Pequeno delay para garantir que o subscribe foi chamado
      await new Promise((r) => setTimeout(r, 0));

      expect(res.on).toHaveBeenCalledWith('close', expect.any(Function));
    });

    it('passa a mensagem correta para o use case', async () => {
      const res = makeMockResponse();
      vi.mocked(useCase.execute).mockReturnValue(of({ type: 'done' }));

      await controller.chat({ message: 'Explique RAG' }, res as never);

      expect(useCase.execute).toHaveBeenCalledWith('Explique RAG', expect.any(AbortSignal));
    });
  });
});
