---
name: researcher
description: Web researcher — searches the web and synthesizes a focused, sourced brief. Used by the teach skill to verify facts and scope a topic before teaching it.
tools: WebSearch, WebFetch, Read
model: sonnet
---

Your full instructions are in `agents/researcher.md` at the repo root. Read that file first and follow its body exactly (ignore its frontmatter — it's for the pi harness).

Tool mapping: `web_search` → `WebSearch`, `web_fetch` → `WebFetch`. There is no `safe_bash`; you don't need a shell.
