"use client"

import { useParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { WishlistItemCard } from "@/components/wishlist-item-card"
import { Button } from "@/components/ui/button"
import { Lock, ArrowLeft, Eye, Heart } from "lucide-react"
import Link from "next/link"
import { useApp } from "@/lib/store"
import { useState, useEffect } from "react"
import type { Wishlist } from "@/lib/mock-data"

export default function SharedWishlistPage() {
    const params = useParams()
    const accessKey = (params.key as string).toUpperCase()
    const { getWishlistByAccessKey } = useApp()
    const [wishlist, setWishlist] = useState<Wishlist | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchWishlist = async () => {
            setLoading(true)
            const result = await getWishlistByAccessKey(accessKey)
            setWishlist(result || null)
            setLoading(false)
        }
        fetchWishlist()
    }, [accessKey, getWishlistByAccessKey])

    if (loading) {
        return (
            <main className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </main>
        )
    }

    if (!wishlist) {
        return (
            <main className="min-h-screen bg-background flex items-center justify-center px-4">
                <Navbar />
                <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">Invalid Access Key</h1>
                    <p className="text-muted-foreground mb-6 max-w-sm">
                        This access key is invalid or the wishlist has been removed.
                    </p>
                    <Button asChild className="bg-primary hover:bg-primary/90">
                        <Link href="/">Go Home</Link>
                    </Button>
                </div>
            </main>
        )
    }

    const totalValue = wishlist.items.reduce((sum, item) => sum + item.price, 0)

    return (
        <main className="min-h-screen bg-background">
            <Navbar />

            <div className="pt-24 pb-12 px-4">
                <div className="max-w-3xl mx-auto">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-smooth"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Link>

                    {/* View Only Banner */}
                    <div className="bg-secondary/20 border border-secondary/30 rounded-xl p-4 mb-6 flex items-center gap-3">
                        <Eye className="w-5 h-5 text-secondary" />
                        <div>
                            <p className="font-medium text-foreground">View Only Mode</p>
                            <p className="text-sm text-muted-foreground">{"You're viewing a shared wishlist"}</p>
                        </div>
                    </div>

                    {/* Header */}
                    <div className="glass rounded-2xl p-6 mb-6">
                        <div className="flex items-start gap-4">
                            <div className="text-4xl">{wishlist.emoji}</div>
                            <div className="flex-1">
                                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{wishlist.name}</h1>
                                {wishlist.description && (
                                    <p className="text-muted-foreground mt-1 break-all whitespace-pre-wrap">{wishlist.description}</p>
                                )}
                                <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Lock className="w-4 h-4" /> Shared with you
                                    </span>
                                    <span>{wishlist.items.length} items</span>
                                    <span className="text-secondary font-medium">${totalValue.toFixed(2)} total</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items List */}
                    {wishlist.items.length > 0 ? (
                        <div className="space-y-3">
                            {wishlist.items.map((item) => (
                                <WishlistItemCard key={item.id} item={item} editable={false} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 glass rounded-2xl">
                            <p className="text-muted-foreground">This wishlist has no items yet.</p>
                        </div>
                    )}

                    {/* Gift Helper CTA */}
                    <div className="mt-8 glass rounded-2xl p-6 text-center">
                        <Heart className="w-8 h-8 text-primary mx-auto mb-3" />
                        <h3 className="font-semibold text-foreground mb-2">Want to gift something?</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            {"Click on any item to visit the store and make someone's day!"}
                        </p>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    )
}
