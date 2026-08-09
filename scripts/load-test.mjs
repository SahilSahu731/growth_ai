const base = new URL(process.env.LOAD_BASE_URL ?? "http://127.0.0.1:3000")
const requests = Math.min(2_000, Math.max(1, Number(process.env.LOAD_REQUESTS ?? 200)))
const concurrency = Math.min(50, Math.max(1, Number(process.env.LOAD_CONCURRENCY ?? 10)))
const paths = ["/health", "/", "/pricing"]
const timings = []; let failures = 0, cursor = 0
async function worker() { while (cursor < requests) { const index = cursor++; const started = performance.now(); try { const response = await fetch(new URL(paths[index % paths.length], base), { signal: AbortSignal.timeout(10_000) }); if (!response.ok) failures += 1; await response.arrayBuffer() } catch { failures += 1 } timings.push(performance.now() - started) } }
await Promise.all(Array.from({ length: concurrency }, worker)); timings.sort((a, b) => a - b)
const p95 = timings[Math.max(0, Math.ceil(timings.length * .95) - 1)] ?? 0
console.log(JSON.stringify({ requests, concurrency, failures, p95Ms: Math.round(p95) }))
if (failures / requests > .01 || p95 > 2_500) process.exit(1)
