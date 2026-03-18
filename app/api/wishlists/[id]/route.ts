import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAuthUserId } from "@/lib/auth"

// GET /api/wishlists/[id]
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const userId = await getAuthUserId()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const wishlist = await prisma.wishlist.findFirst({
            where: { id, userId },
            include: { items: { orderBy: { addedAt: "desc" } } },
        })

        if (!wishlist) {
            return NextResponse.json({ error: "Wishlist not found" }, { status: 404 })
        }

        return NextResponse.json({ wishlist })
    } catch (error) {
        console.error("Get wishlist error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// PUT /api/wishlists/[id]
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const userId = await getAuthUserId()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Verify ownership
        const existing = await prisma.wishlist.findFirst({ where: { id, userId } })
        if (!existing) {
            return NextResponse.json({ error: "Wishlist not found" }, { status: 404 })
        }

        const updates = await req.json()
        const wishlist = await prisma.wishlist.update({
            where: { id },
            data: {
                ...(updates.name !== undefined && { name: updates.name }),
                ...(updates.description !== undefined && { description: updates.description }),
                ...(updates.emoji !== undefined && { emoji: updates.emoji }),
                ...(updates.isPrivate !== undefined && { isPrivate: updates.isPrivate }),
            },
            include: { items: true },
        })

        return NextResponse.json({ wishlist })
    } catch (error) {
        console.error("Update wishlist error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// DELETE /api/wishlists/[id]
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const userId = await getAuthUserId()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const existing = await prisma.wishlist.findFirst({ where: { id, userId } })
        if (!existing) {
            return NextResponse.json({ error: "Wishlist not found" }, { status: 404 })
        }

        await prisma.wishlist.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Delete wishlist error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
