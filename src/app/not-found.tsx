import Link from "next/link"

export default function NotFound() {
  return <main className="flex min-h-[70vh] items-center justify-center bg-background px-5 text-foreground"><section className="max-w-lg text-center"><p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">404</p><h1 className="mt-4 text-4xl font-semibold tracking-tight">That page is not here.</h1><p className="mt-4 text-sm leading-6 text-muted-foreground">The address may be old, private, or mistyped.</p><Link href="/" className="mt-7 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">Return home</Link></section></main>
}
