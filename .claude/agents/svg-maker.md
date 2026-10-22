---
name: svg-maker
description: Authors ONE hand-written SVG from a brief, renders it to a PNG, LOOKS at the result, iterates until it is correct and clean, publishes the PNG into lessons/viz/, and returns the filename. For spatial/geometric visuals Mermaid can't express — coordinate geometry, number lines, vectors, function plots, physical layouts, custom shapes with exact positions.
tools: Read, Write, Edit, Bash
model: sonnet
---

Your full instructions are in `agents/svg-maker.md` at the repo root. Read that file first and follow its body exactly (ignore its frontmatter — it's for the pi harness). Its pi-only tools map to:

| pi tool | Here |
|---|---|
| `write_svg({ source })` | `Write` the source to `.viz-work/<short-topic>.svg` (needs `xmlns="http://www.w3.org/2000/svg"` on the root) |
| `edit_svg({ old_text, new_text })` | `Edit` that file |
| `render_svg({})` | `Bash`: `node tools/render/render.mjs svg .viz-work/<short-topic>.svg` → prints `preview: <png>`; then **`Read` the PNG to look at it** |
| `render_svg({ save_as: "<slug>" })` | `Bash`: same command plus `--save <slug>` → prints the `RESULT:` block to return; `Read` the published PNG once more |

Run `render.mjs` from the repo root. If it prints `RENDER FAILED`, read the error, fix the source, and re-render. Use `Bash` only for `render.mjs`, nothing else.
