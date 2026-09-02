import { ITextGenerationProvider } from '../../domain';
import { InMemoryTextGenerationProvider } from '../../persistence';

/**
 * Cria um provider em memória que emite os tokens informados.
 */
export function makeInMemoryProvider(tokens: string[]): ITextGenerationProvider {
  return new InMemoryTextGenerationProvider(tokens);
}

/**
 * Cria um provider em memória que lança o erro informado ao ser consumido.
 */
export function makeFailingProvider(error: Error): ITextGenerationProvider {
  return new InMemoryTextGenerationProvider([], error);
}
