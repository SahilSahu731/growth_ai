import Image from "next/image"

import { cn } from "@/lib/utils"

export function BrandLogo({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    <span className={cn("relative inline-flex shrink-0 overflow-hidden rounded-[22%]", className)}>
      <Image src="/logo.png" alt="" fill priority={priority} sizes="48px" className="object-cover" />
    </span>
  )
}
