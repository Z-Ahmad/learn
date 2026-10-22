/**
 * Shared by the lesson-log hooks (.claude/hooks/md-log.mjs, .cursor/hooks/lesson-log.mjs).
 *
 * A session's log is identified only by its filename suffix `-<id8>.md`, so the
 * agent can move it into a subject folder (lessons/probability/…) and the hooks
 * keep finding it.
 */

import { readdirSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

export const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..")
export const LESSONS = join(REPO, "lessons")

const SKIP_DIRS = new Set([".obsidian", "viz", "concepts"])

export function findLog(id8, dir = LESSONS) {
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return null
  }
  for (const e of entries) {
    if (e.isFile() && e.name.endsWith(`-${id8}.md`)) return join(dir, e.name)
  }
  for (const e of entries) {
    if (e.isDirectory() && !SKIP_DIRS.has(e.name)) {
      const hit = findLog(id8, join(dir, e.name))
      if (hit) return hit
    }
  }
  return null
}

export function newLogPath(firstPrompt, id8) {
  const slug =
    (firstPrompt ?? "")
      .replace(/^\/teach\s*/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50)
      .replace(/-+$/, "") || "lesson"
  return join(LESSONS, `${new Date().toISOString().slice(0, 10)}-${slug}-${id8}.md`)
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
