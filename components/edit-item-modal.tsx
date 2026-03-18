"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import Image from "next/image"

interface EditItemModalProps {
    isOpen: boolean
    onClose: () => void
    item?: {
        id: string
        title: string
        price: number
        image: string
        store: string
        priority: string
        notes?: string
    } | null
    onSave?: (itemId: string, data: { priority: string; notes: string }) => void
    isLoading?: boolean
}

export function EditItemModal({ isOpen, onClose, item, onSave, isLoading }: EditItemModalProps) {
    const [priority, setPriority] = useState("medium")
    const [notes, setNotes] = useState("")

    useEffect(() => {
        if (isOpen && item) {
            setPriority(item.priority)
            setNotes(item.notes || "")
        }
    }, [isOpen, item])

    const handleSave = () => {
        if (!item) return
        onSave?.(item.id, { priority, notes })
        onClose()
    }

    if (!item) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="glass border-border sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-foreground">Edit Item</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    {/* Item Preview */}
                    <div className="glass rounded-lg p-3 flex items-start gap-3">
                        {item.image ? (
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                                <Image
                                    src={item.image}
                                    alt={item.title}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </div>
                        ) : (
                            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0 text-2xl">
                                📦
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm text-foreground break-all whitespace-pre-wrap">{item.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {item.store && <span>{item.store} · </span>}
                                <span className="text-secondary font-medium">₴{item.price.toLocaleString()}</span>
                            </p>
                        </div>
                    </div>

                    {/* Priority */}
                    <div className="space-y-2">
                        <Label>Priority</Label>
                        <div className="flex gap-2">
                            {[
                                { value: "high", label: "Must Have", color: "bg-primary" },
                                { value: "medium", label: "Want", color: "bg-secondary" },
                                { value: "low", label: "Nice to Have", color: "bg-muted-foreground" },
                            ].map((p) => (
                                <button
                                    key={p.value}
                                    onClick={() => setPriority(p.value)}
                                    disabled={isLoading}
                                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-smooth ${
                                        priority === p.value
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
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            placeholder="Color preference, size, etc..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            disabled={isLoading}
                            className="bg-muted border-border resize-none break-all whitespace-pre-wrap"
                            rows={3}
                            wrap="soft"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={onClose} disabled={isLoading} className="bg-transparent">
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isLoading} className="bg-primary hover:bg-primary/90">
                            {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
