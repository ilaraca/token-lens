# Handoff TokenLens v1 (prompt-less)

Pacote curto para implementação. **Não** releia grill, spec bruta nem todos os tickets de uma vez.

## Ponteiros

| Precisa de | Leia só |
|------------|---------|
| Vocabulário | `CONTEXT.md` |
| Escopo / PoW / 3 pernas | `docs/adr/0001`, `0002`, `0003` |
| Ticket atual | `.scratch/v1-audit-pair/issues/<NN>-*.md` |
| Board | `.scratch/v1-audit-pair/board.md` |
| Spec (só se o ticket apontar) | `.scratch/v1-audit-pair/spec.md` |
| Prompt Extrator | `system-prompt-extractor.txt` |

## Contrato (sinal)

- Seam: `Auditor.run` → Audit Report **ou** erro (sem Pair).
- Ports: Extractor, Market Data, Audit Record (in-memory). Dublês nos testes; atores reais nos adapters (tickets 09/10).
- Token: On-Chain Id + Market Alias (usuário; sem lookup).
- Document: texto + hash; ilegível se &lt; N alfanuméricos (default 500) → erro, sem Extrator.
- Claim v1: só `maxSupplyAmount` (human units). Ausente → Missing Max Supply.
- Evidence: Found = valor + citação substring (NFC + whitespace; case-sensitive). Falhou verify → não alimenta o motor.
- Caveat: substring; informativo; não muda %.
- Findings: Pending Dilution `%`; Source Conflict se circulating &gt; max ou max ≤ 0; sem score/label 20%.
- Mercado falhou / id faltou → sem Report.

## Fronteira

Só tickets `Todo`/`ready-for-agent` cujo `Blocked by` está `Done`. Um agente = um ticket. Ao terminar → `Feedback` + nota; parar.

## Fora

Governança textual, score, narrative, on-chain read, Postgres obrigatório, fuzzy citation.

## Economia (fim da feature)

Quando o board estiver `Done`, rodar e colar o relatório no chat:

```bash
python3 scripts/economia-prompt-less.py
# se existir transcript do grill:
python3 scripts/economia-prompt-less.py --grill caminho/do/transcript.jsonl
```

Saída: `.scratch/v1-audit-pair/prompt-less/economia.md` (naive vs prompt-less, chars÷4).
