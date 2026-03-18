import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAuthUserId } from "@/lib/auth"

// PUT /api/wishlists/[id]/items/[itemId]
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string; itemId: string }> }
) {
    try {
        const { id, itemId } = await params
        const userId = await getAuthUserId()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Verify ownership
        const wishlist = await prisma.wishlist.findFirst({ where: { id, userId } })
        if (!wishlist) {
            return NextResponse.json({ error: "Wishlist not found" }, { status: 404 })
        }

        const updates = await req.json()
        const item = await prisma.wishlistItem.update({
            where: { id: itemId, wishlistId: id },
            data: {
                ...(updates.title !== undefined && { title: updates.title }),
                ...(updates.price !== undefined && { price: updates.price }),
                ...(updates.oldPrice !== undefined && { oldPrice: updates.oldPrice }),
                ...(updates.image !== undefined && { image: updates.image }),
                ...(updates.store !== undefined && { store: updates.store }),
                ...(updates.url !== undefined && { url: updates.url }),
                ...(updates.priority !== undefined && { priority: updates.priority }),
                ...(updates.notes !== undefined && { notes: updates.notes }),
            },
        })

        return NextResponse.json({ item })
    } catch (error) {
        console.error("Update item error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// DELETE /api/wishlists/[id]/items/[itemId]
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string; itemId: string }> }
) {
    try {
        const { id, itemId } = await params
        const userId = await getAuthUserId()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const wishlist = await prisma.wishlist.findFirst({ where: { id, userId } })
        if (!wishlist) {
            return NextResponse.json({ error: "Wishlist not found" }, { status: 404 })
        }

        // Verify item belongs to this wishlist
        const item = await prisma.wishlistItem.findFirst({ where: { id: itemId, wishlistId: id } })
        if (!item) {
            return NextResponse.json({ error: "Item not found" }, { status: 404 })
        }

        await prisma.wishlistItem.delete({ where: { id: itemId } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Delete item error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
