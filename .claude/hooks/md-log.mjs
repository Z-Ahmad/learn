#!/usr/bin/env node
/**
 * md-log (Claude Code port of extensions/md-log.ts) — mirror a teaching session
 * to lessons/<date>-<slug>-<session8>.md so it can be read rendered (Cursor /
 * VS Code markdown preview, Obsidian) instead of in a terminal.
 *
 * Runs as a Stop hook: reads the hook JSON on stdin, re-renders the whole
 * transcript each time (idempotent — no append bookkeeping). Only sessions that
 * used the teach skill are logged, so repo-maintenance chats stay out.
 *
 * Captures only reading-relevant content, like the original:
 *   - user prompts
 *   - assistant text
 *   - AskUserQuestion Q&A (question, options, the user's answer)
 * Other tools, thinking, and subagent (sidechain) traffic are omitted.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..")
const LESSONS = join(REPO, "lessons")

let hook
try {
  hook = JSON.parse(readFileSync(0, "utf8"))
} catch {
  process.exit(0)
}
const { transcript_path: transcriptPath, session_id: sessionId } = hook
if (!transcriptPath || !sessionId || !existsSync(transcriptPath)) process.exit(0)

const entries = readFileSync(transcriptPath, "utf8")
  .split("\n")
  .filter(Boolean)
  .map((l) => {
    try {
      return JSON.parse(l)
    } catch {
      return null
    }
  })
  .filter((e) => e && (e.type === "user" || e.type === "assistant") && !e.isSidechain && !e.isMeta)

const blocks = (e) => (Array.isArray(e.message?.content) ? e.message.content : [])
const textOf = (c) =>
  typeof c === "string" ? c : Array.isArray(c) ? c.filter((b) => b.type === "text").map((b) => b.text).join("\n") : ""

// A typed user prompt: plain string content (or text blocks), not a tool result.
function userPrompt(e) {
  if (e.type !== "user") return null
  const c = e.message?.content
  const text = typeof c === "string" ? c : blocks(e).some((b) => b.type === "tool_result") ? "" : textOf(c)
  const cleaned = text.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, "").trim()
  if (!cleaned || cleaned.startsWith("<local-command") || cleaned.startsWith("Caveat:")) return null
  // Slash commands arrive as <command-name>/teach</command-name><command-args>…</command-args>
  const cmd = cleaned.match(/<command-name>([^<]*)<\/command-name>/)
  if (cmd) {
    const args = cleaned.match(/<command-args>([\s\S]*?)<\/command-args>/)?.[1]?.trim()
    return `${cmd[1]}${args ? " " + args : ""}`
  }
  return cleaned
}

const usedTeach = entries.some(
  (e) =>
    blocks(e).some((b) => b.type === "tool_use" && b.name === "Skill" && /(^|:)teach$/.test(b.input?.skill ?? "")) ||
    /^\/teach\b/.test(userPrompt(e) ?? ""),
)
if (!usedTeach) process.exit(0)

const out = []
const pendingQuestions = new Map()
for (const e of entries) {
  const prompt = userPrompt(e)
  if (prompt) {
    out.push(`---\n\n**You:** ${prompt}`)
    continue
  }
  for (const b of blocks(e)) {
    if (e.type === "assistant" && b.type === "text" && b.text.trim()) {
      out.push(b.text.trim())
    } else if (b.type === "tool_use" && b.name === "AskUserQuestion") {
      pendingQuestions.set(b.id, true)
      for (const q of b.input?.questions ?? []) {
        const opts = (q.options ?? []).map((o) => `> - ${o.label}${o.description ? ` — ${o.description}` : ""}`)
        out.push([`> **${q.header ? q.header + ": " : ""}${q.question}**`, ">", ...opts].join("\n"))
      }
    } else if (b.type === "tool_result" && pendingQuestions.has(b.tool_use_id)) {
      pendingQuestions.delete(b.tool_use_id)
      const answer = textOf(b.content).trim()
      if (answer) out.push(`> *Answer:* ${answer.replace(/\n+/g, " ")}`)
    }
  }
}

mkdirSync(LESSONS, { recursive: true })
const sid = sessionId.slice(0, 8)
let file = readdirSync(LESSONS).find((f) => f.endsWith(`-${sid}.md`))
if (!file) {
  const first = entries.map(userPrompt).find(Boolean) ?? "lesson"
  const slug =
    first
      .replace(/^\/teach\s*/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50)
      .replace(/-+$/, "") || "lesson"
  file = `${new Date().toISOString().slice(0, 10)}-${slug}-${sid}.md`
}
writeFileSync(join(LESSONS, file), out.join("\n\n") + "\n", "utf8")
