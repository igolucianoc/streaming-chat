import { SseEvent } from '../../../../core';

/**
 * Formata eventos de domínio no protocolo de fio do Server-Sent Events.
 *
 * Isola a serialização da resposta: dado um SseEvent, produz a linha
 * `data: {...}\n\n` esperada pelo cliente.
 */
export class SsePresenter {
  static format(event: SseEvent): string {
    return `data: ${JSON.stringify(event)}\n\n`;
  }
}
