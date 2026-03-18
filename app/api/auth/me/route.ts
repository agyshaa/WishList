import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAuthUserId } from "@/lib/auth"

export async function GET() {
    try {
        const userId = await getAuthUserId()
        if (!userId) {
            return NextResponse.json({ user: null })
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, username: true, email: true, avatar: true, bio: true },
        })

        return NextResponse.json({ user: user || null })
    } catch (error) {
        console.error("Auth me error:", error)
        return NextResponse.json({ user: null })
    }
}
