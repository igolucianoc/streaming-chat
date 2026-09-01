import { z } from 'zod';

export const chatSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'A mensagem não pode ser vazia.')
    .max(4000, 'A mensagem não pode ultrapassar 4000 caracteres.'),
});

export type ChatInput = z.infer<typeof chatSchema>;
