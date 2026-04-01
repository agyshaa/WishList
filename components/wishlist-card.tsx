"use client"

import type { Wishlist } from "@/lib/types"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { Lock, Globe, MoreHorizontal, Edit3, Trash2, Share2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

interface WishlistCardProps {
  wishlist: Wishlist
  className?: string
  editable?: boolean
  onShare?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function WishlistCard({ wishlist, className, editable = false, onShare, onEdit, onDelete }: WishlistCardProps) {
  const totalValue = wishlist.items.reduce((sum, item) => sum + item.price, 0)

  return (
    <Link href={`/list/${wishlist.id}`} className="block">
      <div
        className={cn(
          "glass rounded-2xl overflow-hidden transition-smooth hover:scale-[1.02] group cursor-pointer",
          className,
        )}
      >
        {/* Preview Grid */}
        <div className="relative aspect-4/3 bg-muted">
          <div className="absolute inset-0 grid grid-cols-2 gap-0.5 p-0.5">
            {wishlist.items.slice(0, 4).map((item, index) => (
              <div key={item.id} className="relative bg-muted overflow-hidden">
                <Image
                  src={item.image || "/placeholder.svg"}
                  alt={item.title}
                  fill
                  className="w-full h-full object-cover transition-smooth group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
            ))}
            {wishlist.items.length < 4 &&
              Array.from({ length: 4 - wishlist.items.length }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-muted/50" />
              ))}
          </div>

          {/* Privacy badge */}
          <div className="absolute top-3 right-3 px-2 py-1 rounded-full glass text-xs flex items-center gap-1">
            {wishlist.isPrivate ? (
              <>
                <Lock className="w-3 h-3" /> Private
              </>
            ) : (
              <>
                <Globe className="w-3 h-3" /> Public
              </>
            )}
          </div>

          {/* Emoji badge */}
          <div className="absolute bottom-3 left-3 w-10 h-10 rounded-xl glass flex items-center justify-center text-xl">
            {wishlist.emoji}
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-smooth line-clamp-2">
                {wishlist.name}
              </h3>
              {wishlist.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5 break-all whitespace-pre-wrap">{wishlist.description}</p>
              )}
            </div>

            {editable && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                  <button className="p-1 hover:bg-muted rounded-lg transition-smooth">
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault()
                      onShare?.()
                    }}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault()
                      onEdit?.()
                    }}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={(e) => {
                    e.preventDefault()
                    onDelete?.()
                  }}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="flex items-center justify-between mt-3 text-sm">
            <span className="text-muted-foreground">{wishlist.items.length} items</span>
            <span className="text-secondary font-medium">₴{totalValue.toLocaleString("uk-UA")}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
