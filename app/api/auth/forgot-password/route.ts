import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import crypto from "crypto"

export async function POST(req: Request) {
    try {
        const { email } = await req.json()

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, email: true },
        })

        if (!user) {
            // Don't reveal if email exists for security
            return NextResponse.json({ 
                message: "If this email exists, a reset link will be sent",
                token: null 
            })
        }

        // Generate cryptographically secure token
        const token = crypto.randomBytes(32).toString("hex")
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

        // Delete any existing reset tokens for this user and create new one
        if (user.id) {
            await prisma.passwordResetToken.deleteMany({
                where: { userId: user.id },
            })
        }

        // Store token in database
        await prisma.passwordResetToken.create({
            data: {
                token,
                expiresAt,
                userId: user.id,
            } as any,
        })

        // Return token for in-site use (no email sending)
        const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/reset-password/${token}`

        return NextResponse.json({
            message: "Reset token generated successfully",
            devToken: token,
            devResetLink: resetLink,
            expiresAt,
            email: user.email,
        })
    } catch (error) {
        console.error("Forgot password error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
