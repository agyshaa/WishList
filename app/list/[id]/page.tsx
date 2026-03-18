"use client"

import { useParams, useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { WishlistItemCard } from "@/components/wishlist-item-card"
import { AccessKeyModal } from "@/components/access-key-modal"
import { AddItemModal } from "@/components/add-item-modal"
import { EditWishlistModal } from "@/components/edit-wishlist-modal"
import { EditItemModal } from "@/components/edit-item-modal"
import type { WishlistItem } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { Share2, Plus, Lock, Globe, ArrowLeft, Edit3 } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useApp } from "@/lib/store"

export default function WishlistPage() {
    const params = useParams()
    const router = useRouter()
    const [showShareModal, setShowShareModal] = useState(false)
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showEditItemModal, setShowEditItemModal] = useState(false)
    const [selectedItem, setSelectedItem] = useState<WishlistItem | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    const { user, isLoading, getWishlistById, addItemToWishlist, deleteItem, updateWishlist, updateItem } = useApp()

    const wishlistId = params.id as string
    const wishlist = getWishlistById(wishlistId)

    useEffect(() => {
        if (!isLoading && !user) {
            router.push("/login")
        }
    }, [user, isLoading, router])

    if (isLoading) {
        return (
            <main className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </main>
        )
    }

    if (!wishlist) {
        return (
            <main className="min-h-screen bg-background flex items-center justify-center">
                <Navbar />
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-foreground mb-2">Wishlist not found</h1>
                    <p className="text-muted-foreground mb-4">This list may have been deleted or doesn&apos;t exist.</p>
                    <Button asChild className="bg-primary hover:bg-primary/90">
                        <Link href="/profile">Go to Profile</Link>
                    </Button>
                </div>
            </main>
        )
    }

    const totalValue = wishlist.items.reduce((sum, item) => sum + item.price, 0)

    const handleAddItem = (data: { title: string; price: number; oldPrice?: number | null; image: string; store: string; url: string; priority: string; notes: string }) => {
        addItemToWishlist(wishlistId, {
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
        deleteItem(wishlistId, itemId)
    }

    const handleEditItem = (item: WishlistItem) => {
        setSelectedItem(item)
        setShowEditItemModal(true)
    }

    const handleSaveItem = async (itemId: string, data: { priority: string; notes: string }) => {
        setIsSaving(true)
        try {
            await updateItem(wishlistId, itemId, {
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
        updateWishlist(wishlistId, { isPrivate: !wishlist.isPrivate })
    }

    const handleEditWishlist = async (data: { name: string; description: string; emoji: string; isPrivate: boolean }) => {
        setIsSaving(true)
        try {
            await updateWishlist(wishlistId, data)
            setShowEditModal(false)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <main className="min-h-screen bg-background">
            <Navbar />

            <div className="pt-24 pb-12 px-4">
                <div className="max-w-3xl mx-auto">
                    {/* Back link */}
                    <Link
                        href="/profile"
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-smooth"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Profile
                    </Link>

                    {/* Header */}
                    <div className="glass rounded-2xl p-6 mb-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="text-4xl">{wishlist.emoji}</div>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground line-clamp-2">{wishlist.name}</h1>
                                    {wishlist.description && <p className="text-muted-foreground mt-1 line-clamp-2 break-all whitespace-pre-wrap">{wishlist.description}</p>}
                                    <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
                                        <button
                                            onClick={handleTogglePrivacy}
                                            className="flex items-center gap-1 hover:text-foreground transition-smooth"
                                        >
                                            {wishlist.isPrivate ? (
                                                <>
                                                    <Lock className="w-4 h-4" /> Private
                                                </>
                                            ) : (
                                                <>
                                                    <Globe className="w-4 h-4" /> Public
                                                </>
                                            )}
                                        </button>
                                        <span>{wishlist.items.length} items</span>
                                        <span className="text-secondary font-medium">₴{totalValue.toFixed(2)} total</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowEditModal(true)}
                                    className="gap-1 bg-transparent"
                                >
                                    <Edit3 className="w-4 h-4" />
                                    Edit
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowShareModal(true)}
                                    className="gap-1 bg-transparent"
                                >
                                    <Share2 className="w-4 h-4" />
                                    Share
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => setShowAddModal(true)}
                                    className="gap-1 bg-primary hover:bg-primary/90"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Items List */}
                    {wishlist.items.length > 0 ? (
                        <div className="space-y-3">
                            {wishlist.items.map((item) => (
                                <WishlistItemCard
                                    key={item.id}
                                    item={item}
                                    editable
                                    onDelete={handleDeleteItem}
                                    onEdit={handleEditItem}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 glass rounded-2xl">
                            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                                <Edit3 className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="font-semibold text-foreground mb-2">This wishlist is empty</h3>
                            <p className="text-muted-foreground mb-4">Add your first item to get started</p>
                            <Button onClick={() => setShowAddModal(true)} className="bg-primary hover:bg-primary/90 gap-2">
                                <Plus className="w-4 h-4" />
                                Add Your First Item
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
                accessKey={wishlist.accessKey || wishlist.id}
                listName={wishlist.name}
            />
            <AddItemModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={handleAddItem}
            />
        </main>
    )
}
