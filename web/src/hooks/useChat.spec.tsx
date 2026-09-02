import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChat } from './useChat';

// Codifica uma sequência de eventos SSE em um ReadableStream
function makeSSEStream(events: object[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const event of events) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      }
      controller.close();
    },
  });
}

describe('useChat', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('estado inicial: sem mensagens, sem erro, não streaming', () => {
    const { result } = renderHook(() => useChat());
    expect(result.current.messages).toEqual([]);
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('adiciona mensagem do usuário e placeholder da IA ao enviar', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: makeSSEStream([{ type: 'done' }]),
    });

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('Olá');
    });

    expect(result.current.messages[0].role).toBe('user');
    expect(result.current.messages[0].content).toBe('Olá');
  });

  it('acumula chunks progressivamente na mensagem da IA', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: makeSSEStream([
        { type: 'chunk', content: 'RAG' },
        { type: 'chunk', content: ' é' },
        { type: 'chunk', content: ' uma técnica' },
        { type: 'done' },
      ]),
    });

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('Explique RAG');
    });

    const assistantMessage = result.current.messages.find((m) => m.role === 'assistant');
    expect(assistantMessage?.content).toBe('RAG é uma técnica');
    expect(assistantMessage?.streaming).toBe(false);
  });

  it('define streaming como false após evento done', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: makeSSEStream([{ type: 'done' }]),
    });

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('teste');
    });

    expect(result.current.isStreaming).toBe(false);
  });

  it('exibe erro quando o servidor retorna evento error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: makeSSEStream([{ type: 'error', message: 'Serviço indisponível' }]),
    });

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('teste');
    });

    expect(result.current.error).toBe('Serviço indisponível');
  });

  it('exibe erro quando o fetch falha com resposta não-ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ message: 'A mensagem não pode ser vazia.' }),
    });

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('teste');
    });

    expect(result.current.error).toBe('A mensagem não pode ser vazia.');
  });

  it('cancela o stream ao chamar cancelStream', async () => {
    let abortCalled = false;
    const controller = {
      signal: { aborted: false } as AbortSignal,
      abort: vi.fn(() => { abortCalled = true; }),
    };

    vi.spyOn(global, 'AbortController' as never).mockImplementation(
      () => controller as unknown as AbortController,
    );

    // Stream que nunca termina
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: new ReadableStream({ start() {} }),
    });

    const { result } = renderHook(() => useChat());

    // Inicia o stream (sem await — queremos cancelar durante)
    act(() => {
      void result.current.sendMessage('teste');
    });

    await waitFor(() => {
      expect(result.current.isStreaming).toBe(true);
    });

    act(() => {
      result.current.cancelStream();
    });

    expect(abortCalled).toBe(true);
    expect(result.current.isStreaming).toBe(false);
  });

  it('não envia mensagem quando isStreaming é true', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      body: new ReadableStream({ start() {} }),
    });
    global.fetch = fetchMock;

    const { result } = renderHook(() => useChat());

    // Primeira mensagem — inicia stream
    act(() => {
      void result.current.sendMessage('primeira');
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(true));

    // Tenta enviar segunda — deve ser ignorada
    await act(async () => {
      await result.current.sendMessage('segunda');
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
