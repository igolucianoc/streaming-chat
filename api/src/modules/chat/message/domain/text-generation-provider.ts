/**
 * Porta (interface) do domínio para geração de texto em streaming.
 *
 * O domínio depende apenas deste contrato; implementações concretas (Hugging
 * Face, InMemory para testes) vivem na camada de persistence/infra. Não há
 * dependência de framework aqui.
 */
export interface ITextGenerationProvider {
  /**
   * Gera texto em streaming, produzindo cada token conforme o modelo responde.
   * O AbortSignal permite ao chamador cancelar a geração a qualquer momento.
   */
  streamText(message: string, signal: AbortSignal): AsyncGenerator<string, void, unknown>;
}

/**
 * Token de injeção usado pelo container de DI para resolver a implementação
 * concreta de ITextGenerationProvider (interfaces não existem em runtime).
 */
export const TEXT_GENERATION_PROVIDER = Symbol('ITextGenerationProvider');
