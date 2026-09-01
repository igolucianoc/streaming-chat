import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// O mock precisa ser declarado antes dos imports que dependem do módulo
vi.mock('@huggingface/inference', () => ({
  HfInference: vi.fn().mockImplementation(() => ({
    textGenerationStream: vi.fn(),
  })),
}));

import { HfInference } from '@huggingface/inference';
import { HuggingFaceClient } from './huggingface.client';

// Helper para criar um AsyncGenerator a partir de um array de respostas
async function* makeStream(
  responses: Array<{ token: { text: string; special: boolean } }>,
): AsyncGenerator<{ token: { text: string; special: boolean } }> {
  for (const response of responses) {
    yield response;
  }
}

describe('HuggingFaceClient', () => {
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
    expect(() => new HuggingFaceClient()).toThrow(
      'HF_TOKEN não está definido nas variáveis de ambiente.',
    );
  });

  it('lança erro quando HF_MODEL não está definido', () => {
    delete process.env.HF_MODEL;
    expect(() => new HuggingFaceClient()).toThrow(
      'HF_MODEL não está definido nas variáveis de ambiente.',
    );
  });

  it('produz tokens do stream corretamente', async () => {
    const mockStream = makeStream([
      { token: { text: 'Olá', special: false } },
      { token: { text: ' mundo', special: false } },
      { token: { text: '!', special: false } },
    ]);

    const hfInstance = { textGenerationStream: vi.fn().mockReturnValue(mockStream) };
    vi.mocked(HfInference).mockImplementation(() => hfInstance as never);

    const client = new HuggingFaceClient();
    const signal = new AbortController().signal;
    const tokens: string[] = [];

    for await (const token of client.streamText('Olá', signal)) {
      tokens.push(token);
    }

    expect(tokens).toEqual(['Olá', ' mundo', '!']);
  });

  it('ignora tokens especiais', async () => {
    const mockStream = makeStream([
      { token: { text: 'Olá', special: false } },
      { token: { text: '</s>', special: true } },
      { token: { text: ' mundo', special: false } },
    ]);

    const hfInstance = { textGenerationStream: vi.fn().mockReturnValue(mockStream) };
    vi.mocked(HfInference).mockImplementation(() => hfInstance as never);

    const client = new HuggingFaceClient();
    const signal = new AbortController().signal;
    const tokens: string[] = [];

    for await (const token of client.streamText('teste', signal)) {
      tokens.push(token);
    }

    expect(tokens).toEqual(['Olá', ' mundo']);
    expect(tokens).not.toContain('</s>');
  });

  it('passa o AbortSignal para o cliente HF', async () => {
    const mockStream = makeStream([]);
    const streamSpy = vi.fn().mockReturnValue(mockStream);
    const hfInstance = { textGenerationStream: streamSpy };
    vi.mocked(HfInference).mockImplementation(() => hfInstance as never);

    const client = new HuggingFaceClient();
    const controller = new AbortController();
    const { signal } = controller;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _token of client.streamText('teste', signal)) {
      // consumir o generator
    }

    expect(streamSpy).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'test-model', inputs: 'teste' }),
      expect.objectContaining({ signal }),
    );
  });
});
