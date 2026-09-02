import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatMessage } from './ChatMessage';
import type { ChatMessage as ChatMessageType } from '@/types/chat';

function makeMessage(overrides: Partial<ChatMessageType>): ChatMessageType {
  return {
    id: '1',
    role: 'user',
    content: 'Olá',
    ...overrides,
  };
}

describe('ChatMessage', () => {
  it('renderiza mensagem do usuário com label correto', () => {
    render(<ChatMessage message={makeMessage({ role: 'user', content: 'Oi' })} />);
    expect(screen.getByText('Você')).toBeInTheDocument();
    expect(screen.getByText('Oi')).toBeInTheDocument();
  });

  it('renderiza mensagem da IA com label correto', () => {
    render(
      <ChatMessage
        message={makeMessage({ role: 'assistant', content: 'Olá! Como posso ajudar?' })}
      />,
    );
    expect(screen.getByText('IA')).toBeInTheDocument();
    expect(screen.getByText('Olá! Como posso ajudar?')).toBeInTheDocument();
  });

  it('mostra "Pensando..." quando streaming está ativo e conteúdo é vazio', () => {
    render(
      <ChatMessage
        message={makeMessage({ role: 'assistant', content: '', streaming: true })}
      />,
    );
    expect(screen.getByText('Pensando...')).toBeInTheDocument();
  });

  it('não mostra "Pensando..." quando há conteúdo parcial', () => {
    render(
      <ChatMessage
        message={makeMessage({ role: 'assistant', content: 'RAG é', streaming: true })}
      />,
    );
    expect(screen.queryByText('Pensando...')).not.toBeInTheDocument();
    expect(screen.getByText(/RAG é/)).toBeInTheDocument();
  });

  it('não mostra cursor piscante quando streaming é false', () => {
    const { container } = render(
      <ChatMessage
        message={makeMessage({ role: 'assistant', content: 'Resposta completa', streaming: false })}
      />,
    );
    // O cursor piscante tem aria-hidden="true" e classe animate-pulse
    expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument();
  });
});
