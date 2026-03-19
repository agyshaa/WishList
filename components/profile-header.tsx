"use client"

import type { User } from "@/lib/types"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Settings, Edit3 } from "lucide-react"
import Link from "next/link"
import { useRef } from "react"
import { useApp } from "@/lib/store"

interface ProfileHeaderProps {
  user: User
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const { updateUser } = useApp()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const wishlists = user.wishlists || []
  const totalItems = wishlists.reduce((sum, list) => sum + list.items.length, 0)
  const totalValue = wishlists.reduce((sum, list) => sum + list.items.reduce((s, item) => s + item.price, 0), 0)

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB")
      return
    }

    try {
      // Convert to base64
      const reader = new FileReader()
      reader.onload = async (event) => {
        const base64 = event.target?.result as string
        await updateUser({ avatar: base64 })
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Error uploading avatar:", error)
      alert("Failed to update avatar")
    }
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Avatar */}
        <div className="relative">
          <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity">
            <Image src={user.avatar || "/placeholder.svg"} alt={user.name} fill className="object-cover" />
          </div>
          <button
            onClick={handleAvatarClick}
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground transition-smooth hover:bg-primary/90"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Upload avatar"
          />
        </div>

        {/* Info */}
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl font-bold text-foreground line-clamp-2">{user.name}</h1>
          <p className="text-muted-foreground">@{user.username}</p>
          {user.bio && <p className="text-sm text-muted-foreground mt-2 max-w-md line-clamp-2">{user.bio}</p>}

          {/* Stats */}
          <div className="flex items-center justify-center sm:justify-start gap-6 mt-4">
            <div>
              <p className="text-2xl font-bold text-foreground">{wishlists.length}</p>
              <p className="text-xs text-muted-foreground">Lists</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalItems}</p>
              <p className="text-xs text-muted-foreground">Items</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary">₴{totalValue.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Total Value</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <Button variant="outline" size="icon" className="bg-transparent" asChild>
          <Link href="/profile/settings">
            <Settings className="w-5 h-5" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
