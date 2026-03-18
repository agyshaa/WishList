import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAuthUserId } from "@/lib/auth"

function generateAccessKey(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    const part1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
    const part2 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
    return `WISH-${part1}-${part2}`
}

// POST /api/wishlists/[id]/access-key - Regenerate access key
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

        if (!existing.isPrivate) {
            return NextResponse.json({ error: "Can only regenerate access key for private lists" }, { status: 400 })
        }

        const newAccessKey = generateAccessKey()
        const wishlist = await prisma.wishlist.update({
            where: { id },
            data: { accessKey: newAccessKey },
            include: { items: true },
        })

        return NextResponse.json({ wishlist, accessKey: newAccessKey })
    } catch (error) {
        console.error("Regenerate access key error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
