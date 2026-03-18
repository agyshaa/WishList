import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// GET /api/items/public - Get all items from public wishlists
export async function GET() {
    try {
        // Get all public wishlists with their items
        const publicWishlists = await prisma.wishlist.findMany({
            where: { isPrivate: false },
            include: { items: true },
            orderBy: { updatedAt: "desc" },
        })

        // Flatten items from all public wishlists
        const items = publicWishlists.flatMap((wishlist) => 
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
