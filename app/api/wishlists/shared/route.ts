import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// GET /api/wishlists/shared?key=WISH-XXX-YYY
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const key = searchParams.get("key")?.toUpperCase().trim()

        if (!key) {
            return NextResponse.json({ error: "Access key is required" }, { status: 400 })
        }

        const wishlist = await prisma.wishlist.findFirst({
            where: { accessKey: key },
            include: {
                user: { select: { id: true, name: true, username: true, avatar: true } },
                items: {
                    orderBy: { addedAt: "desc" },
                    include: { bookedBy: { select: { id: true, name: true, username: true, avatar: true } } },
                },
            },
        })

        if (!wishlist) {
            return NextResponse.json({ error: "Invalid access key" }, { status: 404 })
        }

        // Return wishlist with owner info
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
                items: wishlist.items.map((item) => ({
                    ...item,
                    bookedBy: item.bookedBy,
                })),
                createdAt: wishlist.createdAt,
                updatedAt: wishlist.updatedAt,
            },
        })
    } catch (error) {
        console.error("Shared wishlist error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
