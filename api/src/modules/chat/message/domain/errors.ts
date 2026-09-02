import { DomainError } from '../../../../core';

/**
 * Erros de domínio da geração de mensagens.
 *
 * Cada erro carrega uma mensagem SEGURA para exibir ao cliente — nunca expõe
 * detalhes internos (tokens, stack traces, mensagens cruas do provedor).
 * As mensagens preservam exatamente o texto usado no comportamento anterior.
 */
export class TextGenerationAuthError extends DomainError {
  constructor() {
    super('Erro de autenticação com o serviço de IA.');
  }
}

export class ModelUnavailableError extends DomainError {
  constructor() {
    super('Modelo não encontrado ou indisponível.');
  }
}

export class TextGenerationTimeoutError extends DomainError {
  constructor() {
    super('Tempo de resposta esgotado. Tente novamente.');
  }
}

export class ServiceUnavailableError extends DomainError {
  constructor() {
    super('O serviço de IA está temporariamente indisponível.');
  }
}

export class TextGenerationFailedError extends DomainError {
  constructor() {
    super('Não foi possível processar a solicitação.');
  }
}
