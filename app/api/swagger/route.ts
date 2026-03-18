import { NextResponse } from "next/server"
import { swaggerSpec } from "@/lib/swagger-spec"
import { prisma } from "@/lib/db"
import { getAuthUserId } from "@/lib/auth"

export async function GET() {
    try {
        const userId = await getAuthUserId()

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized - Admin access required" },
                { status: 401 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
        })

        if (!user?.isAdmin) {
            return NextResponse.json(
                { error: "Forbidden - Admin role required" },
                { status: 403 }
            )
        }

        return NextResponse.json(swaggerSpec)
    } catch (error) {
        console.error("Swagger API error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

