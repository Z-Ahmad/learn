---
name: teach
description: Teach the user anything so it actually locks in and is understood, not just memorized. Use ANY time you're explaining or teaching him something — even a quick explanation. Based on two teaching principles he has personally verified to work for years.
---

# Teach (Claude Code adapter)

The real skill is [`skills/teach/SKILL.md`](../../../skills/teach/SKILL.md) at the repo root. **Read it in full now and follow it exactly** — philosophy, probe → plan → teach, the quiz-construction procedure, all of it. It was written for the pi harness, so translate its tool names as below. Nothing else changes.

## Tool mapping

| Skill says | Use here |
|---|---|
| `quiz` | `AskUserQuestion`, then grade it yourself (see below) |
| `ask_user_question` | `AskUserQuestion` |
| `researcher` subagent | `Agent` with `subagent_type: "researcher"` |
| "rendered through Obsidian" / md-log | the session is mirrored automatically by a Stop hook to `lessons/<date>-<topic>-<id>.md` (or wherever that file was moved, found by the `-<id>.md` suffix). Just write normally |

## Running a `quiz` with `AskUserQuestion`

pi's `quiz` tool carried the correct answer and graded instantly. `AskUserQuestion` doesn't, so you play both halves:

1. **Ask.** One question per call, `header: "Quiz"`. Build options with the skill's construction procedure. At most 4 options. Put the correct one in a random position. Use `multiSelect: true` when more than one is correct. **Never** put the answer, a hint, or any reasoning in the question or option `description`s — the user (and the lesson log) sees them before answering.
2. **Grade.** In your very next message, before anything else, give the instant feedback `quiz` used to: `✓` or `✗`, the correct answer, and the explanation. If they used "Other" to type a free answer, grade that on its merits.
3. Then continue the probe / teach loop based on the result.

## Lesson log + visuals

- Every session that uses this skill is mirrored to `lessons/<date>-<topic>-<id>.md` — user prompts, your prose, and quiz Q&A. LaTeX (`$…$`, `$$…$$`) and mermaid blocks render in Cursor / VS Code markdown preview and Obsidian, so keep writing math as LaTeX even though the terminal shows it raw.
- For diagrams, use the `visualize` skill.
