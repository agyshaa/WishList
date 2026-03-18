import { cn } from "@/lib/utils"

interface DiscountBadgeProps {
  discount?: number | null
  oldPrice?: number | null
  currentPrice?: number | null
  className?: string
}

export function DiscountBadge({ discount, oldPrice, currentPrice, className }: DiscountBadgeProps) {
  let discountPercent = discount

  // Calculate discount if not provided
  if ((!discountPercent || discountPercent <= 0) && oldPrice && currentPrice && oldPrice > currentPrice) {
    discountPercent = Math.round(((oldPrice - currentPrice) / oldPrice) * 100)
  }

  if (!discountPercent || discountPercent <= 0) return null

  return (
    <div
      className={cn(
        "absolute top-2 right-2 w-12 h-12 rounded-full bg-linear-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg",
        "text-white font-bold text-sm leading-none",
        "border-2 border-red-400",
        className
      )}
    >
      <div className="text-center">
        <div className="text-xs">-</div>
        <div className="text-base leading-tight">{Math.round(discountPercent)}%</div>
      </div>
    </div>
  )
}
