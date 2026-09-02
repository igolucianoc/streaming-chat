---
inclusion: manual
---

# /code-simplify — Simplificação de código

Ative a skill `code-simplification`.

Simplifique o código alterado recentemente (ou o escopo especificado) preservando o comportamento exato:

1. Leia o `AGENTS.md` e estude as convenções do projeto
2. Identifique o código-alvo — mudanças recentes, a menos que um escopo mais amplo seja especificado
3. Entenda o propósito do código, seus chamadores, casos de borda e cobertura de testes antes de tocá-lo
4. Procure oportunidades de simplificação:
   - Aninhamento profundo → guard clauses ou helpers extraídos
   - Funções longas → dividir por responsabilidade
   - Ternários aninhados → if/else ou switch
   - Nomes genéricos → nomes descritivos
   - Lógica duplicada → funções compartilhadas
   - Código morto → remover após confirmar
5. Aplique cada simplificação incrementalmente — rode os testes após cada mudança
6. Verifique que todos os testes passam, o build tem sucesso e o diff está limpo

Se os testes falharem após uma simplificação, reverta essa mudança e reconsidere. Use `code-review-and-quality` para revisar o resultado.
