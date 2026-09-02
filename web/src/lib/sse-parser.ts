import { z } from 'zod';
import { SseEvent } from '@/types/chat';

/**
 * Schema de fronteira dos eventos SSE recebidos do backend.
 *
 * A união discriminada por `type` garante que apenas eventos no protocolo
 * esperado sejam aceitos; qualquer outra forma é rejeitada.
 */
const sseEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('chunk'), content: z.string() }),
  z.object({ type: z.literal('done') }),
  z.object({ type: z.literal('error'), message: z.string() }),
]);

/**
 * Extrai e valida um evento SSE de uma linha no formato:
 *   data: {"type":"chunk","content":"..."}
 *
 * Retorna null se a linha não for um evento SSE válido.
 */
export function parseSseChunk(line: string): SseEvent | null {
  // Remove o prefixo "data: " do protocolo SSE
  const dataPrefix = 'data: ';
  const trimmed = line.trim();

  if (!trimmed.startsWith(dataPrefix)) {
    return null;
  }

  const jsonStr = trimmed.slice(dataPrefix.length);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return null;
  }

  const result = sseEventSchema.safeParse(parsed);
  return result.success ? result.data : null;
}
