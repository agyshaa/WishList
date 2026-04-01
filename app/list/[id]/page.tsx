"use client"

import { useParams, useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { WishlistItemCard } from "@/components/wishlist-item-card"
import { AccessKeyModal } from "@/components/access-key-modal"
import { AddItemModal } from "@/components/add-item-modal"
import { EditWishlistModal } from "@/components/edit-wishlist-modal"
import { EditItemModal } from "@/components/edit-item-modal"
import type { WishlistItem, Wishlist } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Share2, Plus, Lock, Globe, ArrowLeft, Edit3, Package, Gift } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useApp } from "@/lib/store"
import { useLanguage } from "@/lib/language-context"

export default function WishlistPage() {
    const params = useParams()
    const router = useRouter()
    const { t } = useLanguage()
    const [showShareModal, setShowShareModal] = useState(false)
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showEditItemModal, setShowEditItemModal] = useState(false)
    const [selectedItem, setSelectedItem] = useState<WishlistItem | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [wishlist, setWishlist] = useState<Wishlist | null>(null)
    const [isLoadingWishlist, setIsLoadingWishlist] = useState(true)

    const { user, isLoading, getWishlistById, getWishlistByIdFromApi, addItemToWishlist, deleteItem, updateWishlist, updateItem, getWishlistByAccessKey, regenerateAccessKey, updateWishlistPrivacy, bookItem } = useApp()

    const wishlistParam = params.id as string

    // Fetch wishlist by ID or accessKey
    useEffect(() => {
        const fetchWishlist = async () => {
            setIsLoadingWishlist(true)
            try {
                // Try by UUID first (works for both public and owned wishlists)
                const byId = await getWishlistByIdFromApi(wishlistParam)
                if (byId) {
                    setWishlist(byId)
                    setIsLoadingWishlist(false)
                    return
                }

                // Try by accessKey if UUID failed (for shared wishlists with key)
                const byKey = await getWishlistByAccessKey(wishlistParam.toUpperCase())
                if (byKey) {
                    setWishlist(byKey)
                } else {
                    setWishlist(null)
                }
            } catch (error) {
                console.error("Error fetching wishlist:", error)
                setWishlist(null)
            } finally {
                setIsLoadingWishlist(false)
            }
        }

        if (!isLoading) {
            fetchWishlist()
        }
    }, [wishlistParam, isLoading, user, getWishlistByIdFromApi, getWishlistByAccessKey])

    useEffect(() => {
        // Only redirect to login if trying to access own wishlist (not a shared one)
        // Shared wishlists should be accessible without login
        if (!isLoading && !user && !wishlist) {
            // Check if this looks like an accessKey (has dashes) that we tried to fetch
            if (!wishlistParam.includes("-")) {
                // It's a UUID, so require login
                router.push("/login")
            }
        }
    }, [user, isLoading, router, wishlist, wishlistParam])

    if (isLoading || isLoadingWishlist) {
        return (
            <main className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </main>
        )
    }

    if (!wishlist) {
        return (
            <main className="min-h-screen bg-background">
                <Navbar />
                <div className="pt-24 pb-12 px-4 flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-foreground mb-2">{t("wishlist.notFound")}</h1>
                        <p className="text-muted-foreground mb-4">{t("wishlist.mayBeDeleted")}</p>
                        <Button asChild className="bg-primary hover:bg-primary/90">
                            <Link href="/profile">{t("wishlist.goToProfile")}</Link>
                        </Button>
                    </div>
                </div>
                <Footer />
            </main>
        )
    }

    const isOwner = user && wishlist.userId === user.id


    const totalValue = wishlist.items.reduce((sum, item) => sum + item.price, 0)

    const formatPrice = (value: number) => {
        return value.toLocaleString("uk-UA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    }

    const handleAddItem = (data: { title: string; price: number; oldPrice?: number | null; image: string; store: string; url: string; priority: string; notes: string }) => {
        addItemToWishlist(wishlist.id, {
            title: data.title,
            price: data.price,
            oldPrice: data.oldPrice,
            image: data.image,
            store: data.store,
            url: data.url,
            priority: data.priority as "high" | "medium" | "low",
            notes: data.notes,
        })
        setShowAddModal(false)
    }

    const handleDeleteItem = (itemId: string) => {
        deleteItem(wishlist.id, itemId)
    }

    const handleEditItem = (item: WishlistItem) => {
        setSelectedItem(item)
        setShowEditItemModal(true)
    }

    const handleSaveItem = async (itemId: string, data: { priority: string; notes: string }) => {
        setIsSaving(true)
        try {
            await updateItem(wishlist.id, itemId, {
                priority: data.priority as "high" | "medium" | "low",
                notes: data.notes,
            })
            setShowEditItemModal(false)
            setSelectedItem(null)
        } finally {
            setIsSaving(false)
        }
    }

    const handleTogglePrivacy = () => {
        updateWishlist(wishlist.id, { isPrivate: !wishlist.isPrivate })
    }

    const handleEditWishlist = async (data: { name: string; description: string; emoji: string; isPrivate: boolean }) => {
        setIsSaving(true)
        try {
            await updateWishlist(wishlist.id, data)
            setShowEditModal(false)
        } finally {
            setIsSaving(false)
        }
    }

    const handleBookItem = async (itemId: string): Promise<boolean> => {
        try {
            const success = await bookItem(itemId)
            if (success) {
                // Refresh wishlist data to show updated booked status
                if (wishlistParam.includes("-")) {
                    // It's an accessKey, refetch via accessKey
                    const updated = await getWishlistByAccessKey(wishlistParam.toUpperCase())
                    if (updated) {
                        setWishlist(updated)
                    }
                }
            }
            return success
        } catch (error) {
            console.error("Error booking item:", error)
            return false
        }
    }

    return (
        <main className="min-h-screen bg-background">
            <Navbar />

            <div className="pt-24 pb-12 px-4">
                <div className="max-w-3xl mx-auto">
                    {/* Back link */}
                    <Link
                        href={isOwner ? "/profile" : "/"}
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-smooth"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {isOwner ? t("navbar.profile") : t("navbar.home")}
                    </Link>

                    {/* Header */}
                    <div className="glass rounded-2xl p-6 mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div className="flex items-start gap-4 min-w-0">
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 text-3xl">
                                    {wishlist.emoji}
                                </div>
                                <div className="min-w-0">
                                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground line-clamp-2">{wishlist.name}</h1>
                                    {wishlist.description && <p className="text-muted-foreground mt-1 line-clamp-2 break-all whitespace-pre-wrap">{wishlist.description}</p>}

                                    {!isOwner && wishlist.user && (
                                        <div className="flex items-center gap-2 mt-3">
                                            <Avatar className="w-6 h-6">
                                                <AvatarImage src={wishlist.user.avatar} alt={wishlist.user.name} />
                                                <AvatarFallback className="text-[10px]">{wishlist.user.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm text-muted-foreground">
                                                {wishlist.user.name} <span className="text-muted-foreground/60">@{wishlist.user.username}</span>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2 shrink-0">
                                {isOwner && (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowEditModal(true)}
                                            className="gap-1 bg-transparent"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                            <span className="hidden sm:inline">{t("common.edit")}</span>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowShareModal(true)}
                                            className="gap-1 bg-transparent"
                                        >
                                            <Share2 className="w-4 h-4" />
                                            <span className="hidden sm:inline">{t("common.share")}</span>
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => setShowAddModal(true)}
                                            className="gap-1 bg-primary hover:bg-primary/90"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span className="hidden sm:inline">{t("common.add")}</span>
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Stats bar */}
                        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border">
                            {isOwner ? (
                                <button
                                    onClick={handleTogglePrivacy}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-smooth hover:opacity-80 bg-muted text-muted-foreground"
                                >
                                    {wishlist.isPrivate ? (
                                        <><Lock className="w-3.5 h-3.5" /> {t("wishlist.private")}</>
                                    ) : (
                                        <><Globe className="w-3.5 h-3.5" /> {t("wishlist.public")}</>
                                    )}
                                </button>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                    {wishlist.isPrivate ? (
                                        <><Lock className="w-3.5 h-3.5" /> {t("wishlist.private")}</>
                                    ) : (
                                        <><Globe className="w-3.5 h-3.5" /> {t("wishlist.public")}</>
                                    )}
                                </span>
                            )}

                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                <Gift className="w-3.5 h-3.5" />
                                {wishlist.items.length} {t("wishlist.items")}
                            </span>

                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-secondary/10 text-secondary">
                                ₴{formatPrice(totalValue)} {t("wishlist.total")}
                            </span>
                        </div>
                    </div>

                    {/* Items List */}
                    {wishlist.items.length > 0 ? (
                        <div className="space-y-3">
                            {wishlist.items.map((item) => (
                                <WishlistItemCard
                                    key={item.id}
                                    item={item}
                                    editable={isOwner || false}
                                    onBook={!isOwner ? handleBookItem : undefined}
                                    onDelete={isOwner ? handleDeleteItem : undefined}
                                    onEdit={isOwner ? handleEditItem : undefined}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 glass rounded-2xl">
                            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                                <Edit3 className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="font-semibold text-foreground mb-2">{t("wishlist.empty")}</h3>
                            <p className="text-muted-foreground mb-4">{t("wishlist.addFirstItem")}</p>
                            <Button onClick={() => setShowAddModal(true)} className="bg-primary hover:bg-primary/90 gap-2">
                                <Plus className="w-4 h-4" />
                                {t("common.add")}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <Footer />

            {/* Modals */}
            <EditWishlistModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                wishlist={wishlist}
                onSave={handleEditWishlist}
                isLoading={isSaving}
            />
            <EditItemModal
                isOpen={showEditItemModal}
                onClose={() => {
                    setShowEditItemModal(false)
                    setSelectedItem(null)
                }}
                item={selectedItem}
                onSave={handleSaveItem}
                isLoading={isSaving}
            />
            <AccessKeyModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                accessKey={wishlist.accessKey || ""}
                listName={wishlist.name}
                listId={wishlist.id}
                isPrivate={wishlist.isPrivate}
                onPrivacyChange={(isPrivate) => updateWishlistPrivacy(wishlist.id, isPrivate)}
                onRegenerateKey={() => regenerateAccessKey(wishlist.id)}
            />
            <AddItemModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={handleAddItem}
            />
        </main>
    )
}
