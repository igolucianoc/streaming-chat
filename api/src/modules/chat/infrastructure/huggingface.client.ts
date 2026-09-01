import { Injectable, Logger } from '@nestjs/common';
import { HfInference } from '@huggingface/inference';

export interface StreamChunk {
  token: string;
  done: boolean;
}

export interface HuggingFaceClientConfig {
  token: string;
  model: string;
}

/**
 * Encapsula a comunicação com a API do Hugging Face.
 * Responsável exclusivamente por produzir um AsyncGenerator de chunks de texto.
 */
@Injectable()
export class HuggingFaceClient {
  private readonly logger = new Logger(HuggingFaceClient.name);
  private readonly client: HfInference;
  private readonly model: string;

  constructor() {
    const token = process.env.HF_TOKEN;
    const model = process.env.HF_MODEL;

    if (!token) {
      throw new Error('HF_TOKEN não está definido nas variáveis de ambiente.');
    }
    if (!model) {
      throw new Error('HF_MODEL não está definido nas variáveis de ambiente.');
    }

    this.client = new HfInference(token);
    this.model = model;
  }

  /**
   * Inicia uma geração de texto em modo streaming.
   * Retorna um AsyncGenerator que produz cada token gerado pelo modelo.
   * O AbortSignal permite ao chamador cancelar o stream a qualquer momento.
   */
  async *streamText(message: string, signal: AbortSignal): AsyncGenerator<string, void, unknown> {
    this.logger.log(`Iniciando stream para o modelo: ${this.model}`);

    const stream = this.client.chatCompletionStream(
      {
        model: this.model,
        messages: [
          {
            role: 'system',
            content:
              'Você é um assistente útil. Ao usar listas numeradas ou com marcadores, ' +
              'escreva o número/marcador e o conteúdo na mesma linha. ' +
              'Exemplo correto: "1. **Título**: descrição". ' +
              'Nunca coloque o número sozinho em uma linha separada do conteúdo.',
          },
          { role: 'user', content: message },
        ],
        max_tokens: 512,
      },
      { signal },
    );

    for await (const response of stream) {
      const token = response.choices[0]?.delta?.content;

      if (token) {
        yield token;
      }
    }

    this.logger.log('Stream concluído.');
  }
}
