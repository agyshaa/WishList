"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, Check, Key, RefreshCw, Lock, Globe } from "lucide-react"
import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface AccessKeyModalProps {
  isOpen: boolean
  onClose: () => void
  accessKey: string
  listName: string
}

function generateAccessKey(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Avoiding confusing chars like O/0, I/1
  const part1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  const part2 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  return `WISH-${part1}-${part2}`
}

export function AccessKeyModal({ isOpen, onClose, accessKey: initialKey, listName }: AccessKeyModalProps) {
  const [copied, setCopied] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)
  const [isPrivate, setIsPrivate] = useState(true)
  const [accessKey, setAccessKey] = useState(initialKey.includes("WISH-") ? initialKey : generateAccessKey())

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/list/${accessKey}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyKey = () => {
    navigator.clipboard.writeText(accessKey)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }

  const regenerateKey = () => {
    setAccessKey(generateAccessKey())
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Key className="w-5 h-5 text-primary" />
            Share &ldquo;{listName}&rdquo;
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Privacy Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
            <div className="flex items-center gap-3">
              {isPrivate ? <Lock className="w-5 h-5 text-primary" /> : <Globe className="w-5 h-5 text-secondary" />}
              <div>
                <Label htmlFor="privacy-toggle" className="font-medium">
                  {isPrivate ? "Private List" : "Public List"}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {isPrivate ? "Only people with the key can view" : "Anyone can find and view this list"}
                </p>
              </div>
            </div>
            <Switch id="privacy-toggle" checked={isPrivate} onCheckedChange={setIsPrivate} />
          </div>

          {isPrivate && (
            <>
              {/* Access Key Display */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Access Key</Label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-muted rounded-xl font-mono text-lg tracking-wider">
                    <span className="text-primary">{accessKey}</span>
                  </div>
                  <Button
                    onClick={handleCopyKey}
                    variant="outline"
                    className="shrink-0 bg-transparent border-border"
                    size="icon"
                  >
                    {copiedKey ? <Check className="w-4 h-4 text-secondary" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button
                    onClick={regenerateKey}
                    variant="outline"
                    className="shrink-0 bg-transparent border-border"
                    size="icon"
                    title="Generate new key"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Share Link */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Or share this link</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/list/${accessKey}`}
                    className="bg-muted border-border text-sm"
                  />
                  <Button onClick={handleCopyLink} className="shrink-0 bg-primary hover:bg-primary/90" size="icon">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="glass rounded-lg p-3 text-sm text-muted-foreground">
                <p>
                  Send this key to friends so they can view your wishlist in their{" "}
                  <span className="text-primary font-medium">&ldquo;Shared with Me&rdquo;</span> tab.
                </p>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="bg-transparent">
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
