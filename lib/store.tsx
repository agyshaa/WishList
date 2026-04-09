"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { User, Wishlist, WishlistItem } from "./types"
import {
    validateWishlistData,
    sanitizeWishlistName,
    sanitizeWishlistDescription,
    sanitizeEmoji,
} from "./validation"

interface SharedList {
    id: string
    accessKey: string
    wishlist: Wishlist
    addedAt: string
}

interface AppState {
    // Auth
    user: User | null
    isLoading: boolean
    login: (email: string, password: string) => Promise<void>
    signup: (name: string, email: string, password: string, username: string) => Promise<void>
    logout: () => void
    updateUser: (updates: Partial<User>) => void

    // Wishlists
    wishlists: Wishlist[]
    createWishlist: (data: { name: string; description: string; emoji: string; isPrivate: boolean }) => Promise<Wishlist>
    updateWishlist: (id: string, updates: Partial<Wishlist>) => void
    deleteWishlist: (id: string) => void
    getWishlistById: (id: string) => Wishlist | undefined
    getWishlistByIdFromApi: (id: string) => Promise<Wishlist | undefined>
    getWishlistByAccessKey: (key: string) => Promise<Wishlist | undefined>
    regenerateAccessKey: (id: string) => Promise<string | null>
    updateWishlistPrivacy: (id: string, isPrivate: boolean) => Promise<void>

    // Items
    addItemToWishlist: (wishlistId: string, item: Omit<WishlistItem, "id" | "addedAt">) => void
    updateItem: (wishlistId: string, itemId: string, updates: Partial<WishlistItem>) => void
    deleteItem: (wishlistId: string, itemId: string) => void
    markItemPurchased: (wishlistId: string, itemId: string) => void

    // Shared Lists
    sharedLists: SharedList[]
    addSharedList: (accessKey: string) => Promise<{ success: boolean; message: string }>
    removeSharedList: (id: string) => void

    // Booked Items
    bookedItems: (WishlistItem & { wishlist?: any })[]
    fetchBookedItems: () => Promise<void>
    bookItem: (itemId: string) => Promise<boolean>
}

const AppContext = createContext<AppState | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [wishlists, setWishlists] = useState<Wishlist[]>([])
    const [sharedLists, setSharedLists] = useState<SharedList[]>([])
    const [bookedItems, setBookedItems] = useState<(WishlistItem & { wishlist?: any })[]>([])

    // Fetch wishlists from API
    const fetchWishlists = useCallback(async () => {
        try {
            const res = await fetch("/api/wishlists")
            if (res.ok) {
                const data = await res.json()
                // Map DB format to frontend format
                setWishlists(
                    data.wishlists.map((w: any) => ({
                        ...w,
                        items: w.items.map((item: any) => ({
                            ...item,
                            addedAt: item.addedAt,
                        })),
                    }))
                )
            }
        } catch (error) {
            console.error("Failed to fetch wishlists:", error)
        }
    }, [])

    // Check auth status on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch("/api/auth/me")
                const data = await res.json()
                if (data.user) {
                    setUser({
                        ...data.user,
                        wishlists: [],
                    })
                }
            } catch (error) {
                console.error("Auth check failed:", error)
            } finally {
                setIsLoading(false)
            }
        }
        checkAuth()
    }, [])

    // Fetch wishlists when user changes
    useEffect(() => {
        if (user) {
            fetchWishlists()
            fetchBookedItems()
            // Load shared lists from localStorage (shared lists are client-side concept)
            const savedShared = localStorage.getItem("wishlist_shared")
            if (savedShared) {
                setSharedLists(JSON.parse(savedShared))
            }
        } else {
            setWishlists([])
            setSharedLists([])
            setBookedItems([])
        }
    }, [user, fetchWishlists])

    // Save shared lists to localStorage
    useEffect(() => {
        if (user && sharedLists.length > 0) {
            localStorage.setItem("wishlist_shared", JSON.stringify(sharedLists))
        }
    }, [sharedLists, user])

    // Auth functions
    const login = async (email: string, password: string) => {
        setIsLoading(true)
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Login failed")
            }

            const data = await res.json()
            setUser({ ...data.user, wishlists: [] })
        } finally {
            setIsLoading(false)
        }
    }

    const signup = async (name: string, email: string, password: string, username: string) => {
        setIsLoading(true)
        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, username, password }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Signup failed")
            }

            const data = await res.json()
            setUser({ ...data.user, wishlists: [] })
        } catch (error) {
            console.error("Signup error:", error)
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const logout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" })
        } catch (error) {
            console.error("Logout error:", error)
        }
        setUser(null)
        setWishlists([])
        localStorage.removeItem("wishlist_shared")
    }

    const updateUser = async (updates: Partial<User>) => {
        try {
            const res = await fetch("/api/user", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            })

            if (res.ok) {
                const data = await res.json()
                setUser((prev) => (prev ? { ...prev, ...data.user, wishlists: prev.wishlists } : null))
            }
        } catch (error) {
            console.error("Update user error:", error)
        }
    }

    // Wishlist functions
    const createWishlist = async (data: {
        name: string
        description: string
        emoji: string
        isPrivate: boolean
    }): Promise<Wishlist> => {
        const validatedData = validateWishlistData(data)

        const res = await fetch("/api/wishlists", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(validatedData),
        })

        if (!res.ok) {
            throw new Error("Failed to create wishlist")
        }

        const result = await res.json()
        const newWishlist = result.wishlist
        setWishlists((prev) => [newWishlist, ...prev])
        return newWishlist
    }

    const updateWishlist = async (id: string, updates: Partial<Wishlist>) => {
        try {
            const validatedUpdates: Partial<Wishlist> = {}

            if (updates.name !== undefined) {
                validatedUpdates.name = sanitizeWishlistName(updates.name)
            }
            if (updates.description !== undefined) {
                validatedUpdates.description = sanitizeWishlistDescription(updates.description || "")
            }
            if (updates.emoji !== undefined) {
                validatedUpdates.emoji = sanitizeEmoji(updates.emoji)
            }
            if (updates.isPrivate !== undefined) {
                validatedUpdates.isPrivate = Boolean(updates.isPrivate)
            }

            const res = await fetch(`/api/wishlists/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(validatedUpdates),
            })

            if (res.ok) {
                const data = await res.json()
                setWishlists((prev) => prev.map((w) => (w.id === id ? data.wishlist : w)))
            }
        } catch (error) {
            console.error("Update wishlist error:", error)
        }
    }

    const deleteWishlist = async (id: string) => {
        try {
            const res = await fetch(`/api/wishlists/${id}`, { method: "DELETE" })
            if (res.ok) {
                setWishlists((prev) => prev.filter((w) => w.id !== id))
            }
        } catch (error) {
            console.error("Delete wishlist error:", error)
        }
    }

    const getWishlistById = (id: string) => {
        return wishlists.find((w) => w.id === id)
    }

    const getWishlistByIdFromApi = async (id: string): Promise<Wishlist | undefined> => {
        try {
            const res = await fetch(`/api/wishlists/${id}`)
            if (res.ok) {
                const data = await res.json()
                return data.wishlist
            }
        } catch (error) {
            console.error("Get wishlist from API error:", error)
        }
        return undefined
    }

    const getWishlistByAccessKey = async (key: string): Promise<Wishlist | undefined> => {
        try {
            const res = await fetch(`/api/wishlists/shared?key=${encodeURIComponent(key)}`)
            if (res.ok) {
                const data = await res.json()
                return data.wishlist
            }
        } catch (error) {
            console.error("Get shared wishlist error:", error)
        }
        return undefined
    }

    // Item functions
    const addItemToWishlist = async (wishlistId: string, item: Omit<WishlistItem, "id" | "addedAt">) => {
        try {
            const res = await fetch(`/api/wishlists/${wishlistId}/items`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(item),
            })

            if (res.ok) {
                const data = await res.json()
                setWishlists((prev) =>
                    prev.map((w) =>
                        w.id === wishlistId
                            ? { ...w, items: [...w.items, data.item], updatedAt: new Date().toISOString() }
                            : w
                    )
                )
            }
        } catch (error) {
            console.error("Add item error:", error)
        }
    }

    const updateItem = async (wishlistId: string, itemId: string, updates: Partial<WishlistItem>) => {
        try {
            const res = await fetch(`/api/wishlists/${wishlistId}/items/${itemId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            })

            if (res.ok) {
                const data = await res.json()
                setWishlists((prev) =>
                    prev.map((w) =>
                        w.id === wishlistId
                            ? {
                                ...w,
                                items: w.items.map((item) => (item.id === itemId ? data.item : item)),
                                updatedAt: new Date().toISOString(),
                            }
                            : w
                    )
                )
            }
        } catch (error) {
            console.error("Update item error:", error)
        }
    }

    const deleteItem = async (wishlistId: string, itemId: string) => {
        try {
            const res = await fetch(`/api/wishlists/${wishlistId}/items/${itemId}`, { method: "DELETE" })
            if (res.ok) {
                setWishlists((prev) =>
                    prev.map((w) =>
                        w.id === wishlistId
                            ? { ...w, items: w.items.filter((item) => item.id !== itemId), updatedAt: new Date().toISOString() }
                            : w
                    )
                )
            }
        } catch (error) {
            console.error("Delete item error:", error)
        }
    }

    const markItemPurchased = (wishlistId: string, itemId: string) => {
        updateItem(wishlistId, itemId, { priority: "low" as const })
    }

    // Shared lists functions
    const addSharedList = async (accessKey: string): Promise<{ success: boolean; message: string }> => {
        const normalizedKey = accessKey.toUpperCase().trim()

        // Check if already added
        if (sharedLists.some((s) => s.accessKey === normalizedKey)) {
            return { success: false, message: "This list is already in your shared lists." }
        }

        // Fetch from API
        const wishlist = await getWishlistByAccessKey(normalizedKey)

        if (wishlist) {
            const newShared: SharedList = {
                id: crypto.randomUUID(),
                accessKey: normalizedKey,
                wishlist,
                addedAt: new Date().toISOString(),
            }
            setSharedLists((prev) => [...prev, newShared])
            return { success: true, message: "List added successfully!" }
        }

        return { success: false, message: "Invalid access key. Please check and try again." }
    }

    const removeSharedList = (id: string) => {
        setSharedLists((prev) => prev.filter((s) => s.id !== id))
    }

    const fetchBookedItems = async () => {
        try {
            const res = await fetch("/api/user/booked-items")
            if (res.ok) {
                const data = await res.json()
                setBookedItems(data.items || [])
            }
        } catch (error) {
            console.error("Fetch booked items error:", error)
        }
    }

    const bookItem = async (itemId: string): Promise<boolean> => {
        try {
            const res = await fetch(`/api/items/${itemId}/book`, { method: "POST" })
            if (res.ok) {
                const data = await res.json()
                // Update local state if needed via refetching
                await fetchBookedItems()
                return data.isBooked
            }
        } catch (error) {
            console.error("Book item error:", error)
        }
        return false
    }

    const regenerateAccessKey = async (id: string): Promise<string | null> => {
        try {
            const res = await fetch(`/api/wishlists/${id}/access-key`, { method: "POST" })
            if (res.ok) {
                const data = await res.json()
                setWishlists((prev) => prev.map((w) => (w.id === id ? data.wishlist : w)))
                return data.accessKey
            }
        } catch (error) {
            console.error("Regenerate access key error:", error)
        }
        return null
    }

    const updateWishlistPrivacy = async (id: string, isPrivate: boolean): Promise<void> => {
        try {
            await updateWishlist(id, { isPrivate })
        } catch (error) {
            console.error("Update wishlist privacy error:", error)
        }
    }

    return (
        <AppContext.Provider
            value={{
                user,
                isLoading,
                login,
                signup,
                logout,
                updateUser,
                wishlists,
                createWishlist,
                updateWishlist,
                deleteWishlist,
                getWishlistById,
                getWishlistByIdFromApi,
                getWishlistByAccessKey,
                addItemToWishlist,
                updateItem,
                deleteItem,
                markItemPurchased,
                sharedLists,
                addSharedList,
                removeSharedList,
                bookedItems,
                fetchBookedItems,
                bookItem,
                regenerateAccessKey,
                updateWishlistPrivacy,
            }}
        >
            {children}
        </AppContext.Provider>
    )
}

export function useApp() {
    const context = useContext(AppContext)
    if (context === undefined) {
        throw new Error("useApp must be used within an AppProvider")
    }
    return context
}
