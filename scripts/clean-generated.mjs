import { rm, readFile } from "node:fs/promises"
import { resolve } from "node:path"

const root = process.cwd()
const manifest = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"))
if (manifest.name !== "growth_ai") throw new Error("Refusing to clean outside the GrowthAI repository")
for (const target of [".next", "coverage", "playwright-report", "test-results"]) await rm(resolve(root, target), { recursive: true, force: true })
console.log("Removed generated build and test output.")
