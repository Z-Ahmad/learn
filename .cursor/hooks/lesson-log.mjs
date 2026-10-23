#!/usr/bin/env node
/**
 * Cursor port of md-log: mirror a teaching chat into the lessons/ vault.
 *
 * Cursor has no transcript we can cleanly re-render (it interleaves reasoning
 * with reply text), so this appends as events arrive instead:
 *   beforeSubmitPrompt  → "**You:** <prompt>"
 *   afterAgentResponse  → the reply, with math and image embeds made Obsidian-friendly
 *   postToolUse (Read)  → reading skills/teach/SKILL.md marks the chat as a lesson
 *                         and creates its log, seeded with the prompt that started it
 * Chats that never read the teach skill are not logged.
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { LESSONS, REPO, findLog, newLogPath, routeLogToSubject, toObsidian, withLogId } from "../../tools/lesson-log/common.mjs"

const STATE = join(REPO, ".memory", "lesson-log")
const TEACH_SKILL = /skills[\\/]teach[\\/]SKILL\.md$/i
const SUBJECT_PROGRESS = /lessons[\\/]([^\\/]+)[\\/]_progress\.md$/i

let hook
try {
  hook = JSON.parse(readFileSync(0, "utf8"))
} catch {
  hook = {}
}

const event = hook.hook_event_name
const id = hook.conversation_id
if (!id) done()
const id8 = id.slice(0, 8)
const log = findLog(id8)
const pendingFile = join(STATE, `${id8}.txt`)

if (event === "beforeSubmitPrompt") {
  const prompt = (hook.prompt ?? "").trim()
  if (log) {
    const wsPath = join(dirname(log), "workspace.md")
    const wsState = join(STATE, `${id8}-workspace.md`)
    if (existsSync(wsPath)) {
      const wsText = readFileSync(wsPath, "utf8").trim()
      const prevWs = existsSync(wsState) ? readFileSync(wsState, "utf8").trim() : ""
      if (wsText && wsText !== prevWs) {
        mkdirSync(STATE, { recursive: true })
        writeFileSync(wsState, wsText, "utf8")
        const quoted = wsText
          .split("\n")
          .map((l) => `> ${l}`)
          .join("\n")
        appendFileSync(log, `\n> [!note]- Workspace snapshot\n${quoted}\n`, "utf8")
      }
    }
    appendFileSync(log, `\n---\n\n**You:** ${prompt}\n`, "utf8")
  } else if (prompt) {
    mkdirSync(STATE, { recursive: true })
    writeFileSync(pendingFile, prompt, "utf8")
  }
} else if (event === "postToolUse") {
  const path = hook.tool_input?.path ?? hook.tool_input?.file_path ?? hook.tool_input?.target_file ?? ""
  if (!log && TEACH_SKILL.test(path)) {
    const first = existsSync(pendingFile) ? readFileSync(pendingFile, "utf8") : ""
    const file = newLogPath(first, id8)
    mkdirSync(join(file, ".."), { recursive: true })
    writeFileSync(file, withLogId(id8, first ? `---\n\n**You:** ${first}\n` : ""), "utf8")
    const wsPath = join(dirname(file), "workspace.md")
    if (existsSync(wsPath)) {
      mkdirSync(STATE, { recursive: true })
      writeFileSync(join(STATE, `${id8}-workspace.md`), readFileSync(wsPath, "utf8").trim(), "utf8")
    }
  } else if (log) {
    const m = path.match(SUBJECT_PROGRESS)
    if (m && m[1] !== ".obsidian" && m[1] !== "viz" && m[1] !== "concepts") {
      routeLogToSubject(log, join(LESSONS, m[1]))
    }
  }
} else if (event === "afterAgentResponse") {
  const text = (hook.text ?? "").trim()
  if (log && text) appendFileSync(log, `\n${toObsidian(text)}\n`, "utf8")
}

done()

function done() {
  if (event === "beforeSubmitPrompt") process.stdout.write(JSON.stringify({ continue: true }))
  process.exit(0)
}
