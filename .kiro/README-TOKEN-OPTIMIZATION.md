# .kiro Token Optimization — v2

Esta versão foi criada para testar redução de consumo de contexto sem remover as capacidades das skills existentes.

## Mudanças principais

1. **Steering sempre ativo reduzido**
   - Removidos os três arquivos `always` anteriores:
     - `steering/isolamento-de-contexto.md`
     - `steering/eficiencia-agente.md`
     - `steering/roteador-de-workflows.md`
   - Criados apenas:
     - `steering/core.md`
     - `steering/router.md`
   - Ambos são curtos e não repetem o conteúdo dos workflows.

2. **Hook de SessionStart removido**
   - O hook anterior injetava a meta-skill `using-agent-skills` no início de cada sessão.
   - Nesta versão a descoberta fica a cargo do mecanismo de Skills do Kiro.

3. **Meta-skill reduzida e desativada como gatilho amplo**
   - `skills/using-agent-skills/SKILL.md` foi mantida para referência, mas sua descrição foi alterada para evitar ativação em toda sessão.
   - A tabela/lifecycle extensa foi removida do conteúdo porque duplicava o roteamento do steering.

4. **Descrições das Skills tornadas mais específicas**
   - As descrições são o principal sinal de descoberta/ativação.
   - Foram reduzidos gatilhos genéricos como “qualquer mudança”, “qualquer lógica” e “qualquer feature”, que tendem a ativar várias skills ao mesmo tempo.
   - O conteúdo detalhado das skills foi preservado.

5. **Referências preservadas**
   - `references/` não foi removido.
   - Elas continuam disponíveis quando uma skill realmente precisar delas.
   - Exemplos grandes da `idea-refine` também foram preservados.

6. **Sub-agents preservados**
   - Os quatro agentes continuam disponíveis.
   - A política global não obriga sub-agent para toda implementação; isso evita custo extra em tarefas pequenas.

## O que NÃO foi feito

- Nenhuma skill foi apagada.
- Nenhuma referência técnica foi apagada.
- Nenhum workflow manual foi removido.
- Nenhuma regra de negócio do projeto foi alterada.

## Como testar

Faça o teste A/B com uma tarefa equivalente em duas sessões novas:

### A — configuração original
Use seu `.kiro.zip` original.

### B — esta versão
Substitua `.kiro` pela pasta desta versão.

Em cada sessão execute:

```text
/context show
```

E compare:

- quantidade de arquivos adicionados ao contexto;
- tokens/percentual ocupado por steering;
- quantidade de skills ativadas;
- quantidade de sub-agents invocados;
- tokens consumidos para uma tarefa equivalente.

### Tarefas sugeridas

1. Pergunta simples sobre um arquivo.
2. Alteração pequena em um único arquivo.
3. Feature que envolve vários arquivos.
4. Bug que exige investigação.
5. Review de código.

O resultado esperado é principalmente uma redução nas tarefas 1–3, sem perda relevante de qualidade nas tarefas 4–5.
