---
inclusion: manual
---

# /build — Implementação incremental

Ative a skill `incremental-implementation` junto com `test-driven-development`.

## Modos

- `build` — implemente a próxima tarefa pendente e pare (cuidadoso, uma fatia por vez).
- `build auto` — gere o plano se necessário, obtenha uma única aprovação, então implemente todas as tarefas sem parar entre elas.

Os argumentos selecionam o modo. Trate `auto` (canônico) ou `all` como modo autônomo; qualquer outra coisa (ou vazio) é o modo padrão de tarefa única. Nota: o modo autônomo não é mais rápido por tarefa — roda o mesmo loop orientado a testes — apenas remove o passo humano entre tarefas.

## Padrão: uma tarefa

Escolha a próxima tarefa pendente do plano. Depois:

1. Leia os critérios de aceitação da tarefa
2. Carregue o contexto relevante (código existente, padrões, tipos)
3. Escreva um teste que falha para o comportamento esperado (RED)
4. Implemente o código mínimo para passar no teste (GREEN)
5. Rode a suíte de testes completa para checar regressões
6. Rode o build para verificar a compilação
7. Faça commit com uma mensagem descritiva
8. Marque a tarefa como concluída e pare

## Autônomo: o plano inteiro (`build auto`)

Use quando já existe uma spec e você quer colapsar plano + build em uma única execução. Remove o passo manual entre tarefas — não a verificação. Cada tarefa ainda ganha um teste passando e seu próprio commit.

1. Exija uma spec. Procure apenas em caminhos conhecidos: `SPEC.md` na raiz, `docs/SPEC.md`, ou um arquivo em `spec/`. Um README ou doc arbitrário NÃO conta. Se não existir, pare e diga ao usuário para rodar `#spec` primeiro — não invente requisitos.
2. Estabeleça uma baseline limpa. Rode `git status --porcelain`. Se houver mudanças não commitadas fora dos artefatos de planejamento esperados (`SPEC.md`, `docs/SPEC.md`, `spec/*`, `tasks/plan.md`, `tasks/todo.md`), pare e peça ao usuário para commitar, dar stash ou confirmar como tratá-las.
3. Planeje se necessário. Se não houver `tasks/plan.md`, ative a skill `planning-and-task-breakdown` para gerar um.
4. Checkpoint único. Apresente o plano completo e aguarde um afirmativo inequívoco (ex.: "aprovar", "vai", "sim"). Trate respostas hesitantes ("parece razoável", "acho que sim") como NÃO aprovado. Este é o único portão humano — após a aprovação, rode autonomamente. Se você gerou `tasks/plan.md`, faça commit dele como um único commit preparatório agora.
5. Execute cada tarefa em ordem de dependência. Para cada tarefa, rode o loop padrão completo acima (RED → GREEN → regressão → build → commit → concluir). Faça stage apenas dos arquivos que a tarefa tocou mais a atualização de status — nunca `git add -A` cegamente — e um commit por tarefa.
6. Pare e pergunte ao usuário (não force) quando:
   - um teste não puder passar ou o build quebrar sem correção óbvia → siga a skill `debugging-and-error-recovery`
   - a spec for ambígua, ou uma tarefa exigir uma decisão que a spec não cobre
   - a tarefa for de alto risco ou irreversível — mudanças de auth/permissão, migrações destrutivas, pagamentos, deleções, deploys, qualquer coisa com segredos, ou algo que não dê para desfazer com `git revert` → siga a skill `doubt-driven-development` e obtenha aprovação explícita antes de continuar
7. Resuma no final: tarefas concluídas, testes adicionados, commits feitos, e qualquer coisa pulada, sinalizada ou deixada para o usuário.

Se qualquer passo falhar, siga a skill `debugging-and-error-recovery`.
