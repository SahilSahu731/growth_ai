import { readdir, stat } from "node:fs/promises"
import { extname, join, relative, resolve } from "node:path"

const root = process.cwd()
const limits = { individualJs: 450 * 1024, totalJs: 5 * 1024 * 1024, publicAsset: 1 * 1024 * 1024 }
async function files(directory) { const rows = []; for (const entry of await readdir(directory, { withFileTypes: true })) { const path = join(directory, entry.name); if (entry.isDirectory()) rows.push(...await files(path)); else rows.push(path) } return rows }
const jsFiles = await files(resolve(root, ".next/static")).then((rows) => rows.filter((path) => extname(path) === ".js"))
const jsSizes = await Promise.all(jsFiles.map(async (path) => ({ path, bytes: (await stat(path)).size })))
const publicFiles = await files(resolve(root, "public"))
const publicSizes = await Promise.all(publicFiles.map(async (path) => ({ path, bytes: (await stat(path)).size })))
const failures = [...jsSizes.filter((item) => item.bytes > limits.individualJs).map((item) => `${relative(root, item.path)} is ${item.bytes} bytes (individual JS budget ${limits.individualJs})`), ...publicSizes.filter((item) => item.bytes > limits.publicAsset).map((item) => `${relative(root, item.path)} is ${item.bytes} bytes (public asset budget ${limits.publicAsset})`)]
const totalJs = jsSizes.reduce((sum, item) => sum + item.bytes, 0)
if (totalJs > limits.totalJs) failures.push(`Total static JavaScript is ${totalJs} bytes (budget ${limits.totalJs})`)
if (failures.length) { console.error(failures.join("\n")); process.exit(1) }
console.log(JSON.stringify({ individualJsBudget: limits.individualJs, totalJs, totalJsBudget: limits.totalJs, publicAssetBudget: limits.publicAsset }))
