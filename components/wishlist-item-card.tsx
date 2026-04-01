"use client"

import type { WishlistItem } from "@/lib/types"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { ExternalLink, MoreHorizontal, Trash2, Edit3, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useState } from "react"
import { useLanguage } from "@/lib/language-context"

interface WishlistItemCardProps {
    item: WishlistItem
    editable?: boolean
    onBook?: (id: string) => Promise<boolean>
    onDelete?: (id: string) => void
    onMarkPurchased?: (id: string) => void
    onEdit?: (item: WishlistItem) => void
}

export function WishlistItemCard({ item, editable = false, onBook, onDelete, onMarkPurchased, onEdit }: WishlistItemCardProps) {
    const [isPurchased, setIsPurchased] = useState(false)
    const [isBooking, setIsBooking] = useState(false)
    const { t } = useLanguage()

    const priorityColors = {
        high: "border-l-primary",
        medium: "border-l-secondary",
        low: "border-l-muted-foreground",
    }

    return (
        <div
            className={cn(
                "glass rounded-xl overflow-hidden transition-smooth hover:scale-[1.01] border-l-4",
                priorityColors[item.priority],
                isPurchased && "opacity-60",
            )}
        >
            <div className="flex gap-4 p-4">
                {/* Product Image */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-muted shrink-0">
                    <Image src={item.image || "/placeholder.svg"} alt={item.title} fill className="w-full h-full object-cover" sizes="96px" />
                    {isPurchased && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                            <Check className="w-8 h-8 text-secondary" />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-xs text-muted-foreground mb-0.5">{item.store}</p>
                            <h3 className={cn("font-medium text-foreground line-clamp-2 text-sm break-all whitespace-pre-wrap", isPurchased && "line-through")}>
                                {item.title}
                            </h3>
                        </div>

                        {editable && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="p-1 hover:bg-muted rounded-lg transition-smooth">
                                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuItem onClick={() => onEdit?.(item)}>
                                        <Edit3 className="w-4 h-4 mr-2" />
                                        {t("common.edit")}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setIsPurchased(true)
                                            onMarkPurchased?.(item.id)
                                        }}
                                    >
                                        <Check className="w-4 h-4 mr-2" />
                                        {t("item.markPurchased")}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={() => onDelete?.(item.id)}>
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        {t("common.delete")}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="flex flex-col items-start gap-0.5 flex-1">
                            <p className="text-lg font-bold text-secondary">
                                ₴{item.price.toFixed(2)}
                            </p>
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
                        <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="gap-1 h-8 text-xs bg-transparent" asChild>
                                <a href={item.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="w-3 h-3" />
                                    {t("item.view")}
                                </a>
                            </Button>
                            {!editable && onBook && !item.isBooked && (
                                <Button
                                    size="sm"
                                    className="gap-1 h-8 text-xs bg-primary hover:bg-primary/90"
                                    onClick={async () => {
                                        setIsBooking(true)
                                        try {
                                            await onBook(item.id)
                                        } finally {
                                            setIsBooking(false)
                                        }
                                    }}
                                    disabled={isBooking}
                                >
                                    <Check className="w-3 h-3" />
                                    {isBooking ? t("item.booking") : t("item.book")}
                                </Button>
                            )}
                            {!editable && onBook && item.isBooked && (
                                <Button
                                    size="sm"
                                    className="gap-1 h-8 text-xs bg-muted hover:bg-muted/80 text-foreground"
                                    onClick={async () => {
                                        setIsBooking(true)
                                        try {
                                            await onBook(item.id)
                                        } finally {
                                            setIsBooking(false)
                                        }
                                    }}
                                    disabled={isBooking}
                                >
                                    <Check className="w-3 h-3" />
                                    {isBooking ? t("item.canceling") : t("item.cancelBooking")}
                                </Button>
                            )}
                        </div>
                    </div>

                    {item.isBooked && item.bookedBy && (
                        <div className="mt-2 text-xs text-muted-foreground italic flex items-center gap-1">
                            <Check className="w-3 h-3 text-secondary" />
                            {t("item.bookedBy")} <span className="font-medium text-foreground">{item.bookedBy.name}</span>
                        </div>
                    )}

                    {item.notes && <p className="text-xs text-muted-foreground mt-2 italic break-all whitespace-pre-wrap">\"{item.notes}\"</p>}
                </div>
            </div>
        </div>
    )
}
