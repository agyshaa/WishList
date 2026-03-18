import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAuthUserId } from "@/lib/auth"

function generateAccessKey(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    const part1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
    const part2 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
    return `WISH-${part1}-${part2}`
}

// GET /api/wishlists - Get all wishlists for authenticated user
export async function GET() {
    try {
        const userId = await getAuthUserId()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const wishlists = await prisma.wishlist.findMany({
            where: { userId },
            include: { items: true },
            orderBy: { updatedAt: "desc" },
        })

        return NextResponse.json({ wishlists })
    } catch (error) {
        console.error("Get wishlists error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// POST /api/wishlists - Create a new wishlist
export async function POST(req: Request) {
    try {
        const userId = await getAuthUserId()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { name, description, emoji, isPrivate } = await req.json()

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 })
        }

        const wishlist = await prisma.wishlist.create({
            data: {
                name,
                description: description || "",
                emoji: emoji || "🎁",
                isPrivate: isPrivate ?? false,
                accessKey: isPrivate ? generateAccessKey() : null,
                userId,
            },
            include: { items: true },
        })

        return NextResponse.json({ wishlist }, { status: 201 })
    } catch (error) {
        console.error("Create wishlist error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
