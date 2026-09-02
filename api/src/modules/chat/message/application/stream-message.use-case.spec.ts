import { describe, it, expect, beforeEach } from 'vitest';
import { SseEvent } from '../../../../core';
import { InMemoryTextGenerationProvider } from '../persistence';
import { StreamMessageUseCase } from './stream-message.use-case';

// Coleta todos os eventos de um Observable em um array
function collectEvents(
  useCase: StreamMessageUseCase,
  message: string,
  signal: AbortSignal,
): Promise<SseEvent[]> {
  return new Promise((resolve, reject) => {
    const events: SseEvent[] = [];
    useCase.execute(message, signal).subscribe({
      next: (event) => events.push(event),
      error: reject,
      complete: () => resolve(events),
    });
  });
}

describe('StreamMessageUseCase', () => {
  let signal: AbortSignal;

  beforeEach(() => {
    signal = new AbortController().signal;
  });

  it('emite chunks na ordem correta e finaliza com done', async () => {
    const provider = new InMemoryTextGenerationProvider(['Olá', ' mundo', '!']);
    const useCase = new StreamMessageUseCase(provider);

    const events = await collectEvents(useCase, 'teste', signal);

    expect(events).toEqual([
      { type: 'chunk', content: 'Olá' },
      { type: 'chunk', content: ' mundo' },
      { type: 'chunk', content: '!' },
      { type: 'done' },
    ]);
  });

  it('encaminha a mensagem e o signal para o provider', async () => {
    const calls: Array<{ message: string; signal: AbortSignal }> = [];
    const provider = {
      async *streamText(message: string, sig: AbortSignal): AsyncGenerator<string, void, unknown> {
        calls.push({ message, signal: sig });
        yield 'resposta';
      },
    };
    const useCase = new StreamMessageUseCase(provider);

    await collectEvents(useCase, 'minha pergunta', signal);

    expect(calls).toHaveLength(1);
    expect(calls[0].message).toBe('minha pergunta');
    expect(calls[0].signal).toBe(signal);
  });

  it('emite evento de erro com mensagem segura quando o provider lança exceção', async () => {
    const provider = new InMemoryTextGenerationProvider([], new Error('Service Unavailable 503'));
    const useCase = new StreamMessageUseCase(provider);

    const events = await collectEvents(useCase, 'teste', signal);

    expect(events).toContainEqual({
      type: 'error',
      message: 'O serviço de IA está temporariamente indisponível.',
    });
  });

  it('emite erro de autenticação para erros 401', async () => {
    const provider = new InMemoryTextGenerationProvider([], new Error('Authorization failed 401'));
    const useCase = new StreamMessageUseCase(provider);

    const events = await collectEvents(useCase, 'teste', signal);

    expect(events).toContainEqual({
      type: 'error',
      message: 'Erro de autenticação com o serviço de IA.',
    });
  });

  it('emite erro genérico para erros desconhecidos', async () => {
    const provider = new InMemoryTextGenerationProvider(
      [],
      new Error('unknown internal error xyz'),
    );
    const useCase = new StreamMessageUseCase(provider);

    const events = await collectEvents(useCase, 'teste', signal);

    expect(events).toContainEqual({
      type: 'error',
      message: 'Não foi possível processar a solicitação.',
    });
  });

  it('não expõe a mensagem interna do erro ao cliente', async () => {
    const provider = new InMemoryTextGenerationProvider(
      [],
      new Error('HF_TOKEN=hf_secret123 Authorization failed'),
    );
    const useCase = new StreamMessageUseCase(provider);

    const events = await collectEvents(useCase, 'teste', signal);

    const errorEvent = events.find((e) => e.type === 'error');
    expect(errorEvent).toBeDefined();
    if (errorEvent && errorEvent.type === 'error') {
      expect(errorEvent.message).not.toContain('hf_secret123');
      expect(errorEvent.message).not.toContain('HF_TOKEN');
    }
  });

  it('completa sem emitir erro quando o stream é cancelado via AbortError', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    const provider = new InMemoryTextGenerationProvider([], abortError);
    const useCase = new StreamMessageUseCase(provider);

    const events = await collectEvents(useCase, 'teste', signal);

    expect(events.find((e) => e.type === 'error')).toBeUndefined();
    expect(events.find((e) => e.type === 'done')).toBeUndefined();
  });

  it('demonstra fluxo completo: chunk1 → chunk2 → chunk3 → done', async () => {
    const provider = new InMemoryTextGenerationProvider(['chunk1', 'chunk2', 'chunk3']);
    const useCase = new StreamMessageUseCase(provider);

    const events = await collectEvents(useCase, 'fluxo completo', signal);

    expect(events[0]).toEqual({ type: 'chunk', content: 'chunk1' });
    expect(events[1]).toEqual({ type: 'chunk', content: 'chunk2' });
    expect(events[2]).toEqual({ type: 'chunk', content: 'chunk3' });
    expect(events[3]).toEqual({ type: 'done' });
    expect(events).toHaveLength(4);
  });
});
