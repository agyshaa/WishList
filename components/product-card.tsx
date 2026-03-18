"use client"

import type { WishlistItem } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { Heart, ExternalLink, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface ProductCardProps {
  item: WishlistItem
  className?: string
  variant?: "default" | "compact"
  viewMode?: "grid" | "list"
}

export function ProductCard({ item, className, variant = "default", viewMode = "grid" }: ProductCardProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const priorityColors = {
    high: "bg-primary text-primary-foreground",
    medium: "bg-secondary text-secondary-foreground",
    low: "bg-muted text-muted-foreground",
  }

  return (
    <div
      className={cn(
        "group glass rounded-2xl overflow-hidden transition-smooth hover:scale-[1.02] cursor-pointer",
        viewMode === "list" ? "flex flex-col sm:flex-row" : "flex flex-col",
        className,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image container */}
      <div
        className={cn(
          "relative overflow-hidden bg-muted",
          viewMode === "list" 
            ? "w-full sm:w-48 xl:w-56 shrink-0 aspect-[4/3] sm:aspect-square" 
            : variant === "compact" ? "aspect-square" : "aspect-[4/5]"
        )}
      >
        <Image
          src={item.image || "/placeholder.svg"}
          alt={item.title}
          fill
          className="w-full h-full object-cover transition-smooth group-hover:scale-105"
          sizes={viewMode === "list" ? "(max-width: 640px) 100vw, (max-width: 1280px) 192px, 224px" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
          priority={false}
        />

        {/* Overlay actions */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t from-background/80 to-transparent transition-smooth",
            isHovered ? "opacity-100" : "opacity-0",
          )}
        >
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <Button size="sm" className="bg-primary hover:bg-primary/90 gap-1">
              <Plus className="w-4 h-4" />
              Add
            </Button>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsLiked(!isLiked)
                }}
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center transition-smooth",
                  isLiked ? "bg-primary text-primary-foreground" : "glass hover:bg-muted",
                )}
              >
                <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
              </button>
              <button className="w-9 h-9 rounded-full glass hover:bg-muted flex items-center justify-center transition-smooth">
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Priority badge */}
        <div
          className={cn(
            "absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium",
            priorityColors[item.priority],
          )}
        >
          {item.priority === "high" ? "Must Have" : item.priority === "medium" ? "Want" : "Nice to Have"}
        </div>
      </div>

      {/* Card content */}
      <div className={cn("flex flex-col flex-1", viewMode === "list" ? "p-5 sm:p-6" : "p-4")}>
        <p className="text-xs text-muted-foreground mb-1">{item.store}</p>
        <h3 className={cn("font-medium text-foreground break-all whitespace-pre-wrap", viewMode === "list" ? "text-base lg:text-lg mb-3" : "line-clamp-2 text-sm mb-2")}>{item.title}</h3>
        <div className={cn("mt-auto", viewMode === "list" ? "flex items-end justify-between gap-4" : "")}>
            <div className="flex flex-col items-start gap-1">
              <p className="text-lg font-bold text-secondary">₴{item.price.toFixed(2)}</p>
              {item.oldPrice && item.oldPrice > item.price && (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground line-through">
                    ₴{item.oldPrice.toFixed(2)}
                  </p>
                  <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-sm">
                    -{Math.round(((item.oldPrice - item.price) / item.oldPrice) * 100)}%
                  </span>
                </div>
              )}
            </div>
            {item.notes && <p className={cn("text-xs text-muted-foreground break-all whitespace-pre-wrap", viewMode === "list" ? "max-w-[60%] line-clamp-2 text-right" : "mt-2 line-clamp-1")}>"{ item.notes}"</p>}
        </div>
      </div>
    </div>
  )
}
