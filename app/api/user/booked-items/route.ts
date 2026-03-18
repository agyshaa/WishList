import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAuthUserId } from "@/lib/auth"

export async function GET() {
    try {
        const userId = await getAuthUserId()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const bookedItems = await prisma.wishlistItem.findMany({
            where: {
                isBooked: true,
                bookedById: userId
            },
            include: {
                wishlist: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                avatar: true,
                                username: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                addedAt: "desc"
            }
        })

        return NextResponse.json({ items: bookedItems })
    } catch (error) {
        console.error("Fetch booked items error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
