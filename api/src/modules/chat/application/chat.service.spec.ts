import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatService, SseEvent } from './chat.service';
import { HuggingFaceClient } from '../infrastructure/huggingface.client';

// Helper: cria um mock do HuggingFaceClient com um stream controlado
function makeMockClient(tokens: string[], shouldThrow?: Error): HuggingFaceClient {
  const client = {
    streamText: vi.fn(),
  } as unknown as HuggingFaceClient;

  if (shouldThrow) {
    vi.mocked(client.streamText).mockImplementation(async function* () {
      throw shouldThrow;
    });
  } else {
    vi.mocked(client.streamText).mockImplementation(async function* () {
      for (const token of tokens) {
        yield token;
      }
    });
  }

  return client;
}

// Coleta todos os eventos de um Observable em um array
function collectEvents(
  service: ChatService,
  message: string,
  signal: AbortSignal,
): Promise<SseEvent[]> {
  return new Promise((resolve, reject) => {
    const events: SseEvent[] = [];
    service.streamMessage(message, signal).subscribe({
      next: (event) => events.push(event),
      error: reject,
      complete: () => resolve(events),
    });
  });
}

describe('ChatService', () => {
  let signal: AbortSignal;

  beforeEach(() => {
    signal = new AbortController().signal;
  });

  it('emite chunks na ordem correta e finaliza com done', async () => {
    const client = makeMockClient(['Olá', ' mundo', '!']);
    const service = new ChatService(client);

    const events = await collectEvents(service, 'teste', signal);

    expect(events).toEqual([
      { type: 'chunk', content: 'Olá' },
      { type: 'chunk', content: ' mundo' },
      { type: 'chunk', content: '!' },
      { type: 'done' },
    ]);
  });

  it('envia o chunk com o token correto para o client HF', async () => {
    const client = makeMockClient(['resposta']);
    const service = new ChatService(client);

    await collectEvents(service, 'minha pergunta', signal);

    expect(vi.mocked(client.streamText)).toHaveBeenCalledWith('minha pergunta', signal);
  });

  it('emite evento de erro com mensagem segura quando o client lança exceção', async () => {
    const error = new Error('Service Unavailable 503');
    const client = makeMockClient([], error);
    const service = new ChatService(client);

    const events = await collectEvents(service, 'teste', signal);

    expect(events).toContainEqual({
      type: 'error',
      message: 'O serviço de IA está temporariamente indisponível.',
    });
  });

  it('emite erro de autenticação para erros 401', async () => {
    const error = new Error('Authorization failed 401');
    const client = makeMockClient([], error);
    const service = new ChatService(client);

    const events = await collectEvents(service, 'teste', signal);

    expect(events).toContainEqual({
      type: 'error',
      message: 'Erro de autenticação com o serviço de IA.',
    });
  });

  it('emite erro genérico para erros desconhecidos', async () => {
    const error = new Error('unknown internal error xyz');
    const client = makeMockClient([], error);
    const service = new ChatService(client);

    const events = await collectEvents(service, 'teste', signal);

    expect(events).toContainEqual({
      type: 'error',
      message: 'Não foi possível processar a solicitação.',
    });
  });

  it('não expõe a mensagem interna do erro ao cliente', async () => {
    const error = new Error('HF_TOKEN=hf_secret123 Authorization failed');
    const client = makeMockClient([], error);
    const service = new ChatService(client);

    const events = await collectEvents(service, 'teste', signal);

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
    const client = makeMockClient([], abortError);
    const service = new ChatService(client);

    const events = await collectEvents(service, 'teste', signal);

    expect(events.find((e) => e.type === 'error')).toBeUndefined();
    expect(events.find((e) => e.type === 'done')).toBeUndefined();
  });

  it('demonstra fluxo completo: chunk1 → chunk2 → chunk3 → done', async () => {
    const client = makeMockClient(['chunk1', 'chunk2', 'chunk3']);
    const service = new ChatService(client);

    const events = await collectEvents(service, 'fluxo completo', signal);

    // Garante a ordem exata dos eventos
    expect(events[0]).toEqual({ type: 'chunk', content: 'chunk1' });
    expect(events[1]).toEqual({ type: 'chunk', content: 'chunk2' });
    expect(events[2]).toEqual({ type: 'chunk', content: 'chunk3' });
    expect(events[3]).toEqual({ type: 'done' });
    expect(events).toHaveLength(4);
  });
});
