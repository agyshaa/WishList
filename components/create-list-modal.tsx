"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Plus, Lock, Globe } from "lucide-react"
import { useState } from "react"
import { useLanguage } from "@/lib/language-context"

interface CreateListModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate?: (list: { name: string; description: string; emoji: string; isPrivate: boolean }) => void
}

const emojis = ["🎂", "🏠", "👗", "💄", "📚", "🎮", "🎁", "✨", "🎄", "💝", "🏖️", "🎓"]

export function CreateListModal({ isOpen, onClose, onCreate }: CreateListModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [emoji, setEmoji] = useState("🎁")
  const [isPrivate, setIsPrivate] = useState(false)
  const { t } = useLanguage()

  const handleCreate = () => {
    onCreate?.({ name, description, emoji, isPrivate })
    setName("")
    setDescription("")
    setEmoji("🎁")
    setIsPrivate(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Plus className="w-5 h-5 text-primary" />
            {t("wishlist.createNew")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Emoji Picker */}
          <div className="space-y-2">
            <Label>{t("wishlist.chooseEmoji")}</Label>
            <div className="flex flex-wrap gap-2">
              {emojis.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={cn(
                    "w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-smooth",
                    emoji === e ? "bg-primary/20 ring-2 ring-primary" : "bg-muted hover:bg-muted/80",
                  )}
                >
                  {e}
                </button>
              ))}
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
              placeholder={t("wishlist.listName")}
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 50))}
              maxLength={50}
              className="bg-muted border-border"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">{t("wishlist.description")} ({t("common.optional")})</Label>
              <span className="text-xs text-muted-foreground">{description.length}/200</span>
            </div>
            <Textarea
              id="description"
              placeholder={t("item.notesOptional")}
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 200))}
              maxLength={200}
              className="bg-muted border-border resize-none break-all whitespace-pre-wrap"
              rows={3}
              wrap="soft"
            />
          </div>

          {/* Privacy Toggle */}
          <div className="flex items-center justify-between p-3 glass rounded-lg">
            <div className="flex items-center gap-3">
              {isPrivate ? <Lock className="w-5 h-5 text-primary" /> : <Globe className="w-5 h-5 text-secondary" />}
              <div>
                <p className="font-medium text-sm">{isPrivate ? t("wishlist.privateList") : t("wishlist.publicList")}</p>
                <p className="text-xs text-muted-foreground">
                  {isPrivate ? t("wishlist.onlyYouCanSee") : t("wishlist.anyoneCanView")}
                </p>
              </div>
            </div>
            <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="bg-transparent">
              {t("common.cancel")}
            </Button>
            <Button onClick={handleCreate} disabled={!name} className="bg-primary hover:bg-primary/90">
              {t("wishlist.createNew")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
