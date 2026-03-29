import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"

export async function POST(req: Request) {
    try {
        const { token, newPassword, confirmPassword } = await req.json()

        if (!token || !newPassword || !confirmPassword) {
            return NextResponse.json(
                { error: "Token and passwords are required" },
                { status: 400 }
            )
        }

        if (newPassword !== confirmPassword) {
            return NextResponse.json(
                { error: "Passwords do not match" },
                { status: 400 }
            )
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { error: "Password must be at least 6 characters long" },
                { status: 400 }
            )
        }

        // Find and validate token
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token } as any,
            include: { user: true },
        })

        if (!resetToken) {
            return NextResponse.json(
                { error: "Invalid or expired reset token" },
                { status: 400 }
            )
        }

        // Check if token has expired
        if (new Date() > resetToken.expiresAt) {
            // Delete expired token
            await prisma.passwordResetToken.delete({
                where: { token } as any,
            })
            return NextResponse.json(
                { error: "Reset token has expired" },
                { status: 400 }
            )
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        // Update user password
        await prisma.user.update({
            where: { id: resetToken.userId },
            data: { password: hashedPassword },
        })

        // Delete used token
        await prisma.passwordResetToken.delete({
            where: { token } as any,
        })

        return NextResponse.json({
            message: "Password reset successfully",
            email: (resetToken as any).user?.email || "unknown",
        })
    } catch (error) {
        console.error("Reset password error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
