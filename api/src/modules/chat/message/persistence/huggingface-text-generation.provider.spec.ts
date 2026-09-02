import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// O mock precisa ser declarado antes dos imports que dependem do módulo
vi.mock('@huggingface/inference', () => ({
  HfInference: vi.fn().mockImplementation(() => ({
    chatCompletionStream: vi.fn(),
  })),
}));

import { HfInference } from '@huggingface/inference';
import { HuggingFaceTextGenerationProvider } from './huggingface-text-generation.provider';

// Helper para criar um AsyncGenerator a partir de um array de respostas
async function* makeStream(
  responses: Array<{ choices: Array<{ delta: { content?: string } }> }>,
): AsyncGenerator<{ choices: Array<{ delta: { content?: string } }> }> {
  for (const response of responses) {
    yield response;
  }
}

// Monta uma resposta no formato de chat completion streaming
function chunk(content?: string): { choices: Array<{ delta: { content?: string } }> } {
  return { choices: [{ delta: { content } }] };
}

describe('HuggingFaceTextGenerationProvider', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      HF_TOKEN: 'test-token',
      HF_MODEL: 'test-model',
    };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('lança erro quando HF_TOKEN não está definido', () => {
    delete process.env.HF_TOKEN;
    expect(() => new HuggingFaceTextGenerationProvider()).toThrow(
      'HF_TOKEN não está definido nas variáveis de ambiente.',
    );
  });

  it('lança erro quando HF_MODEL não está definido', () => {
    delete process.env.HF_MODEL;
    expect(() => new HuggingFaceTextGenerationProvider()).toThrow(
      'HF_MODEL não está definido nas variáveis de ambiente.',
    );
  });

  it('produz tokens do stream corretamente', async () => {
    const mockStream = makeStream([chunk('Olá'), chunk(' mundo'), chunk('!')]);

    const hfInstance = { chatCompletionStream: vi.fn().mockReturnValue(mockStream) };
    vi.mocked(HfInference).mockImplementation(() => hfInstance as never);

    const provider = new HuggingFaceTextGenerationProvider();
    const signal = new AbortController().signal;
    const tokens: string[] = [];

    for await (const token of provider.streamText('Olá', signal)) {
      tokens.push(token);
    }

    expect(tokens).toEqual(['Olá', ' mundo', '!']);
  });

  it('ignora deltas sem conteúdo', async () => {
    const mockStream = makeStream([chunk('Olá'), chunk(undefined), chunk(' mundo')]);

    const hfInstance = { chatCompletionStream: vi.fn().mockReturnValue(mockStream) };
    vi.mocked(HfInference).mockImplementation(() => hfInstance as never);

    const provider = new HuggingFaceTextGenerationProvider();
    const signal = new AbortController().signal;
    const tokens: string[] = [];

    for await (const token of provider.streamText('teste', signal)) {
      tokens.push(token);
    }

    expect(tokens).toEqual(['Olá', ' mundo']);
  });

  it('passa o modelo, a mensagem e o AbortSignal para o cliente HF', async () => {
    const mockStream = makeStream([]);
    const streamSpy = vi.fn().mockReturnValue(mockStream);
    const hfInstance = { chatCompletionStream: streamSpy };
    vi.mocked(HfInference).mockImplementation(() => hfInstance as never);

    const provider = new HuggingFaceTextGenerationProvider();
    const controller = new AbortController();
    const { signal } = controller;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _token of provider.streamText('teste', signal)) {
      // consumir o generator
    }

    expect(streamSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'test-model',
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'user', content: 'teste' }),
        ]),
      }),
      expect.objectContaining({ signal }),
    );
  });
});
