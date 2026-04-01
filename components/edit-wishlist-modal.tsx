import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useLanguage } from "@/lib/language-context"

interface EditWishlistModalProps {
    isOpen: boolean
    onClose: () => void
    wishlist: {
        id: string
        name: string
        description?: string | null
        emoji: string
        isPrivate: boolean
    }
    onSave: (data: { name: string; description: string; emoji: string; isPrivate: boolean }) => void
    isLoading?: boolean
}

const EMOJI_LIST = ["🎁", "🎄", "🎂", "🎉", "🎊", "💝", "💖", "🌟", "⭐", "✨", "🎀", "🌹", "🎯", "📚", "🎮", "🎸", "🎬", "🍕", "🚗", "✈️"]

export function EditWishlistModal({ isOpen, onClose, wishlist, onSave, isLoading }: EditWishlistModalProps) {
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [emoji, setEmoji] = useState("")
    const [isPrivate, setIsPrivate] = useState(false)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const { t } = useLanguage()

    useEffect(() => {
        if (isOpen && wishlist) {
            setName(wishlist.name)
            setDescription(wishlist.description || "")
            setEmoji(wishlist.emoji)
            setIsPrivate(wishlist.isPrivate)
            setShowEmojiPicker(false)
        }
    }, [isOpen, wishlist])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) {
            alert(t("common.wishlistNameRequired"))
            return
        }

        onSave({
            name: name.trim(),
            description: description.trim(),
            emoji,
            isPrivate,
        })
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-125">
                <DialogHeader>
                    <DialogTitle>{t("wishlist.editWishlist")}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Emoji Picker */}
                    <div className="space-y-2">
                        <Label>{t("wishlist.emoji")}</Label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className="w-full px-4 py-2 text-3xl text-center border border-border rounded-lg hover:bg-muted transition-smooth flex items-center justify-center"
                            >
                                {emoji}
                            </button>

                            {showEmojiPicker && (
                                <div className="absolute top-full left-0 right-0 mt-2 p-3 border border-border rounded-lg bg-background shadow-lg z-50 grid grid-cols-5 gap-2">
                                    {EMOJI_LIST.map((e) => (
                                        <button
                                            key={e}
                                            type="button"
                                            onClick={() => {
                                                setEmoji(e)
                                                setShowEmojiPicker(false)
                                            }}
                                            className="text-2xl p-2 hover:bg-muted rounded transition-smooth"
                                        >
                                            {e}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="name">{t("wishlist.name")}</Label>
                            <span className="text-xs text-muted-foreground">{name.length}/50</span>
                        </div>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value.slice(0, 50))}
                            placeholder={t("wishlist.listName")}
                            maxLength={50}
                            disabled={isLoading}
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="description">{t("wishlist.description")}</Label>
                            <span className="text-xs text-muted-foreground">{description.length}/200</span>
                        </div>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                            placeholder={t("home.hero.subtitle")}
                            maxLength={200}
                            rows={3}
                            disabled={isLoading}
                            wrap="soft"
                            className="break-all whitespace-pre-wrap"
                        />
                    </div>

                    {/* Privacy Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/50">
                        <div>
                            <Label className="font-medium">{t("wishlist.privateList")}</Label>
                            <p className="text-xs text-muted-foreground mt-1">{t("wishlist.onlyYouCanSee")}</p>
                        </div>
                        <Switch checked={isPrivate} onCheckedChange={setIsPrivate} disabled={isLoading} />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 justify-end pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                            className="bg-transparent"
                        >
                            {t("common.cancel")}
                        </Button>
                        <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90">
                            {isLoading ? t("common.loading") : t("common.save")}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
