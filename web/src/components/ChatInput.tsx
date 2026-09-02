'use client';

import { useState, useRef, KeyboardEvent } from 'react';

interface Props {
  onSend: (message: string) => void;
  onCancel: () => void;
  isStreaming: boolean;
}

/**
 * Input de mensagem com suporte a envio por Enter e cancelamento de stream.
 * Shift+Enter insere uma nova linha sem enviar.
 */
export function ChatInput({ onSend, onCancel, isStreaming }: Props): JSX.Element {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSend(): void {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setValue('');
    // Reseta a altura do textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInput(): void {
    const textarea = textareaRef.current;
    if (!textarea) return;
    // Ajusta a altura automaticamente conforme o conteúdo
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }

  return (
    <div className="flex items-end gap-2 p-4 border-t border-gray-700 bg-gray-900">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        placeholder="Digite sua pergunta... (Enter para enviar, Shift+Enter para nova linha)"
        disabled={false}
        rows={1}
        className="flex-1 resize-none rounded-xl bg-gray-800 text-gray-100 placeholder-gray-500 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 min-h-[48px] max-h-[160px]"
        aria-label="Mensagem"
      />

      {isStreaming ? (
        <button
          onClick={onCancel}
          type="button"
          className="shrink-0 rounded-xl bg-red-600 hover:bg-red-700 text-white px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[48px]"
          aria-label="Cancelar geração"
        >
          Parar
        </button>
      ) : (
        <button
          onClick={handleSend}
          type="button"
          disabled={!value.trim()}
          className="shrink-0 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px]"
          aria-label="Enviar mensagem"
        >
          Enviar
        </button>
      )}
    </div>
  );
}
