---
inclusion: manual
---

# /webperf — Auditoria de performance web

`webperf` mira aplicações web especificamente. Não use para bibliotecas utilitárias, CLIs ou código só de servidor sem saída para navegador.

## Determine o modo

Modo Deep — ative quando qualquer um destes estiver disponível:
- Um relatório JSON do Lighthouse (ex.: `npx lighthouse <url> --output json --output-path ./report.json`)
- Uma resposta JSON do PageSpeed Insights (inclui Lighthouse + CrUX)
- Uma resposta da API CrUX (requer as variáveis de ambiente `$CRUX_API_KEY` ou `$GOOGLE_API_KEY` — nunca fixe esses valores em arquivos de config)
- Um trace de performance do DevTools
- Uma URL ativa mais o servidor MCP chrome-devtools configurado no ambiente

Modo Quick — padrão quando nenhum dos acima está disponível. Varra o código-fonte em busca de anti-padrões estruturais e rotule cada achado como `impacto potencial`.

## Rode a auditoria

Use a ferramenta `invoke_sub_agent` para acionar o sub-agent `web-performance-auditor`. Passe explicitamente:

- Os arquivos, componentes ou diff sob revisão
- Quaisquer caminhos de artefatos (JSON do Lighthouse, PSI, CrUX, trace) ou conteúdo JSON colado
- A URL ou nome de página alvo quando conhecido
- Uma nota sobre qual modo você espera (Quick ou Deep), para que o agente sinalize entradas ausentes se Deep era pretendido

O sub-agent retorna um scorecard (preenchido apenas com valores fundamentados — marque campos não medidos como `não medido`, nunca fabrique métricas), uma lista priorizada de achados, observações positivas e recomendações proativas.

## Saída

Retorne o relatório completo da auditoria ao usuário. Nenhuma etapa de síntese ou merge é necessária — este é um comando de persona única.
