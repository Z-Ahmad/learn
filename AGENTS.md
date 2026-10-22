# Agent instructions — learn

A personal AI learning system. Originally a [pi](https://github.com/earendil-works/pi)
config (`skills/`, `agents/`, `extensions/`); `.claude/` and `tools/render/` port it
to Claude Code and Cursor. The originals stay the single source of truth — the
ports are thin adapters that read them, so edit `skills/teach/SKILL.md` to change
how teaching works, not the adapters.

## Whenever the user asks to learn or understand something

Follow the `teach` skill: read [`skills/teach/SKILL.md`](skills/teach/SKILL.md) in full
and apply it. For diagrams, [`skills/visualize/SKILL.md`](skills/visualize/SKILL.md).

- **Claude Code:** the `teach` / `visualize` skills and the `researcher`,
  `mermaid-maker`, `svg-maker` subagents in `.claude/` handle the tool mapping.
- **Cursor** (no pi tools, no AskUserQuestion):
  - `quiz` → ask in chat as a lettered list (A–D), wait for the reply, then grade
    with ✓/✗, the correct answer, and the explanation. Follow the skill's option
    construction procedure; never reveal the answer before they reply.
  - `ask_user_question` → ask in chat and wait.
  - `researcher` subagent → do the web research yourself before stating anything
    you're unsure of.
  - Visuals → do the maker's job inline, following `agents/mermaid-maker.md` or
    `agents/svg-maker.md`: write the source under `.viz-work/`, render with
    `node tools/render/render.mjs <mermaid|svg> <file>`, **look at the PNG**,
    iterate, then publish with `--save <slug>` and embed `![alt](lessons/viz/<filename>)`.

## Layout

| Path | What |
|---|---|
| `skills/`, `agents/`, `extensions/` | upstream pi config — leave as-is |
| `.claude/skills/`, `.claude/agents/` | Claude Code adapters over the above |
| `.claude/hooks/md-log.mjs` | Stop hook: mirrors any session that used `teach` to `lessons/*.md` |
| `tools/render/render.mjs` | Mermaid/SVG → PNG (headless Chrome; works on host and in `claude-rc` / `cursor-worker`) |
| `lessons/` | lesson logs; `lessons/viz/` holds published diagrams |

`tools/render/node_modules` is gitignored — after a fresh clone:
`(cd tools/render && PUPPETEER_SKIP_DOWNLOAD=1 npm install)`. Skipping the download
is intentional; the script uses the system Chrome or the image's Playwright chromium.
