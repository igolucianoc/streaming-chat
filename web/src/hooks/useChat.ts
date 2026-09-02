import { useState, useRef, useCallback } from 'react';
import { ChatMessage, SseEvent } from '@/types/chat';
import { parseSseChunk } from '@/lib/sse-parser';
import { postChatMessage } from '@/lib/chat-api';

interface UseChatReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  cancelStream: () => void;
}

/**
 * Gerencia o estado do chat e o ciclo de vida do stream SSE.
 *
 * Fluxo:
 *   sendMessage → POST /chat → ReadableStream → parseSseChunk → SseEvent → estado React
 */
export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(async (content: string): Promise<void> => {
    if (!content.trim() || isStreaming) return;

    setError(null);

    // Adiciona a mensagem do usuário ao histórico
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
    };

    // Prepara o placeholder da resposta da IA
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      streaming: true,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const body = await postChatMessage(content.trim(), controller.signal);

      await processStream(body, assistantMessage.id);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Cancelamento intencional — atualiza o placeholder para indicar que foi interrompido
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id
              ? { ...m, streaming: false, content: m.content || '[Cancelado]' }
              : m,
          ),
        );
        return;
      }

      const message =
        err instanceof Error ? err.message : 'Erro inesperado ao conectar.';
      setError(message);
      // Remove o placeholder vazio em caso de erro na conexão
      setMessages((prev) => prev.filter((m) => m.id !== assistantMessage.id));
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }

    /**
     * Lê o ReadableStream linha a linha e processa os eventos SSE.
     * Acumula o conteúdo da mensagem da IA progressivamente.
     */
    async function processStream(
      body: ReadableStream<Uint8Array>,
      assistantId: string,
    ): Promise<void> {
      const reader = body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // SSE usa \n\n como separador de eventos
          const lines = buffer.split('\n\n');

          // O último elemento pode ser um evento incompleto — manter no buffer
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.trim()) continue;

            const event = parseSseChunk(line);
            if (!event) continue;

            handleSseEvent(event, assistantId);
          }
        }
      } finally {
        reader.releaseLock();
      }
    }

    function handleSseEvent(event: SseEvent, assistantId: string): void {
      switch (event.type) {
        case 'chunk':
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: m.content + event.content }
                : m,
            ),
          );
          break;

        case 'done':
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, streaming: false } : m,
            ),
          );
          break;

        case 'error':
          setError(event.message);
          setMessages((prev) => prev.filter((m) => m.id !== assistantId));
          break;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming]);

  return { messages, isStreaming, error, sendMessage, cancelStream };
}
