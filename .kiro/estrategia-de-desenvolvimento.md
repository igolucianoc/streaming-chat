# Estratégia de desenvolvimento no `.kiro/`

## 1. Estrutura do `.kiro/`

- `steering/` — regras de comportamento do agente:
  - `core.md` e `router.md` são os **únicos arquivos sempre ativos** (`inclusion: always`), curtos e sem duplicar o conteúdo dos workflows.
  - `steering/comandos/` — os 9 workflows carregados sob demanda: `spec`, `planning`, `build`, `test`, `constraints`, `review`, `code-simplify`, `webperf`, `ship`.
- `skills/` — 25 skills ativadas por relevância (descrição é o principal sinal de descoberta).
- `agents/` — 4 sub-agents especialistas: `code-reviewer`, `security-auditor`, `test-engineer`, `web-performance-auditor`.
- `references/` — checklists e padrões reutilizáveis, carregados só quando uma skill precisa: `definition-of-done`, `testing-patterns`, `security-checklist`, `performance-checklist`, `accessibility-checklist`, `observability-checklist`, `orchestration-patterns`.
- `README-TOKEN-OPTIMIZATION.md` — descreve as mudanças da v2 e como fazer o teste A/B de consumo de tokens.

## 2. Política central (`core.md`, sempre ativo)

Objetivo: entregar a tarefa com o **menor contexto e número de operações** necessários, sem sacrificar correção.

- **Contexto:** ler só o necessário, preferir trechos/ranges a arquivos inteiros, não carregar referências/workflows/skills não relacionados, não repetir investigação já concluída.
- **Execução:** seguir o workflow mais específico, usar a skill mais específica sem empilhar skills, tratar causa raiz e manter o escopo solicitado.
- **Qualidade:** não assumir requisitos ambíguos (registrar a dúvida antes de implementar), verificar apenas o necessário, **não fazer commit sem solicitação explícita**.

## 3. Roteador de workflows (`router.md`, sempre ativo)

A intenção escrita no chat é mapeada para um workflow, carregando **somente** o comando correspondente:

- Definir o que construir → `spec`
- Quebrar em tarefas → `planning`
- Implementar → `build`
- Testar / corrigir bug → `test`
- Definir a barra de qualidade → `constraints`
- Revisar antes do merge → `review`
- Simplificar / refatorar sem mudar comportamento → `code-simplify`
- Auditar performance web → `webperf`
- Pré-lançamento (decisão go/no-go) → `ship`

Regras do roteador: não carregar comandos não relacionados; skills são ativadas por relevância (não forçar skills extras); auditorias especializadas podem usar os sub-agents; não delegar tarefa pequena só por regra; carregar um segundo workflow só quando for necessário.

## 4. Fluxo Spec → Plan → Build → Verify → Review → Ship

- **Spec:** gera um `SPEC.md` com objetivo, comandos, estrutura do projeto, estilo de código, estratégia de testes e fronteiras.
- **Planning:** modo somente leitura, fatiamento **vertical** (um caminho completo por tarefa, não camadas horizontais), com critérios de aceitação e passos de verificação → salva em `tasks/plan.md` e `tasks/todo.md`.
- **Build:** implementação incremental, uma fatia por vez. Existe o modo `build auto` que roda o plano inteiro com **uma única aprovação** humana (checkpoint único), sem parar entre tarefas.

## 5. TDD de verdade (RED → GREEN → refatora)

Todo build segue o loop:

1. Escreve teste que falha para o comportamento esperado (RED)
2. Implementa o código mínimo para passar (GREEN)
3. Roda a suíte de testes completa (checagem de regressão)
4. Roda o build para verificar a compilação
5. Faz commit com mensagem descritiva
6. Marca a tarefa como concluída e para

Correção de bug segue o padrão **Prove-It**: escreve primeiro um teste que reproduz o bug (deve falhar), confirma a falha, implementa a correção e confirma que passa.

## 6. Build & qualidade

- Cada tarefa só fecha com teste passando + build compilando + commit próprio.
- Nada de `git add -A` cego: stage apenas dos arquivos que a tarefa tocou.
- **Review em 5 eixos:** correção, legibilidade, arquitetura, segurança e performance. Achados categorizados como Crítico, Importante ou Sugestão, com referências `arquivo:linha`.
- O `ship` só dá **GO** com plano de rollback obrigatório.

## 7. Isolamento de contexto = economia de tokens

Este é o pulo do gato:

- Exploração de código e leitura ampla pode ser **delegada a sub-agents** (`context-gatherer`, `general-task-execution`), devolvendo à sessão principal **apenas o resultado final**, nunca o contexto intermediário (arquivos lidos, buscas, tentativas).
- Isso mantém o histórico da sessão principal enxuto e reduz o consumo de tokens.
- **Sem obrigatoriedade cega:** a política *não* exige sub-agent para toda implementação — para tarefas pequenas roda-se na própria sessão, evitando custo extra. Sub-agent entra quando realmente reduz o contexto (exploração ampla, tarefa independente ou auditoria especializada).

As **personas especialistas** (`code-reviewer`, `security-auditor`, `test-engineer`, `web-performance-auditor`) rodam como sub-agents isolados. No `ship`, as três principais rodam **em paralelo** e a sessão principal apenas funde os relatórios em uma decisão go/no-go.

> Detalhe importante: sub-agents só funcionam em **Autopilot mode**. Em Supervised eles não rodam.

## 8. O que mudou na versão token-optimized (v2)

- **Steering sempre ativo reduzido:** os três `always` antigos (`isolamento-de-contexto.md`, `eficiencia-agente.md`, `roteador-de-workflows.md`) foram substituídos por apenas `core.md` + `router.md`, curtos e sem duplicar workflows.
- **Hook de SessionStart removido:** não injeta mais a meta-skill `using-agent-skills` no início de cada sessão; a descoberta fica a cargo do mecanismo de Skills do Kiro.
- **Meta-skill reduzida:** `using-agent-skills` foi mantida para referência, mas com descrição que evita ativação em toda sessão.
- **Descrições de skills mais específicas:** removidos gatilhos genéricos ("qualquer mudança", "qualquer lógica", "qualquer feature") que ativavam várias skills ao mesmo tempo; o conteúdo detalhado foi preservado.
- **Nada foi apagado:** nenhuma skill, referência técnica, workflow manual ou regra de negócio do projeto foi removida.
