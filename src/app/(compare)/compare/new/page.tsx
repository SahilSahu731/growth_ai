import { CompareNewPageClient } from "@/components/compare/compare-new-page-client"

export default async function CompareNewPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const exampleValue = resolvedSearchParams.example
  const initialExample = Array.isArray(exampleValue) ? (exampleValue[0] ?? "") : (exampleValue ?? "")

  return <CompareNewPageClient initialExample={initialExample} />
}
