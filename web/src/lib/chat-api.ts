const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/**
 * Cliente da API de chat.
 *
 * Centraliza o acesso HTTP à fronteira do backend: dispara o POST /chat e
 * devolve o corpo como ReadableStream para consumo do stream SSE. Mantém o
 * mesmo tratamento de erro usado anteriormente (extrai `message` do corpo de
 * resposta não-ok, com fallback).
 */
export async function postChatMessage(
  message: string,
  signal: AbortSignal,
): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
    signal,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    const msg =
      typeof body.message === 'string' ? body.message : 'Erro ao iniciar a conversa.';
    throw new Error(msg);
  }

  if (!response.body) {
    throw new Error('Resposta sem corpo.');
  }

  return response.body;
}
