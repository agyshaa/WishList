import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAuthUserId } from "@/lib/auth"

// POST /api/wishlists/[id]/items - Add item to wishlist
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const userId = await getAuthUserId()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Verify ownership
        const wishlist = await prisma.wishlist.findFirst({ where: { id, userId } })
        if (!wishlist) {
            return NextResponse.json({ error: "Wishlist not found" }, { status: 404 })
        }

        const { title, price, oldPrice, discount_percent, image, store, url, priority, notes } = await req.json()

        if (!title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 })
        }

        const item = await prisma.wishlistItem.create({
            data: {
                title,
                price: price || 0,
                oldPrice: oldPrice || null,
                image: image || "",
                store: store || "",
                url: url || "",
                priority: priority || "medium",
                notes: notes || "",
                wishlistId: id,
            },
        })

        return NextResponse.json({ item }, { status: 201 })
    } catch (error) {
        console.error("Add item error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
