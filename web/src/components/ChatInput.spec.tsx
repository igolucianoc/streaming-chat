import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInput } from './ChatInput';

describe('ChatInput', () => {
  it('renderiza o textarea e o botão Enviar', () => {
    render(<ChatInput onSend={vi.fn()} onCancel={vi.fn()} isStreaming={false} />);
    expect(screen.getByRole('textbox', { name: /mensagem/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar mensagem/i })).toBeInTheDocument();
  });

  it('botão Enviar está desabilitado quando o input está vazio', () => {
    render(<ChatInput onSend={vi.fn()} onCancel={vi.fn()} isStreaming={false} />);
    expect(screen.getByRole('button', { name: /enviar mensagem/i })).toBeDisabled();
  });

  it('chama onSend com o conteúdo ao clicar em Enviar', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} onCancel={vi.fn()} isStreaming={false} />);

    await user.type(screen.getByRole('textbox', { name: /mensagem/i }), 'Explique RAG');
    await user.click(screen.getByRole('button', { name: /enviar mensagem/i }));

    expect(onSend).toHaveBeenCalledWith('Explique RAG');
  });

  it('chama onSend ao pressionar Enter', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} onCancel={vi.fn()} isStreaming={false} />);

    await user.type(screen.getByRole('textbox', { name: /mensagem/i }), 'Teste{Enter}');

    expect(onSend).toHaveBeenCalledWith('Teste');
  });

  it('não chama onSend ao pressionar Shift+Enter', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} onCancel={vi.fn()} isStreaming={false} />);

    const textarea = screen.getByRole('textbox', { name: /mensagem/i });
    await user.type(textarea, 'linha1');
    await user.keyboard('{Shift>}{Enter}{/Shift}');

    expect(onSend).not.toHaveBeenCalled();
  });

  it('limpa o input após o envio', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={vi.fn()} onCancel={vi.fn()} isStreaming={false} />);

    const textarea = screen.getByRole('textbox', { name: /mensagem/i });
    await user.type(textarea, 'Mensagem{Enter}');

    expect(textarea).toHaveValue('');
  });

  it('mostra botão Parar quando isStreaming é true', () => {
    render(<ChatInput onSend={vi.fn()} onCancel={vi.fn()} isStreaming={true} />);
    expect(screen.getByRole('button', { name: /cancelar geração/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /enviar mensagem/i })).not.toBeInTheDocument();
  });

  it('chama onCancel ao clicar em Parar', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<ChatInput onSend={vi.fn()} onCancel={onCancel} isStreaming={true} />);

    await user.click(screen.getByRole('button', { name: /cancelar geração/i }));

    expect(onCancel).toHaveBeenCalled();
  });

  it('não chama onSend com mensagem vazia ou só espaços', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} onCancel={vi.fn()} isStreaming={false} />);

    // Tenta enviar pressionando Enter sem digitar nada
    await user.click(screen.getByRole('textbox', { name: /mensagem/i }));
    await user.keyboard('{Enter}');

    expect(onSend).not.toHaveBeenCalled();
  });
});
