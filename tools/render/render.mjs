#!/usr/bin/env node
/**
 * Render a Mermaid or SVG source file to PNG — the Claude Code / Cursor stand-in
 * for extensions/visual-tools (pi-only). Makers write source with their normal
 * file tools, run this, then LOOK at the PNG with their image-reading tool.
 *
 *   node tools/render/render.mjs mermaid <src.mmd>            # preview
 *   node tools/render/render.mjs svg <src.svg>                # preview
 *   node tools/render/render.mjs mermaid <src.mmd> --save <slug>  # publish
 *
 * Preview PNGs go to the OS temp dir. --save publishes into lessons/viz/ with a
 * unique filename and prints the RESULT block the makers return.
 *
 * Chrome: $CHROME_PATH, else host google-chrome, else the Playwright chromium
 * baked into the homelab-dev image (claude-rc / cursor-worker), else macOS apps,
 * else Windows Chrome / Edge.
 */

import { spawnSync } from "node:child_process"
import { copyFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, "..", "..")
const VIZ_DIR = join(REPO, "lessons", "viz")
const STAGING = join(tmpdir(), "learn-viz")

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ]
  try {
    for (const d of readdirSync("/ms-playwright").filter((d) => /^chromium-\d+$/.test(d)).sort().reverse()) {
      candidates.push(join("/ms-playwright", d, "chrome-linux", "chrome"))
    }
  } catch {}
  candidates.push(
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  )
  for (const base of [process.env.PROGRAMFILES, process.env["PROGRAMFILES(X86)"], process.env.LOCALAPPDATA]) {
    if (!base) continue
    candidates.push(
      join(base, "Google", "Chrome", "Application", "chrome.exe"),
      join(base, "Microsoft", "Edge", "Application", "msedge.exe"),
    )
  }
  return candidates.find((c) => c && existsSync(c))
}

function fail(msg) {
  console.error(`RENDER FAILED: ${msg}`)
  process.exit(1)
}

async function renderMermaid(src, out, chrome) {
  const cfg = join(STAGING, "puppeteer.json")
  writeFileSync(cfg, JSON.stringify({ executablePath: chrome, args: ["--no-sandbox"] }))
  const mmdc = join(HERE, "node_modules", ".bin", "mmdc")
  if (!existsSync(mmdc)) fail(`mmdc missing — run: (cd ${HERE} && PUPPETEER_SKIP_DOWNLOAD=1 npm install)`)
  const res = spawnSync(mmdc, ["-i", src, "-o", out, "-p", cfg, "-b", "white", "-s", "2"], {
    encoding: "utf8",
    timeout: 60_000,
  })
  if (res.status !== 0 || !existsSync(out)) fail((res.stderr || res.stdout || String(res.error)).trim())
}

async function renderSvg(src, out, chrome) {
  const require = createRequire(join(HERE, "package.json"))
  const puppeteer = require("puppeteer")
  const browser = await puppeteer.launch({ executablePath: chrome, args: ["--no-sandbox"] })
  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1600, height: 1200, deviceScaleFactor: 2 })
    await page.goto(pathToFileURL(src).href, { waitUntil: "load" })
    const svg = await page.$("svg")
    if (!svg) fail("no <svg> root element found")
    await page.evaluate(() => {
      document.documentElement.style.background = "white"
    })
    await svg.screenshot({ path: out, omitBackground: false })
  } finally {
    await browser.close()
  }
}

const [kind, srcArg, flag, slugArg] = process.argv.slice(2)
if (!["mermaid", "svg"].includes(kind) || !srcArg || (flag && flag !== "--save")) {
  fail("usage: render.mjs <mermaid|svg> <source-file> [--save <slug>]")
}
const src = resolve(srcArg)
if (!existsSync(src)) fail(`source not found: ${src}`)
const chrome = findChrome()
if (!chrome) fail("no Chrome/Chromium found — set CHROME_PATH")

mkdirSync(STAGING, { recursive: true })
const preview = join(STAGING, `preview-${kind}-${Date.now()}.png`)
await (kind === "mermaid" ? renderMermaid : renderSvg)(src, preview, chrome)

if (flag !== "--save") {
  console.log(`preview: ${preview}`)
} else {
  const slug = (slugArg ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "viz"
  mkdirSync(VIZ_DIR, { recursive: true })
  const filename = `viz-${slug}-${Date.now()}.png`
  const dest = join(VIZ_DIR, filename)
  copyFileSync(preview, dest)
  console.log(`RESULT:\nfilename: ${filename}\npath: ${dest}`)
}
