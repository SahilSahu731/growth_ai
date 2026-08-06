import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function AdminPagination({ page, pages, basePath, params = {} }: { page: number; pages: number; basePath: string; params?: Record<string, string> }) {
  if (pages <= 1) return null
  const href = (target: number) => `${basePath}?${new URLSearchParams({ ...params, page: String(target) })}`
  return <nav aria-label="Pagination" className="mt-5 flex items-center justify-between border-t border-white/8 pt-5"><p className="text-xs text-neutral-600">Page {page} of {pages}</p><div className="flex gap-2">{page > 1 ? <Link href={href(page - 1)} className="flex h-9 items-center gap-1 rounded-lg border border-white/10 px-3 text-xs font-semibold text-neutral-300 hover:bg-white/5"><ChevronLeft className="size-4" />Previous</Link> : null}{page < pages ? <Link href={href(page + 1)} className="flex h-9 items-center gap-1 rounded-lg border border-white/10 px-3 text-xs font-semibold text-neutral-300 hover:bg-white/5">Next<ChevronRight className="size-4" /></Link> : null}</div></nav>
}
