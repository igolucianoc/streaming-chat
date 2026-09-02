import { Inject, Injectable, Logger } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { SseEvent } from '../../../../core';
import { ITextGenerationProvider, TEXT_GENERATION_PROVIDER } from '../domain';
import { isAbortError, mapProviderError } from './map-provider-error';

/**
 * Caso de uso: transmitir a resposta gerada para uma mensagem do usuário.
 *
 * Orquestra o provedor de geração de texto e emite eventos SSE. Recebe o
 * provedor pela interface do domínio (porta), mantendo o caso de uso testável
 * e independente da implementação concreta.
 */
@Injectable()
export class StreamMessageUseCase {
  private readonly logger = new Logger(StreamMessageUseCase.name);

  constructor(
    @Inject(TEXT_GENERATION_PROVIDER)
    private readonly provider: ITextGenerationProvider,
  ) {}

  /**
   * Inicia o stream de geração de texto e retorna um Observable de eventos SSE.
   * O AbortSignal permite cancelar o stream externo (ex: cliente desconectou).
   */
  execute(message: string, signal: AbortSignal): Observable<SseEvent> {
    const subject = new Subject<SseEvent>();

    // Executa o generator de forma assíncrona e publica no subject
    void this.runStream(message, signal, subject);

    return subject.asObservable();
  }

  private async runStream(
    message: string,
    signal: AbortSignal,
    subject: Subject<SseEvent>,
  ): Promise<void> {
    try {
      for await (const token of this.provider.streamText(message, signal)) {
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
      if (isAbortError(error)) {
        this.logger.log('Stream cancelado pelo cliente.');
        subject.complete();
        return;
      }

      this.logger.error('Erro durante o stream:', error);
      subject.next({
        type: 'error',
        message: mapProviderError(error).message,
      });
      subject.complete();
    }
  }
}
