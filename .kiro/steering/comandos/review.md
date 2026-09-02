---
inclusion: manual
---

# /review — Revisão de código em cinco eixos

Ative a skill `code-review-and-quality`.

Revise as mudanças atuais (staged ou commits recentes) em todos os cinco eixos:

1. **Correção** — Corresponde à spec? Casos de borda tratados? Testes adequados?
2. **Legibilidade** — Nomes claros? Lógica direta? Bem organizado?
3. **Arquitetura** — Segue os padrões existentes? Fronteiras limpas? Nível de abstração certo?
4. **Segurança** — Entrada validada? Segredos seguros? Auth verificada? (use a skill `security-and-hardening`)
5. **Performance** — Sem consultas N+1? Sem operações ilimitadas? (use a skill `performance-optimization`)

Categorize os achados como Crítico, Importante ou Sugestão.
Produza uma revisão estruturada com referências específicas de `arquivo:linha` e recomendações de correção.
