import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAuthUserId } from "@/lib/auth"

export async function GET() {
    try {
        const currentUserId = await getAuthUserId()

        // Get all public wishlists with their items
        const publicWishlists = await prisma.wishlist.findMany({
            where: { isPrivate: false },
            include: { 
                items: {
                    where: { isBooked: false } // Only show unbooked items
                } 
            },
            orderBy: { updatedAt: "desc" },
        })

        // Flatten items from all public wishlists, excluding user's own items
        const items = publicWishlists
            .filter(wishlist => wishlist.userId !== currentUserId)
            .flatMap((wishlist) => 
                wishlist.items.map((item) => ({
                ...item,
                wishlistId: wishlist.id,
                wishlistName: wishlist.name,
                wishlistEmoji: wishlist.emoji,
            }))
        )

        return NextResponse.json({ items, count: items.length })
    } catch (error) {
        console.error("Get public items error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
