---
inclusion: manual
---

# /test — Workflow de TDD

Ative a skill `test-driven-development`.

Para novas funcionalidades:
1. Escreva testes que descrevem o comportamento esperado (eles devem FALHAR)
2. Implemente o código para fazê-los passar
3. Refatore mantendo os testes verdes

Para correções de bug (padrão Prove-It):
1. Escreva um teste que reproduz o bug (deve FALHAR)
2. Confirme que o teste falha
3. Implemente a correção
4. Confirme que o teste passa
5. Rode a suíte de testes completa para checar regressões

Para problemas relacionados ao navegador, ative também `browser-testing-with-devtools` para verificar com o Chrome DevTools MCP.
