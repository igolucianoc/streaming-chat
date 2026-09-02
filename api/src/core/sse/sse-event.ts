/**
 * Contrato dos eventos enviados ao cliente via Server-Sent Events (SSE).
 *
 * Este é um tipo transversal (core): descreve o protocolo de saída do stream,
 * independente de qual módulo de negócio o produz.
 */
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
