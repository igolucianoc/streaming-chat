'use client';

import { useEffect, useRef } from 'react';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import { ChatMessage } from './ChatMessage';

interface Props {
  messages: ChatMessageType[];
}

/**
 * Área de rolagem que exibe o histórico de mensagens.
 * Rola automaticamente para o final quando novas mensagens chegam.
 */
export function ChatWindow({ messages }: Props): JSX.Element {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-gray-500 text-sm text-center">
          Faça uma pergunta para começar a conversa.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  );
}
