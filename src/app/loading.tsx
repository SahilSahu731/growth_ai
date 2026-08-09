export default function Loading() {
  return <main aria-busy="true" aria-label="Loading page" className="mx-auto min-h-[70vh] w-full max-w-6xl animate-pulse px-5 py-16"><div className="h-4 w-28 rounded bg-muted" /><div className="mt-5 h-12 max-w-2xl rounded-xl bg-muted" /><div className="mt-4 h-5 max-w-xl rounded bg-muted" /><div className="mt-10 grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-40 rounded-2xl border border-border bg-card" />)}</div><span className="sr-only">Loading…</span></main>
}
