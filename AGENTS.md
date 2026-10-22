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
    iterate, then publish with `--save <slug>`. In chat, embed it with its absolute
    path so the chat shows it; the log hook converts that to an Obsidian embed.
  - Lesson log → automatic. `.cursor/hooks/lesson-log.mjs` starts a log the moment
    you read `skills/teach/SKILL.md`, then appends each prompt and reply (converting
    `\( \)` / `\[ \]` math to `$` / `$$`). Never append to the log by hand. Move it
    into the subject folder on the first turn if it landed in `lessons/`.

## The vault

`lessons/` is an Obsidian vault that reaches all his devices through **Obsidian Sync**.
It is **gitignored**: Sync owns it, and git owns everything else. Don't commit it. On a
new machine, open an empty `lessons/` folder in Obsidian and connect it to the synced
vault. The per-subject layout and which files to read and write are in the teach
skill's "Continuity" section.

## Layout

| Path | What |
|---|---|
| `skills/`, `agents/`, `extensions/` | upstream pi config — leave as-is |
| `.claude/skills/`, `.claude/agents/` | Claude Code adapters over the above |
| `.claude/hooks/md-log.mjs` | Claude Code Stop hook: mirrors any session that used `teach` into the vault |
| `.cursor/hooks.json`, `.cursor/hooks/lesson-log.mjs` | the same for Cursor, by appending per prompt and reply |
| `tools/lesson-log/common.mjs` | shared by both hooks: find a log by session id, Obsidian-friendly conversion |
| `tools/render/render.mjs` | Mermaid/SVG → PNG (headless Chrome on Linux, macOS, Windows, `claude-rc` / `cursor-worker`) |
| `lessons/` (gitignored, Obsidian Sync) | `_learner.md`; `<subject>/` holding `_progress.md`, `workspace.md`, `concepts/`, and session logs; `viz/` for diagrams |

`tools/render/node_modules` is gitignored — after a fresh clone:
`(cd tools/render && PUPPETEER_SKIP_DOWNLOAD=1 npm install)`. Skipping the download
is intentional; the script uses the system Chrome or the image's Playwright chromium.
