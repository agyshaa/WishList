import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAuthUserId } from "@/lib/auth"

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getAuthUserId()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id: itemId } = await params
        const item = await prisma.wishlistItem.findUnique({
            where: { id: itemId },
            include: { wishlist: true }
        })

        if (!item) {
            return NextResponse.json({ error: "Item not found" }, { status: 404 })
        }

        // Check if user is the owner of the wishlist
        const isOwner = item.wishlist.userId === userId

        // If user is trying to book their own item
        if (isOwner) {
            return NextResponse.json({ error: "Cannot book your own item" }, { status: 400 })
        }

        // If item is booked by someone else and user is not trying to cancel their own booking
        if (item.isBooked && item.bookedById !== userId) {
            return NextResponse.json({ error: "Item is already booked by someone else" }, { status: 400 })
        }

        // User wants to cancel their own booking
        if (item.isBooked && item.bookedById === userId) {
            const updatedItem = await prisma.wishlistItem.update({
                where: { id: itemId },
                data: {
                    isBooked: false,
                    bookedById: null
                }
            })
            return NextResponse.json({ item: updatedItem, isBooked: false })
        }

        // User wants to book the item
        const updatedItem = await prisma.wishlistItem.update({
            where: { id: itemId },
            data: {
                isBooked: true,
                bookedById: userId
            }
        })

        return NextResponse.json({ item: updatedItem, isBooked: true })
    } catch (error) {
        console.error("Book item error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
