/**
 * Shared by the lesson-log hooks (.claude/hooks/md-log.mjs, .cursor/hooks/lesson-log.mjs).
 *
 * A session log is found by the conversation id: either a filename suffix
 * `-<id8>.md`, or `log_id: <id8>` in its frontmatter. The suffix lets a brand-new
 * log match before anyone renames it. Frontmatter lets the visible name be
 * `YYYY-MM-DD-session-NN.md` after it moves into a subject folder.
 */

import { existsSync, readFileSync, readdirSync, renameSync } from "node:fs"
import { basename, dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

export const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..")
export const LESSONS = join(REPO, "lessons")

const SKIP_DIRS = new Set([".obsidian", "viz", "concepts"])

export function localDate(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function findLog(id8, dir = LESSONS) {
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return null
  }
  for (const e of entries) {
    if (!e.isFile() || !e.name.endsWith(".md")) continue
    const file = join(dir, e.name)
    if (e.name.endsWith(`-${id8}.md`) || fileHasLogId(file, id8)) return file
  }
  for (const e of entries) {
    if (e.isDirectory() && !SKIP_DIRS.has(e.name)) {
      const hit = findLog(id8, join(dir, e.name))
      if (hit) return hit
    }
  }
  return null
}

function fileHasLogId(file, id8) {
  let head
  try {
    head = readFileSync(file, "utf8").slice(0, 200)
  } catch {
    return false
  }
  return new RegExp(`^---\\r?\\nlog_id:\\s*${id8}\\s*(?:\\r?\\n|$)`).test(head)
}

/** Keep the conversation id in frontmatter so the file can be renamed without losing the hook. */
export function withLogId(id8, body) {
  const text = body ?? ""
  if (fileTextHasLogId(text, id8)) return text.endsWith("\n") ? text : `${text}\n`
  return `---\nlog_id: ${id8}\n---\n\n${text}`
}

function fileTextHasLogId(text, id8) {
  return new RegExp(`^---\\r?\\nlog_id:\\s*${id8}\\s*(?:\\r?\\n|$)`).test(text)
}

export function nextSessionLogPath(subjectDir) {
  let maxSession = 0
  try {
    for (const e of readdirSync(subjectDir, { withFileTypes: true })) {
      if (!e.isFile()) continue
      const m = e.name.match(/-session-(\d+)\.md$/)
      if (m) maxSession = Math.max(maxSession, Number(m[1]))
    }
  } catch {}
  const nextNum = String(maxSession + 1).padStart(2, "0")
  return join(subjectDir, `${localDate()}-session-${nextNum}.md`)
}

export function detectSingleSubjectDir() {
  try {
    const dirs = readdirSync(LESSONS, { withFileTypes: true }).filter(
      (e) => e.isDirectory() && !SKIP_DIRS.has(e.name) && existsSync(join(LESSONS, e.name, "_progress.md")),
    )
    if (dirs.length === 1) return join(LESSONS, dirs[0].name)
  } catch {}
  return null
}

export function routeLogToSubject(logFile, subjectDir) {
  if (!logFile || !subjectDir || !existsSync(logFile)) return logFile
  if (dirname(logFile) === subjectDir && /-session-\d+\.md$/.test(basename(logFile))) return logFile
  const dest = nextSessionLogPath(subjectDir)
  try {
    renameSync(logFile, dest)
    return dest
  } catch {
    return logFile
  }
}

export function newLogPath(firstPrompt, id8, subjectDir = detectSingleSubjectDir()) {
  if (subjectDir && existsSync(subjectDir)) {
    return nextSessionLogPath(subjectDir)
  }
  const slug =
    (firstPrompt ?? "")
      .replace(/^\/teach\s*/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50)
      .replace(/-+$/, "") || "lesson"
  return join(LESSONS, `${localDate()}-${slug}-${id8}.md`)
}

/**
 * Make chat markdown read correctly in Obsidian: `\( \)` / `\[ \]` math becomes
 * `$ $` / `$$ $$`, and any image pointing at a published viz PNG becomes a
 * filename embed, which Obsidian resolves from any folder. Code fences are left alone.
 */
export function toObsidian(text) {
  return text
    .split(/(```[\s\S]*?```)/g)
    .map((part, i) =>
      i % 2
        ? part
        : part
            .replace(/!\[[^\]]*\]\(<?[^)>]*?(viz-[\w.-]+\.png)>?\)/g, "![[$1|500]]")
            .replace(/\\\[([\s\S]*?)\\\]/g, (_, m) => `$$${m}$$`)
            .replace(/\\\(([\s\S]*?)\\\)/g, (_, m) => `$${m.trim()}$`),
    )
    .join("")
}
