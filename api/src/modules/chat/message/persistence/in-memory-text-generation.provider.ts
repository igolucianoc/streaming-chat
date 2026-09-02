import { ITextGenerationProvider } from '../domain';

/**
 * Implementação em memória de ITextGenerationProvider para testes.
 *
 * Emite uma sequência pré-configurada de tokens, ou lança um erro configurado,
 * sem tocar em nenhum recurso externo. Respeita o AbortSignal.
 */
export class InMemoryTextGenerationProvider implements ITextGenerationProvider {
  constructor(
    private readonly tokens: string[] = [],
    private readonly errorToThrow?: Error,
  ) {}

  async *streamText(_message: string, signal: AbortSignal): AsyncGenerator<string, void, unknown> {
    if (this.errorToThrow) {
      throw this.errorToThrow;
    }

    for (const token of this.tokens) {
      if (signal.aborted) {
        return;
      }
      yield token;
    }
  }
}
