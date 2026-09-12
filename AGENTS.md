# TokenLens

## Agent skills

### Issue tracker

Issues and specs live as markdown under `.scratch/<feature-slug>/`, with a Kanban board per feature (`Todo` / `In progress` / `Feedback` / `Done`). See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.

### Implementation context (prompt-less)

Implementers get `docs/prompt-less/IMPLEMENT.md` + the current ticket, not the grill or the full spec dump. See [ilaraca/prompt-less](https://github.com/ilaraca/prompt-less).
