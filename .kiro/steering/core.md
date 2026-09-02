---
inclusion: always
---

# Core agent policy — lean

Objetivo: entregar a tarefa com o menor contexto e número de operações necessários, sem sacrificar correção.

## Contexto
- Leia somente arquivos necessários para a tarefa; prefira trechos/ranges a arquivos inteiros.
- Não carregue referências, workflows ou skills não relacionados.
- Não repita uma investigação ou verificação já concluída, salvo falha, gate final ou inconsistência concreta.
- Para exploração ampla, use sub-agent quando isso realmente reduzir o contexto da sessão principal.

## Execução
- Siga o workflow mais específico em `.kiro/steering/comandos/` quando aplicável.
- Use a skill mais específica disponível; não empilhe skills sem necessidade.
- Para tarefas pequenas, execute na sessão atual; use sub-agent para exploração ampla, tarefas independentes ou auditorias especializadas.
- Corrija causa raiz e mantenha o escopo solicitado.

## Qualidade
- Não assuma requisitos ambíguos em tarefas não triviais: registre a dúvida antes de implementar.
- Verifique apenas o necessário e evite rodar o mesmo lint/typecheck/test várias vezes sem motivo.
- Não faça commit sem solicitação explícita.
