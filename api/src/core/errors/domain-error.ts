/**
 * Erro base para falhas de regra de negócio.
 *
 * Erros de domínio herdam desta classe para poderem ser distinguidos de erros
 * de infraestrutura/framework. Não depende de nenhum framework.
 */
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
