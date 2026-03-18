"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { WishlistCard } from "@/components/wishlist-card"
import { Key, ArrowRight, X, Eye } from "lucide-react"
import { useApp } from "@/lib/store"
import { useLanguage } from "@/lib/language-context"

export function SharedListsTab() {
    const [accessKey, setAccessKey] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [successMsg, setSuccessMsg] = useState("")
    const { sharedLists, addSharedList, removeSharedList } = useApp()
    const { t } = useLanguage()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!accessKey.trim()) return

        setIsLoading(true)
        setError("")
        setSuccessMsg("")

        try {
            const result = await addSharedList(accessKey)
            if (result.success) {
                // Використовуємо переклад замість сирого повідомлення зі стору
                setSuccessMsg(t("shared.addedSuccessfully"))
                setAccessKey("")
                setTimeout(() => setSuccessMsg(""), 3000)
            } else {
                // Перехоплюємо англійські помилки і перекладаємо їх
                if (result.message.includes("already")) {
                    setError(t("shared.alreadyAdded"))
                } else {
                    setError(t("shared.invalidKey"))
                }
            }
        } catch {
            setError(t("common.error"))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Access Key Input */}
            <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Key className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground">{t("shared.enterAccessKey")}</h3>
                        <p className="text-sm text-muted-foreground">{t("shared.viewPrivate")}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex gap-3">
                    <div className="flex-1 relative">
                        <Input
                            value={accessKey}
                            onChange={(e) => {
                                setAccessKey(e.target.value.toUpperCase())
                                setError("")
                                setSuccessMsg("")
                            }}
                            placeholder="e.g., WISH-88X-J92"
                            className="bg-muted border-border h-12 font-mono tracking-wider uppercase"
                        />
                        {accessKey && (
                            <button
                                type="button"
                                onClick={() => setAccessKey("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-smooth"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <Button type="submit" className="h-12 px-6 bg-primary hover:bg-primary/90" disabled={!accessKey || isLoading}>
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        ) : (
                            <>
                                {t("shared.accessBtn")}
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                        )}
                    </Button>
                </form>

                {error && <p className="text-sm text-destructive mt-3">{error}</p>}
                {successMsg && <p className="text-sm text-secondary mt-3">{successMsg}</p>}

                <p className="text-xs text-muted-foreground mt-3">
                    {t("shared.tipDemo")}
                    <code className="bg-muted px-1.5 py-0.5 rounded text-primary">WISH-88X-J92</code>
                    {t("shared.toSeeHowItWorks")}
                </p>
            </div>

            {/* Shared Lists Grid */}
            {sharedLists.length > 0 ? (
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Eye className="w-5 h-5 text-muted-foreground" />
                        <h3 className="font-semibold text-foreground">{t("shared.sharedWithYou")}</h3>
                        <span className="text-sm text-muted-foreground">({sharedLists.length})</span>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sharedLists.map((shared) => (
                            <div key={shared.id} className="relative group">
                                <WishlistCard wishlist={shared.wishlist} />
                                <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                                    {t("shared.viewOnly")}
                                </div>
                                <button
                                    onClick={() => removeSharedList(shared.id)}
                                    className="absolute top-3 right-12 p-1.5 rounded-full glass opacity-0 group-hover:opacity-100 transition-smooth hover:bg-destructive/20"
                                    title={t("common.delete")}
                                >
                                    <X className="w-4 h-4 text-muted-foreground" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                        <Key className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{t("profile.noShared")}</h3>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                        {t("shared.noSharedDesc")}
                    </p>
                </div>
            )}
        </div>
    )
}