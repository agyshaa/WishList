"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Share2, Check } from "lucide-react"

export function ShareProfileButton() {
    const [copied, setCopied] = useState(false)

    const copyProfileLink = () => {
        navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={copyProfileLink}
            className="absolute top-4 right-4 bg-background/50 backdrop-blur-sm border-white/20 hover:bg-background/80 gap-2"
        >
            {copied ? <Check className="w-4 h-4 text-secondary" /> : <Share2 className="w-4 h-4" />}
            {copied ? "Copied!" : "Share"}
        </Button>
    )
}
