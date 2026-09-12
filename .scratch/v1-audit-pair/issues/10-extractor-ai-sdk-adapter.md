# 10: Adapter real Extrator (AI SDK)

**What to build:** Implementar o ator real do Extrator com Vercel AI SDK (`generateObject`) e o system prompt do Extrator, devolvendo só `maxSupplyAmount` + Evidence no contrato da porta — encaixável no Auditor; integração pode ser skip sem API key.

**Blocked by:** 03 — Extrator (dublê) + Missing Max Supply

**Triage:** ready-for-agent

**Kanban:** Done

- [x] Adapter real satisfaz o mesmo contrato da porta do Extrator
- [x] Saída passa por schema Zod antes do domínio
- [x] Prompt alinhado ao Extrator (não se intitula Auditor; sem narrative/governança)
- [x] Teste de integração documentado como opcional/skip sem credencial

## Feedback

Ao terminar a implementação: mover Kanban para `Feedback`, preencher a nota abaixo, atualizar `board.md` e **parar** até um humano marcar `Done`.

## Implementation note

Pacote `src/packages/extractor-ai-sdk/`: `createAiSdkExtractor(deps)` implementa `ExtractorPort.extract` via Vercel AI SDK `generateObject`. System prompt = `system-prompt-extractor.txt` (lido do root, ou `deps.systemPrompt` nos testes). Schema do LLM em PT (`valor` / `citacao_exata` / `ressalvas`), mapeado para Claim inglês e validado com `ExtractorClaimSchema`. `schemaName` é `maxSupplyAmount` (não Auditor). Falha de `generateObject` ou Zod → Absent `{ found: false, value: null, citation: null, caveats: null }` para o Auditor não crashar. Provider injetável (`deps.generateObject` / `deps.model`); default `openai("gpt-4o-mini")`.

**Como ligar:** `run(input, { extractor: createAiSdkExtractor({ model: openai("gpt-4o-mini") }), market })` — ou `createAiSdkExtractor()` se a key estiver no ambiente.

**Como verificar:** `npm test` e `npm run typecheck`. Integração live: `it.skipIf(!process.env.OPENAI_API_KEY)` (com key, timeout 60s).
