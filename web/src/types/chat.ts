/** Representa uma mensagem no histórico do chat */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** true enquanto o conteúdo ainda está sendo gerado via stream */
  streaming?: boolean;
}

/** Eventos SSE recebidos do backend */
export type SseEvent =
  | { type: 'chunk'; content: string }
  | { type: 'done' }
  | { type: 'error'; message: string };
