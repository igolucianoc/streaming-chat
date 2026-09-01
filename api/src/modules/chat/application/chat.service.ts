import { Injectable, Logger } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { HuggingFaceClient } from '../infrastructure/huggingface.client';

export type SseEventType = 'chunk' | 'done' | 'error';

export interface SseChunkEvent {
  type: 'chunk';
  content: string;
}

export interface SseDoneEvent {
  type: 'done';
}

export interface SseErrorEvent {
  type: 'error';
  message: string;
}

export type SseEvent = SseChunkEvent | SseDoneEvent | SseErrorEvent;

/**
 * Orquestra a geração de texto e a emissão de eventos SSE.
 * Recebe o client do HF como dependência, tornando o serviço testável.
 */
@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly huggingFaceClient: HuggingFaceClient) {}

  /**
   * Inicia o stream de geração de texto e retorna um Observable de eventos SSE.
   * O AbortSignal permite cancelar o stream externo (ex: cliente desconectou).
   */
  streamMessage(message: string, signal: AbortSignal): Observable<SseEvent> {
    const subject = new Subject<SseEvent>();

    // Executa o generator de forma assíncrona e publica no subject
    this.runStream(message, signal, subject);

    return subject.asObservable();
  }

  private async runStream(
    message: string,
    signal: AbortSignal,
    subject: Subject<SseEvent>,
  ): Promise<void> {
    try {
      for await (const token of this.huggingFaceClient.streamText(message, signal)) {
        // Se o AbortSignal foi disparado, interrompe sem emitir erro
        if (signal.aborted) {
          break;
        }

        subject.next({ type: 'chunk', content: token });
      }

      subject.next({ type: 'done' });
      subject.complete();
    } catch (error: unknown) {
      // AbortError é cancelamento intencional — não é um erro para o cliente
      if (this.isAbortError(error)) {
        this.logger.log('Stream cancelado pelo cliente.');
        subject.complete();
        return;
      }

      this.logger.error('Erro durante o stream:', error);
      subject.next({
        type: 'error',
        message: this.extractSafeErrorMessage(error),
      });
      subject.complete();
    }
  }

  private isAbortError(error: unknown): boolean {
    return (
      error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted'))
    );
  }

  /**
   * Extrai uma mensagem de erro segura para enviar ao cliente.
   * Nunca expõe detalhes internos como tokens ou stack traces.
   */
  private extractSafeErrorMessage(error: unknown): string {
    if (!(error instanceof Error)) {
      return 'Erro inesperado ao processar a solicitação.';
    }

    // Erros conhecidos do Hugging Face que podem ser comunicados ao usuário
    if (error.message.includes('Authorization') || error.message.includes('401')) {
      return 'Erro de autenticação com o serviço de IA.';
    }
    if (error.message.includes('Model') || error.message.includes('404')) {
      return 'Modelo não encontrado ou indisponível.';
    }
    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      return 'Tempo de resposta esgotado. Tente novamente.';
    }
    if (error.message.includes('503') || error.message.includes('Service Unavailable')) {
      return 'O serviço de IA está temporariamente indisponível.';
    }

    return 'Não foi possível processar a solicitação.';
  }
}
