import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAuthUserId } from "@/lib/auth"

function generateAccessKey(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    const part1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
    const part2 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
    return `WISH-${part1}-${part2}`
}

// GET /api/wishlists/[id]
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const userId = await getAuthUserId()

        let wishlist
        
        if (userId) {
            // If logged in, can access own wishlist or public wishlist by ID
            wishlist = await prisma.wishlist.findFirst({
                where: { id },
                include: {
                    user: { select: { id: true, name: true, username: true, avatar: true } },
                    items: {
                        orderBy: { addedAt: "desc" },
                        include: { bookedBy: { select: { id: true, name: true, username: true, avatar: true } } },
                    },
                },
            })
        } else {
            // If not logged in, can only access public wishlists
            wishlist = await prisma.wishlist.findFirst({
                where: { id, isPrivate: false },
                include: {
                    user: { select: { id: true, name: true, username: true, avatar: true } },
                    items: {
                        orderBy: { addedAt: "desc" },
                        include: { bookedBy: { select: { id: true, name: true, username: true, avatar: true } } },
                    },
                },
            })
        }

        if (!wishlist) {
            return NextResponse.json({ error: "Wishlist not found" }, { status: 404 })
        }

        return NextResponse.json({
            wishlist: {
                id: wishlist.id,
                name: wishlist.name,
                description: wishlist.description,
                emoji: wishlist.emoji,
                isPrivate: wishlist.isPrivate,
                accessKey: wishlist.accessKey,
                userId: wishlist.userId,
                user: wishlist.user,
                items: wishlist.items,
                createdAt: wishlist.createdAt,
                updatedAt: wishlist.updatedAt,
            },
        })
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
        
        // Handle isPrivate changes - generate or remove accessKey
        const updateData: any = {}
        if (updates.name !== undefined) updateData.name = updates.name
        if (updates.description !== undefined) updateData.description = updates.description
        if (updates.emoji !== undefined) updateData.emoji = updates.emoji
        if (updates.isPrivate !== undefined) {
            updateData.isPrivate = updates.isPrivate
            // If making private, generate accessKey if it doesn't exist
            if (updates.isPrivate && !existing.accessKey) {
                updateData.accessKey = generateAccessKey()
            }
            // If making public, remove accessKey
            if (!updates.isPrivate) {
                updateData.accessKey = null
            }
        }
        
        const wishlist = await prisma.wishlist.update({
            where: { id },
            data: updateData,
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
