export interface WishlistItem {
  id: string
  title: string
  price: number
  oldPrice?: number | null
  discount_percent?: number | null
  image: string
  store: string
  url: string
  priority: "high" | "medium" | "low"
  notes?: string
  addedAt: string
  isBooked?: boolean
  bookedBy?: { id: string; name: string; username: string; avatar: string } | null
  wishlist?: {
    id: string
    name: string
    user?: {
      id: string
      name: string
      username: string
      avatar: string
    }
  }
}

export interface Wishlist {
  id: string
  name: string
  description?: string
  emoji: string
  isPrivate: boolean
  accessKey?: string
  userId?: string
  user?: { id: string; name: string; username: string; avatar: string }
  items: WishlistItem[]
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  name: string
  username: string
  avatar: string
  bio?: string
  wishlists: Wishlist[]
}
