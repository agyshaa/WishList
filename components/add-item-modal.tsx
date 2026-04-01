"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Link2, Sparkles, Loader2, AlertCircle, Check } from "lucide-react"
import { useState } from "react"
import Image from "next/image"
import { useLanguage } from "@/lib/language-context"
import { useApp } from "@/lib/store"

interface ParsedProduct {
    title: string
    price: number
    oldPrice?: number | null
    discount_percent?: number | null
    currency: string
    image: string
    store: string
    url: string
    description: string
}

interface AddItemModalProps {
    isOpen: boolean
    onClose: () => void
    onAdd?: (item: {
        title: string
        price: number
        oldPrice?: number | null
        discount_percent?: number | null
        image: string
        store: string
        url: string
        priority: string
        notes: string
    }) => void
}

export function AddItemModal({ isOpen, onClose, onAdd }: AddItemModalProps) {
    const [url, setUrl] = useState("")
    const [notes, setNotes] = useState("")
    const [priority, setPriority] = useState("medium")
    const [isLoading, setIsLoading] = useState(false)
    const [parsed, setParsed] = useState<ParsedProduct | null>(null)
    const [error, setError] = useState("")
    const { t } = useLanguage()

    const handleParse = async () => {
        if (!url) return
        setIsLoading(true)
        setError("")
        setParsed(null)

        try {
            const res = await fetch("/api/parse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            })

            const data = await res.json()

            if (!res.ok) {
                // Handle different error types
                if (res.status === 429 || data.detail === "site_blocked") {
                    setError(`🚫 ${t("item.parseBlocked")}`)
                } else if (res.status === 400 || data.detail === "parse_failed") {
                    setError(`❌ ${data.error || t("item.parseFailed")}`)
                } else {
                    setError(data.error || t("item.parseFailed"))
                }
                return
            }

            setParsed(data)
        } catch (err) {
            setError(`⚠️ ${t("item.parseConnectionError")}`)
        } finally {
            setIsLoading(false)
        }
    }

    const handleAdd = () => {
        if (!parsed) return

        onAdd?.({
            title: parsed.title,
            price: parsed.price,
            oldPrice: parsed.oldPrice,
            discount_percent: parsed.discount_percent,
            image: parsed.image,
            store: parsed.store,
            url: parsed.url || url,
            priority,
            notes,
        })

        // Reset state
        setUrl("")
        setNotes("")
        setPriority("medium")
        setParsed(null)
        setError("")
        onClose()
    }

    const handleClose = () => {
        setUrl("")
        setNotes("")
        setPriority("medium")
        setParsed(null)
        setError("")
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="glass border-border sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-foreground">
                        <Link2 className="w-5 h-5 text-primary" />
                        {t("item.addToWishlist")}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    {/* URL Input */}
                    <div className="space-y-2">
                        <Label htmlFor="url">{t("item.productUrl")}</Label>
                        <div className="flex gap-2">
                            <Input
                                id="url"
                                placeholder={t("item.pasteLink")}
                                value={url}
                                onChange={(e) => {
                                    setUrl(e.target.value)
                                    setParsed(null)
                                    setError("")
                                }}
                                className="bg-muted border-border"
                            />
                            <Button
                                onClick={handleParse}
                                disabled={!url || isLoading}
                                className="shrink-0 bg-primary hover:bg-primary/90"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-1" />
                                        {t("item.parse")}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-in fade-in">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Parsed Preview */}
                    {parsed && (
                        <div className="glass rounded-lg p-3 flex items-start gap-3 animate-in fade-in">
                            {parsed.image ? (
                                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                                    <Image
                                        src={parsed.image}
                                        alt={parsed.title}
                                        fill
                                        className="w-full h-full object-cover"
                                        sizes="64px"
                                        unoptimized
                                    />
                                </div>
                            ) : (
                                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                    <Check className="w-6 h-6 text-secondary" />
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm text-foreground break-all whitespace-pre-wrap">{parsed.title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <p className="text-xs text-muted-foreground">
                                        {parsed.store && <span>{parsed.store} · </span>}
                                        <span className="text-secondary font-medium text-sm">
                                            {parsed.price > 0 ? `₴${parsed.price.toLocaleString()}` : "Price not found"}
                                        </span>
                                    </p>
                                    {parsed.oldPrice && parsed.oldPrice > parsed.price && (
                                        <>
                                            <span className="text-xs text-muted-foreground line-through">
                                                ₴{parsed.oldPrice.toLocaleString()}
                                            </span>
                                            <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-sm">
                                                -{Math.round(((parsed.oldPrice - parsed.price) / parsed.oldPrice) * 100)}%
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Priority */}
                    <div className="space-y-2">
                        <Label>{t("item.priority")}</Label>
                        <div className="flex gap-2">
                            {[
                                { value: "high", label: t("item.mustHave"), color: "bg-primary" },
                                { value: "medium", label: t("item.want"), color: "bg-secondary" },
                                { value: "low", label: t("item.niceToHave"), color: "bg-muted-foreground" },
                            ].map((p) => (
                                <button
                                    key={p.value}
                                    onClick={() => setPriority(p.value)}
                                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-smooth ${priority === p.value
                                        ? `${p.color} text-background`
                                        : "bg-muted text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">{t("item.notes")} ({t("common.optional")})</Label>
                        <Textarea
                            id="notes"
                            placeholder={t("item.color")}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="bg-muted border-border resize-none break-all whitespace-pre-wrap"
                            rows={3}
                            wrap="soft"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={handleClose} className="bg-transparent">
                            {t("common.cancel")}
                        </Button>
                        <Button onClick={handleAdd} disabled={!parsed} className="bg-primary hover:bg-primary/90">
                            {t("item.addToList")}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
