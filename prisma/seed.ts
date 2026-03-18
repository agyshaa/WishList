import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
    // Delete existing data (order matters: items → wishlists → users)
    await prisma.wishlistItem.deleteMany({})
    await prisma.wishlist.deleteMany({})
    await prisma.user.deleteMany({})

    // Create admin user
    const hashedAdminPassword = await bcrypt.hash("admin123", 10)
    const admin = await prisma.user.create({
        data: {
            name: "Administrator",
            username: "admin",
            email: "admin@wishlist.app",
            password: hashedAdminPassword,
            isAdmin: true,
            avatar: "/placeholder-user.jpg",
            bio: "System Administrator",
        },
    })

    console.log("Admin user created:", {
        email: admin.email,
        username: admin.username,
        isAdmin: admin.isAdmin,
    })

    console.log("\nFor Swagger access:")
    console.log("Email: admin@wishlist.app")
    console.log("Password: admin123")
}

main()
    .catch((error) => {
        console.error("Seed error:", error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
