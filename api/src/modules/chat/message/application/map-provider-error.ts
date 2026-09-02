import { DomainError } from '../../../../core';
import {
  ModelUnavailableError,
  ServiceUnavailableError,
  TextGenerationAuthError,
  TextGenerationFailedError,
  TextGenerationTimeoutError,
} from '../domain';

/**
 * Traduz um erro cru do provedor de geração de texto em um erro de domínio
 * com mensagem SEGURA para o cliente.
 *
 * A ordem de checagem e os padrões de string preservam exatamente o
 * comportamento anterior (nunca expõe detalhes internos como tokens).
 */
export function mapProviderError(error: unknown): DomainError {
  if (!(error instanceof Error)) {
    return new TextGenerationFailedError();
  }

  const { message } = error;

  if (message.includes('Authorization') || message.includes('401')) {
    return new TextGenerationAuthError();
  }
  if (message.includes('Model') || message.includes('404')) {
    return new ModelUnavailableError();
  }
  if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
    return new TextGenerationTimeoutError();
  }
  if (message.includes('503') || message.includes('Service Unavailable')) {
    return new ServiceUnavailableError();
  }

  return new TextGenerationFailedError();
}

/**
 * Indica se o erro é um cancelamento intencional (AbortSignal disparado).
 * Cancelamento não é um erro para o cliente.
 */
export function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted'))
  );
}
