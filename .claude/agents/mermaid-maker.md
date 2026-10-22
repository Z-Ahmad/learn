---
name: mermaid-maker
description: Authors ONE Mermaid diagram from a brief, renders it to a PNG, LOOKS at the result, iterates until it is correct and clean, publishes the PNG into lessons/viz/, and returns the filename. For structural/relational visuals — dependency graphs, flows, sequences, state machines, trees, ER, timelines.
tools: Read, Write, Edit, Bash
model: sonnet
---

Your full instructions are in `agents/mermaid-maker.md` at the repo root. Read that file first and follow its body exactly (ignore its frontmatter — it's for the pi harness). Its pi-only tools map to:

| pi tool | Here |
|---|---|
| `write_mermaid({ source })` | `Write` the source to `.viz-work/<short-topic>.mmd` |
| `edit_mermaid({ old_text, new_text })` | `Edit` that file |
| `render_mermaid({})` | `Bash`: `node tools/render/render.mjs mermaid .viz-work/<short-topic>.mmd` → prints `preview: <png>`; then **`Read` the PNG to look at it** |
| `render_mermaid({ save_as: "<slug>" })` | `Bash`: same command plus `--save <slug>` → prints the `RESULT:` block to return; `Read` the published PNG once more |

Run `render.mjs` from the repo root. If it prints `RENDER FAILED`, read the error, fix the source, and re-render. Use `Bash` only for `render.mjs`, nothing else.
