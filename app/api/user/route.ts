import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAuthUserId } from "@/lib/auth"

// PUT /api/user - Update user profile
export async function PUT(req: Request) {
    try {
        const userId = await getAuthUserId()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const updates = await req.json()

        // Check username uniqueness if changing
        if (updates.username) {
            const existing = await prisma.user.findFirst({
                where: { username: updates.username, NOT: { id: userId } },
            })
            if (existing) {
                return NextResponse.json({ error: "Username already taken" }, { status: 409 })
            }
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(updates.name !== undefined && { name: updates.name }),
                ...(updates.username !== undefined && { username: updates.username }),
                ...(updates.bio !== undefined && { bio: updates.bio }),
                ...(updates.avatar !== undefined && { avatar: updates.avatar }),
            },
            select: { id: true, name: true, username: true, email: true, avatar: true, bio: true },
        })

        return NextResponse.json({ user })
    } catch (error) {
        console.error("Update user error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
