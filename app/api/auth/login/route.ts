import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"
import { signToken, createAuthCookie } from "@/lib/auth"

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json()

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, name: true, username: true, email: true, avatar: true, bio: true, password: true },
        })

        if (!user) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
        }

        const passwordValid = await bcrypt.compare(password, user.password)
        if (!passwordValid) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
        }

        const token = signToken(user.id)
        const { password: _, ...userWithoutPassword } = user
        const response = NextResponse.json({ user: userWithoutPassword })
        response.cookies.set(createAuthCookie(token))

        return response
    } catch (error) {
        console.error("Login error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
