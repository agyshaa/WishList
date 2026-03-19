"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ProfileHeader } from "@/components/profile-header"
import { WishlistCard } from "@/components/wishlist-card"
import { CreateListModal } from "@/components/create-list-modal"
import { EditWishlistModal } from "@/components/edit-wishlist-modal"
import { AccessKeyModal } from "@/components/access-key-modal"
import { SharedListsTab } from "@/components/shared-lists-tab"
import { BookedItemsTab } from "@/components/booked-items-tab"
import type { Wishlist } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Plus, List, Users } from "lucide-react"
import { useState } from "react"
import { useApp } from "@/lib/store"
import { useLanguage } from "@/lib/language-context"

// Замість жорсткого тексту використовуємо ключі для перекладу
const tabs = [
    { id: "my-lists", labelKey: "profile.myWishlists", icon: List },
    { id: "shared", labelKey: "profile.mySharedLists", icon: Users },
     { id: "booked", labelKey: "profile.bookedByMe", icon: Plus },
]

export default function ProfilePage() {
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showShareModal, setShowShareModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [selectedList, setSelectedList] = useState<Wishlist | null>(null)
    const [activeTab, setActiveTab] = useState("my-lists")
    const [isSaving, setIsSaving] = useState(false)
    const { user, isLoading, wishlists, createWishlist, deleteWishlist, updateWishlist, regenerateAccessKey, updateWishlistPrivacy } = useApp()
    const router = useRouter()
    const { t } = useLanguage() // Підключаємо наш хук

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

    if (!user) {
        return null
    }

    const handleCreateList = async (data: { name: string; description: string; emoji: string; isPrivate: boolean }) => {
        await createWishlist(data)
        setShowCreateModal(false)
    }

    const handleEditList = async (data: { name: string; description: string; emoji: string; isPrivate: boolean }) => {
        if (!selectedList) return
        setIsSaving(true)
        try {
            await updateWishlist(selectedList.id, data)
            setShowEditModal(false)
            setSelectedList(null)
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeleteList = (id: string) => {
        deleteWishlist(id)
    }

    // Create a user object with wishlists for ProfileHeader
    const userWithWishlists = { ...user, wishlists }

    return (
        <main className="min-h-screen bg-background">
            <Navbar />

            <div className="pt-24 pb-12 px-4">
                <div className="max-w-5xl mx-auto">
                    {/* Profile Header */}
                    <ProfileHeader user={userWithWishlists} />

                    <div className="mt-8 flex items-center gap-2 border-b border-border pb-4">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-smooth ${activeTab === tab.id
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {t(tab.labelKey)}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    {activeTab === "my-lists" ? (
                        <div className="mt-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-foreground">{t("profile.myWishlists")}</h2>
                                <Button onClick={() => setShowCreateModal(true)} className="bg-primary hover:bg-primary/90 gap-1">
                                    <Plus className="w-4 h-4" />
                                    {t("wishlist.createNew")}
                                </Button>
                            </div>

                            {/* Wishlist Grid */}
                            {wishlists.length > 0 ? (
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {wishlists.map((wishlist) => (
                                        <WishlistCard
                                            key={wishlist.id}
                                            wishlist={wishlist}
                                            editable
                                            onShare={() => {
                                                setSelectedList(wishlist)
                                                setShowShareModal(true)
                                            }}
                                            onEdit={() => {
                                                setSelectedList(wishlist)
                                                setShowEditModal(true)
                                            }}
                                            onDelete={() => handleDeleteList(wishlist.id)}
                                        />
                                    ))}

                                    {/* Create New Card */}
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="glass rounded-2xl border-2 border-dashed border-border hover:border-primary transition-smooth flex flex-col items-center justify-center gap-3 py-12 group"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/20 transition-smooth">
                                            <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-smooth" />
                                        </div>
                                        <p className="text-muted-foreground group-hover:text-foreground transition-smooth">{t("wishlist.createNew")}</p>
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                                        <List className="w-10 h-10 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground mb-2">{t("profile.noWishlists")}</h3>
                                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                                        {t("profile.createFirst")}
                                    </p>
                                    <Button onClick={() => setShowCreateModal(true)} className="bg-primary hover:bg-primary/90 gap-2">
                                        <Plus className="w-4 h-4" />
                                        {t("profile.createOne")}
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : activeTab === "shared" ? (
                        <div className="mt-6">
                            <SharedListsTab />
                        </div>
                    ) : (
                        <div className="mt-6">
                            <BookedItemsTab />
                        </div>
                    )}
                </div>
            </div>

            <Footer />

            {/* Modals */}
            <CreateListModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreate={handleCreateList}
            />
            {selectedList && (
                <>
                    <EditWishlistModal
                        isOpen={showEditModal}
                        onClose={() => {
                            setShowEditModal(false)
                            setSelectedList(null)
                        }}
                        wishlist={selectedList}
                        onSave={handleEditList}
                        isLoading={isSaving}
                    />
                    <AccessKeyModal
                        isOpen={showShareModal}
                        onClose={() => setShowShareModal(false)}
                        accessKey={selectedList.accessKey || ""}
                        listName={selectedList.name}
                        listId={selectedList.id}
                        isPrivate={selectedList.isPrivate}
                        onPrivacyChange={(isPrivate) => updateWishlistPrivacy(selectedList.id, isPrivate)}
                        onRegenerateKey={() => regenerateAccessKey(selectedList.id)}
                    />
                </>
            )}
        </main>
    )
}