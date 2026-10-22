---
name: visualize
description: "Add a correct, minimal visual to a lesson — a diagram or geometric picture — that renders inline in the lesson log. Use when an idea is genuinely clearer as a picture: a dependency graph, system/flow, sequence, state machine, tree, comparison, or a spatial/geometric thing (coordinate geometry, number line, vectors, a plot, a physical layout). Outsources authoring+rendering to a maker subagent that verifies the image by looking at it, then you embed the returned file."
---

# Visualize (Claude Code adapter)

The real skill is [`skills/visualize/SKILL.md`](../../../skills/visualize/SKILL.md) at the repo root. **Read it in full now and follow it** — when to visualize, choosing the maker, briefing it. Only the mechanics below differ from pi.

## Invoke

Dispatch the maker with the `Agent` tool instead of `subagent(...)`:

- `Agent` with `subagent_type: "mermaid-maker"`, prompt = your minimal, concrete brief
- `Agent` with `subagent_type: "svg-maker"`, prompt = your minimal, concrete brief

It returns the same `RESULT:` block (`filename` + `path`), or `RESULT: NONE`. The PNG lands in `lessons/viz/`.

## Embed

Embed with a standard markdown image:

```
![<short alt text>](viz/<filename>)
```

The log hook rewrites any image pointing at a `viz-*.png` into Obsidian's `![[<filename>|500]]` embed. Obsidian resolves that by filename, so it renders even after the log moves into a subject folder. When writing vault notes yourself (concept notes, `_progress.md`), use the `![[…]]` form directly.
