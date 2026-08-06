export default function AdminLoading() {
  return <div className="space-y-7" aria-label="Loading admin workspace"><div className="h-5 w-28 animate-pulse rounded bg-white/5" /><div className="h-11 w-72 max-w-full animate-pulse rounded-xl bg-white/5" /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-40 animate-pulse rounded-2xl border border-white/5 bg-white/[.025]" />)}</div><div className="h-80 animate-pulse rounded-2xl border border-white/5 bg-white/[.025]" /></div>
}
