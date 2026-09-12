#!/usr/bin/env python3
"""Estima tokens naive vs prompt-less (heurística chars/4, como ilaraca/prompt-less)."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FEATURE = ROOT / ".scratch" / "v1-audit-pair"
HANDOFF = ROOT / "docs" / "prompt-less" / "IMPLEMENT.md"
OUT = FEATURE / "prompt-less" / "economia.md"

# Overhead típico do artigo: system longo + tools + histórico colado a cada agente
NAIVE_SYSTEM = 2500
NAIVE_TOOLS = 1800
PROMPTLESS_SYSTEM = 400
PROMPTLESS_TOOLS = 200


def tokens_of(path: Path) -> int:
    if not path.is_file():
        return 0
    return max(1, len(path.read_text(encoding="utf-8", errors="replace")) // 4)


def sum_tokens(paths: list[Path]) -> int:
    return sum(tokens_of(p) for p in paths)


def collect() -> dict:
    issues = sorted((FEATURE / "issues").glob("*.md"))
    adrs = sorted((ROOT / "docs" / "adr").glob("*.md"))
    grill_candidates = [
        ROOT / "system-prompt-auditor.txt",  # legado, pode não existir
    ]
    return {
        "handoff": tokens_of(HANDOFF),
        "spec": tokens_of(FEATURE / "spec.md"),
        "board": tokens_of(FEATURE / "board.md"),
        "context": tokens_of(ROOT / "CONTEXT.md"),
        "extractor_prompt": tokens_of(ROOT / "system-prompt-extractor.txt"),
        "adrs": sum_tokens(adrs),
        "all_tickets": sum_tokens(issues),
        "ticket_count": len(issues),
        "avg_ticket": (sum_tokens(issues) // len(issues)) if issues else 0,
        "regras": tokens_of(FEATURE / "prompt-less" / "regras.yaml"),
        "engenharia": tokens_of(FEATURE / "prompt-less" / "engenharia.yaml"),
        "issues": issues,
    }


def estimate(c: dict, runs: int, grill_tokens: int) -> dict:
    naive_corpus = (
        c["spec"]
        + c["context"]
        + c["adrs"]
        + c["all_tickets"]
        + c["board"]
        + c["extractor_prompt"]
        + c["handoff"]
        + grill_tokens
        + NAIVE_SYSTEM
        + NAIVE_TOOLS
    )
    pl_corpus = (
        c["handoff"]
        + c["avg_ticket"]
        + c["context"]
        + PROMPTLESS_SYSTEM
        + PROMPTLESS_TOOLS
    )
    naive_total = naive_corpus * runs
    pl_total = pl_corpus * runs
    saved = max(0, naive_total - pl_total)
    pct = (saved / naive_total * 100) if naive_total else 0
    return {
        "runs": runs,
        "grill_tokens": grill_tokens,
        "naive_per_run": naive_corpus,
        "promptless_per_run": pl_corpus,
        "naive_total": naive_total,
        "promptless_total": pl_total,
        "saved": saved,
        "saved_pct": round(pct, 1),
    }


def render(c: dict, e: dict) -> str:
    return f"""# Economia de tokens — v1-audit-pair

Heurística Prompt-less: `tokens ≈ chars / 4`. Não é tokenizer oficial nem billing da Cursor.

## Por execução de agente (1 ticket)

| Pacote | Tokens est. |
|--------|-------------|
| Naive (spec + CONTEXT + ADRs + 10 tickets + board + prompt + grill + system/tools longos) | {e["naive_per_run"]:,} |
| Prompt-less (IMPLEMENT.md + 1 ticket + CONTEXT + system/tools curtos) | {e["promptless_per_run"]:,} |

Grill/histórico colado no naive: **{e["grill_tokens"]:,}** tokens (0 se não medido).

## {e["runs"]} runs (1 por ticket)

| | Tokens est. |
|--|-------------|
| Sem prompt-less (naive × runs) | {e["naive_total"]:,} |
| Com prompt-less | {e["promptless_total"]:,} |
| Economia | {e["saved"]:,} (**{e["saved_pct"]}%**) |

## Corpus medido agora

| Artefato | Tokens |
|----------|--------|
| Handoff IMPLEMENT.md | {c["handoff"]:,} |
| spec.md | {c["spec"]:,} |
| CONTEXT.md | {c["context"]:,} |
| ADRs | {c["adrs"]:,} |
| Todos os tickets | {c["all_tickets"]:,} |
| Ticket médio | {c["avg_ticket"]:,} |
| Board | {c["board"]:,} |
| system-prompt-extractor.txt | {c["extractor_prompt"]:,} |
"""


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--runs", type=int, default=None, help="default: número de tickets")
    p.add_argument("--grill", type=Path, help="arquivo do transcript do grill (soma no naive)")
    p.add_argument("--json", action="store_true")
    args = p.parse_args()
    c = collect()
    runs = args.runs if args.runs is not None else max(1, c["ticket_count"])
    grill = tokens_of(args.grill) if args.grill else 0
    e = estimate(c, runs, grill)
    md = render(c, e)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(md, encoding="utf-8")
    if args.json:
        print(json.dumps({**{k: v for k, v in c.items() if k != "issues"}, **e}, indent=2))
    else:
        print(md)
        print(f"\nGravado em {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
