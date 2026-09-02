'use client';

import { useState } from 'react';
import { ChatWindow } from '@/components/ChatWindow';
import { ChatInput } from '@/components/ChatInput';
import { ErrorBanner } from '@/components/ErrorBanner';
import { useChat } from '@/hooks/useChat';

export default function HomePage(): JSX.Element {
  const { messages, isStreaming, error, sendMessage, cancelStream } = useChat();
  const [dismissedError, setDismissedError] = useState<string | null>(null);

  const visibleError = error !== dismissedError ? error : null;

  function handleDismissError(): void {
    setDismissedError(error);
  }

  return (
    <main className="flex flex-col h-dvh bg-gray-950">
      {/* Header */}
      <header className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center gap-2">
          {/* Indicador de status */}
          <span
            className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`}
            aria-hidden="true"
          />
          <h1 className="text-sm font-semibold text-gray-100">
            Streaming Chat
          </h1>
        </div>
        {isStreaming && (
          <span className="ml-auto text-xs text-gray-400" aria-live="polite">
            Gerando resposta...
          </span>
        )}
      </header>

      {/* Área de mensagens */}
      <ChatWindow messages={messages} />

      {/* Banner de erro */}
      {visibleError && (
        <ErrorBanner message={visibleError} onDismiss={handleDismissError} />
      )}

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        onCancel={cancelStream}
        isStreaming={isStreaming}
      />
    </main>
  );
}
