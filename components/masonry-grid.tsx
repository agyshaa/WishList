"use client"

import type { WishlistItem } from "@/lib/mock-data"
import { ProductCard } from "./product-card"
import { cn } from "@/lib/utils"

interface MasonryGridProps {
  items: WishlistItem[]
  className?: string
}

export function MasonryGrid({ items, className }: MasonryGridProps) {
  return (
    <div className={cn("columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4", className)}>
      {items.map((item, index) => (
        <div key={item.id} className="break-inside-avoid">
          <ProductCard item={item} variant={index % 3 === 0 ? "default" : "compact"} />
        </div>
      ))}
    </div>
  )
}
