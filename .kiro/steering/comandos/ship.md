---
inclusion: manual
---

# /ship — Checklist de pré-lançamento (fan-out para personas especialistas)

Ative a skill `shipping-and-launch`.

`ship` é um **orquestrador de fan-out**. Roda três personas especialistas em paralelo contra a mudança atual, depois funde os relatórios em uma única decisão go/no-go com plano de rollback. As personas operam de forma independente — sem estado compartilhado, sem ordenação — o que torna a execução paralela segura e útil aqui.

## Fase A — Fan-out paralelo

Acione três sub-agents concorrentemente com a ferramenta `invoke_sub_agent`. **Emita as três chamadas de sub-agent no mesmo turno para que executem em paralelo** — chamadas sequenciais anulam o propósito deste comando.

Despache cada persona pelo nome:

1. **`code-reviewer`** — Rode uma revisão de cinco eixos (correção, legibilidade, arquitetura, segurança, performance) nas mudanças staged ou commits recentes. Produza o template de revisão padrão.
2. **`security-auditor`** — Rode uma passagem de vulnerabilidade e modelagem de ameaças. Verifique OWASP Top 10, tratamento de segredos, auth/authz, CVEs de dependências. Produza o relatório de auditoria padrão.
3. **`test-engineer`** — Analise a cobertura de testes da mudança. Identifique lacunas em caminho feliz, casos de borda, caminhos de erro e cenários de concorrência. Produza a análise de cobertura padrão.

Restrições:
- Sub-agents rodam em contexto isolado e retornam apenas seu relatório para esta sessão principal.
- Não deixe uma persona delegar para outra — mantenha o fan-out plano.

**Resolução de personas.** Se você definiu seus próprios `code-reviewer`, `security-auditor` ou `test-engineer` em `.kiro/agents/`, esses têm precedência sobre as versões do pacote.

## Fase B — Merge no contexto principal

Quando os três relatórios voltarem, a sessão principal (não uma sub-persona) sintetiza:

1. **Qualidade de código** — Agregue achados Crítico/Importante do `code-reviewer` e qualquer teste, lint ou build falhando. Resolva duplicatas entre revisores.
2. **Segurança** — Promova achados Crítico/Alto do `security-auditor` a bloqueadores de lançamento. Cruze com o eixo de segurança do `code-reviewer`.
3. **Performance** — Puxe do eixo de performance do `code-reviewer`; cruze com Core Web Vitals se aplicável.
4. **Acessibilidade** — Verifique navegação por teclado, suporte a leitor de tela, contraste (não coberto pelas três personas — trate aqui diretamente, ou use o checklist de acessibilidade).
5. **Infraestrutura** — Variáveis de ambiente, migrações, monitoramento, feature flags. Verifique diretamente.
6. **Documentação** — README, ADRs, changelog. Verifique diretamente.

## Fase C — Decisão e rollback

Produza uma única saída:

```markdown
## Decisão de Ship: GO | NO-GO

### Bloqueadores (corrigir antes do ship)
- [Persona de origem: achado Crítico + arquivo:linha]

### Correções recomendadas (deveriam ser corrigidas antes do ship)
- [Persona de origem: achado Importante + arquivo:linha]

### Riscos aceitos (fazendo ship mesmo assim)
- [Risco + mitigação]

### Plano de rollback
- Condições de gatilho: [quais sinais motivariam rollback]
- Procedimento de rollback: [passos exatos]
- Objetivo de tempo de recuperação: [alvo]

### Relatórios dos especialistas (completos)
- [relatório do code-reviewer]
- [relatório do security-auditor]
- [relatório do test-engineer]
```

## Regras

1. As três personas da Fase A rodam em paralelo — nunca sequencialmente.
2. Personas não chamam umas às outras. A sessão principal funde na Fase B.
3. O plano de rollback é obrigatório antes de qualquer decisão GO.
4. Se qualquer persona retornar um achado Crítico, o veredito padrão é NO-GO a menos que o usuário aceite explicitamente o risco.
5. **Pule o fan-out apenas se tudo isto for verdade:** a mudança toca 2 arquivos ou menos, o diff tem menos de 50 linhas, e não toca auth, pagamentos, acesso a dados ou config/env. Caso contrário, faça fan-out por padrão.
