---
inclusion: manual
---

# /constraints — Barra de qualidade do projeto

Ative a skill `constraint-driven-development`.

Comportamento padrão sem argumentos: configurar as constraints deste repositório.

1. **Detecte primeiro.** Leia `package.json` / `pyproject.toml` / `go.mod`, o test runner, configs de lint existentes, a saída de cobertura atual, workflows de CI e o harness de agente em uso. Reporte o que encontrou em duas linhas. Nunca peça algo que você pode ler.

2. **Entreviste, no máximo quatro perguntas.** Uma por vez, cada uma com seu melhor palpite e um padrão utilizável para que "não sei" ainda produza uma config funcional:
   - Quais dimensões além do piso (cobertura, segurança, performance, acessibilidade, arquitetura)
   - Bloquear ou avisar quando uma verificação falha no meio da tarefa
   - Números-alvo, ou medir os valores de hoje e mantê-los
   - Verificação mais lenta tolerada antes de devolver o trabalho

3. **Escreva `CONSTRAINTS.md`** na raiz do repositório com uma seção Piso, números aplicados, métricas apenas-medidas com valores de hoje, e uma tabela de exceções com donos e datas de expiração. Todo número precisa de um motivo declarado.

4. **Instale o que cada dimensão escolhida precisa.** Uma dimensão com número e sem ferramenta por trás é uma aspiração. Use a ferramenta de fato: Semgrep para varredura de código, gitleaks (sempre `--redact`) para segredos, osv-scanner para dependências, axe-core para acessibilidade, Lighthouse para web vitals, size-limit para bundles, dependency-cruiser para fronteiras, Stryker para qualidade de asserções. Registre o comando exato ao lado de cada regra no `CONSTRAINTS.md`. Adicione os comandos ao `package.json` como check:fast / check:task / check:full.

5. **Posicione cada verificação por custo.** Tipos, lint e segredos no loop de edição (segundos). Testes relacionados e cobertura de linhas alteradas ao fim da tarefa (menos de 90s). O resto na revisão ou em CI. Escopo das verificações no diff, não no repositório inteiro.

6. **Aponte o agente para isso.** Adicione uma linha ao `AGENTS.md` e `CLAUDE.md` dizendo aos agentes para ler o `CONSTRAINTS.md` e nunca enfraquecê-lo para fazer uma mudança passar.

7. **Verifique.** Rode as constraints contra a branch atual. Se algo falhar com o que o usuário discorda, corrija a constraint agora em vez de deixar um portão que as pessoas aprenderão a ignorar.

Sub-comandos:
- `constraints check` — rode as constraints atuais contra esta branch e reporte
- `constraints guard` — inspecione o diff em busca de barra enfraquecida: thresholds reduzidos, testes pulados ou deletados, novos comentários de supressão, stubs inacabados, novas exceções
- `constraints ratchet` — registre os valores medidos de hoje como o piso que não pode cair
