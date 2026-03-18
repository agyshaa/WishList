import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"
import { signToken, createAuthCookie } from "@/lib/auth"

export async function POST(req: Request) {
    try {
        const { name, email, username, password } = await req.json()

        if (!name || !email || !username || !password) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 })
        }

        // Check if user already exists
        const existing = await prisma.user.findFirst({
            where: { OR: [{ email }, { username }] },
        })

        if (existing) {
            const field = existing.email === email ? "email" : "username"
            return NextResponse.json({ error: `User with this ${field} already exists` }, { status: 409 })
        }

        const hashedPassword = await bcrypt.hash(password, 12)

        const user = await prisma.user.create({
            data: { name, email, username, password: hashedPassword },
            select: { id: true, name: true, username: true, email: true, avatar: true, bio: true },
        })

        const token = signToken(user.id)
        const response = NextResponse.json({ user }, { status: 201 })
        response.cookies.set(createAuthCookie(token))

        return response
    } catch (error) {
        console.error("Signup error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
