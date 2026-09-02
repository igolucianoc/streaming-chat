import { BadRequestException, PipeTransform } from '@nestjs/common';
import { ZodSchema } from 'zod';

/**
 * Pipe transversal que valida dados de fronteira HTTP com um schema Zod.
 *
 * Em caso de falha, lança BadRequestException com a primeira mensagem de erro,
 * preservando o mesmo contrato de erro (HTTP 400 + { message }) usado antes.
 */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const message = result.error.issues[0]?.message ?? 'Requisição inválida.';
      throw new BadRequestException(message);
    }

    return result.data;
  }
}
