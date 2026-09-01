import { describe, it, expect } from 'vitest';
import { chatSchema } from './chat.schema';

describe('chatSchema', () => {
  it('aceita uma mensagem válida', () => {
    const result = chatSchema.safeParse({ message: 'Explique o que é RAG' });
    expect(result.success).toBe(true);
  });

  it('rejeita mensagem vazia', () => {
    const result = chatSchema.safeParse({ message: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('A mensagem não pode ser vazia.');
    }
  });

  it('rejeita mensagem somente com espaços (trim)', () => {
    const result = chatSchema.safeParse({ message: '   ' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('A mensagem não pode ser vazia.');
    }
  });

  it('rejeita mensagem acima de 4000 caracteres', () => {
    const longMessage = 'a'.repeat(4001);
    const result = chatSchema.safeParse({ message: longMessage });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'A mensagem não pode ultrapassar 4000 caracteres.',
      );
    }
  });

  it('aceita mensagem com exatamente 4000 caracteres', () => {
    const maxMessage = 'a'.repeat(4000);
    const result = chatSchema.safeParse({ message: maxMessage });
    expect(result.success).toBe(true);
  });

  it('faz trim da mensagem antes de validar', () => {
    const result = chatSchema.safeParse({ message: '  Olá  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.message).toBe('Olá');
    }
  });
});
