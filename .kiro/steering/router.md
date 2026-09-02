---
inclusion: always
---

# Workflow router — lean

Escolha o workflow mais específico e carregue **somente** o comando correspondente.

- especificação/requisitos → `comandos/spec.md`
- planejamento/tarefas → `comandos/planning.md`
- implementação → `comandos/build.md`
- testes/bug com teste → `comandos/test.md`
- qualidade/standards → `comandos/constraints.md`
- revisão → `comandos/review.md`
- simplificação/refatoração → `comandos/code-simplify.md`
- performance web → `comandos/webperf.md`
- pré-lançamento/deploy → `comandos/ship.md`

Regras:
1. Não carregue comandos não relacionados.
2. Skills em `.kiro/skills/` são ativadas por relevância; não force skills adicionais.
3. Auditorias especializadas podem usar os sub-agents em `.kiro/agents/`.
4. Não delegue uma tarefa pequena só para seguir uma regra de delegação.
5. Se um workflow precisar de outro, carregue o segundo apenas no momento em que for necessário.
