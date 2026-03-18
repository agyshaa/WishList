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

export const mockItems: WishlistItem[] = [
  {
    id: "1",
    title: "Sony WH-1000XM5 Wireless Headphones",
    price: 349.99,
    image: "/sony-wireless-headphones-black-premium.jpg",
    store: "Amazon",
    url: "https://amazon.com",
    priority: "high",
    notes: "The midnight black color!",
    addedAt: "2024-01-15",
  },
  {
    id: "2",
    title: "Dyson Airwrap Complete",
    price: 599.99,
    image: "/dyson-airwrap-hair-styler-rose-gold.jpg",
    store: "Dyson",
    url: "https://dyson.com",
    priority: "high",
    addedAt: "2024-01-10",
  },
  {
    id: "3",
    title: "Lego Botanical Collection Orchid",
    price: 49.99,
    image: "/lego-orchid-botanical-purple-white.jpg",
    store: "Lego",
    url: "https://lego.com",
    priority: "medium",
    addedAt: "2024-01-08",
  },
  {
    id: "4",
    title: "Aesop Resurrection Hand Balm",
    price: 39.0,
    image: "/aesop-hand-balm-brown-bottle-minimalist.jpg",
    store: "Aesop",
    url: "https://aesop.com",
    priority: "low",
    addedAt: "2024-01-05",
  },
  {
    id: "5",
    title: "Apple AirPods Pro 2nd Gen",
    price: 249.0,
    image: "/apple-airpods-pro-white-case.jpg",
    store: "Apple",
    url: "https://apple.com",
    priority: "high",
    addedAt: "2024-01-03",
  },
  {
    id: "6",
    title: "Le Creuset Dutch Oven",
    price: 419.95,
    image: "/le-creuset-dutch-oven-flame-orange.jpg",
    store: "Williams Sonoma",
    url: "https://williams-sonoma.com",
    priority: "medium",
    notes: "5.5 quart in Flame color",
    addedAt: "2024-01-01",
  },
]

export const mockWishlists: Wishlist[] = [
  {
    id: "1",
    name: "Birthday Wishlist",
    description: "Things I'd love for my birthday!",
    emoji: "🎂",
    isPrivate: false,
    items: mockItems.slice(0, 3),
    createdAt: "2024-01-01",
    updatedAt: "2024-01-15",
  },
  {
    id: "2",
    name: "Home Upgrades",
    description: "Making my space cozy",
    emoji: "🏠",
    isPrivate: true,
    accessKey: "home-2024-xyz",
    items: mockItems.slice(3, 6),
    createdAt: "2024-01-05",
    updatedAt: "2024-01-10",
  },
]

export const mockUser: User = {
  id: "1",
  name: "Alex Rivera",
  username: "alexr",
  avatar: "/placeholder-user.jpg",
  bio: "Design enthusiast. Coffee lover. Always adding to my wishlists.",
  wishlists: mockWishlists,
}

export const featuredItems: WishlistItem[] = [
  ...mockItems,
  {
    id: "7",
    title: "Kindle Paperwhite",
    price: 139.99,
    image: "/kindle-paperwhite-e-reader-black.jpg",
    store: "Amazon",
    url: "https://amazon.com",
    priority: "medium",
    addedAt: "2024-01-20",
  },
  {
    id: "8",
    title: "Patagonia Better Sweater",
    price: 139.0,
    image: "/patagonia-fleece-jacket-navy-blue.jpg",
    store: "Patagonia",
    url: "https://patagonia.com",
    priority: "low",
    addedAt: "2024-01-18",
  },
]
