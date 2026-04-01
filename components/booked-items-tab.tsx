"use client"

import { useApp } from "@/lib/store"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { User, ExternalLink, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"

export function BookedItemsTab() {
    const { bookedItems, bookItem, fetchBookedItems } = useApp()
    const { toast } = useToast()
    const { t } = useLanguage()
    const [isLoading, setIsLoading] = useState<string | null>(null)

    const handleCancelBooking = async (itemId: string) => {
        setIsLoading(itemId)
        try {
            const success = await bookItem(itemId)
            if (success) {
                toast({
                    title: t("booked.canceledTitle"),
                    description: t("booked.canceledDesc"),
                })
                await fetchBookedItems()
            }
        } finally {
            setIsLoading(null)
        }
    }

    if (!bookedItems || bookedItems.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <User className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{t("booked.noItems")}</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    {t("booked.noItemsDesc")}
                </p>
            </div>
        )
    }

    return (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookedItems.map((item) => (
                <div
                    key={item.id}
                    className="glass rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all hover:scale-[1.02] group flex flex-col h-full"
                >
                    {/* Image Container */}
                    <div className="relative w-full aspect-square overflow-hidden bg-muted">
                        <Image
                            src={item.image || "/placeholder.svg"}
                            alt={item.title}
                            fill
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />

                        {/* Owner Badge - Top Right */}
                        {item.wishlist?.user && (
                            <Link
                                href={`/u/${item.wishlist.user.username}`}
                                className="absolute top-2 right-2 flex items-center gap-1.5 bg-background/90 backdrop-blur-sm rounded-lg px-2 py-1.5 shadow-md hover:bg-background/95 transition-all group/owner"
                            >
                                <Avatar className="w-6 h-6 ring-1 ring-primary">
                                    <AvatarImage src={item.wishlist.user.avatar} />
                                    <AvatarFallback className="text-[10px] font-bold">
                                        {item.wishlist.user.name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-col leading-tight hidden sm:flex">
                                    <span className="text-xs font-semibold text-foreground">
                                        {item.wishlist.user.name}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                        @{item.wishlist.user.username}
                                    </span>
                                </div>
                            </Link>
                        )}

                        {/* Priority Badge - Top Left */}
                        <div
                            className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded-full text-black ${item.priority === "high"
                                    ? "bg-primary"
                                    : item.priority === "medium"
                                        ? "bg-secondary"
                                        : "bg-muted-foreground"
                                }`}
                        >
                            {item.priority === "high" ? t("item.mustHave") : item.priority === "medium" ? t("item.want") : t("item.niceToHave")}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex flex-col flex-1 p-4 gap-3">
                        {/* Store & Price */}
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">{item.store}</p>
                            <h3 className="font-semibold text-foreground text-sm line-clamp-2 leading-tight">
                                {item.title}
                            </h3>
                            <p className="text-lg font-bold text-secondary mt-2">₴{item.price.toFixed(2)}</p>
                            {item.oldPrice && item.oldPrice > item.price && (
                                <p className="text-xs text-muted-foreground line-through">
                                    ₴{item.oldPrice.toFixed(2)}
                                </p>
                            )}
                        </div>

                        {/* Notes */}
                        {item.notes && (
                            <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-2">
                                "{item.notes}"
                            </p>
                        )}

                        {/* Status - Booked By */}
                        {item.isBooked && item.bookedBy && (
                            <div className="bg-primary/10 border border-primary/20 rounded-lg px-2 py-1.5 text-center">
                                <p className="text-[10px] text-primary/60">Забронював</p>
                                <p className="text-sm font-semibold text-primary">{item.bookedBy.name}</p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-auto pt-2">
                            <Button
                                asChild
                                size="sm"
                                variant="outline"
                                className="flex-1 gap-1 h-8 text-xs bg-transparent hover:bg-muted"
                            >
                                <a href={item.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="w-3 h-3" />
                                    <span className="hidden sm:inline">View</span>
                                </a>
                            </Button>
                            <Button
                                size="sm"
                                className="flex-1 h-8 text-xs bg-destructive hover:bg-destructive/90 gap-1"
                                onClick={() => handleCancelBooking(item.id)}
                                disabled={isLoading === item.id}
                            >
                                <X className="w-3 h-3" />
                                <span className="hidden sm:inline">
                                    {isLoading === item.id ? "Canceling..." : "Cancel"}
                                </span>
                            </Button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
