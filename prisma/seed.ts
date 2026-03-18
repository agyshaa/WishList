import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

function generateAccessKey(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    const part1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
    const part2 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
    return `WISH-${part1}-${part2}`
}

async function main() {
    // Check if admin already exists
    let admin = await prisma.user.findUnique({
        where: { email: "admin@wishlist.app" },
    })

    if (!admin) {
        const hashedAdminPassword = await bcrypt.hash("admin123", 10)
        admin = await prisma.user.create({
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

        console.log("✅ Admin user created:", {
            email: admin.email,
            username: admin.username,
            isAdmin: admin.isAdmin,
        })
    } else {
        console.log("✅ Admin user already exists:", {
            email: admin.email,
            username: admin.username,
        })
    }

    // Check if main user already exists
    let mainUser = await prisma.user.findUnique({
        where: { email: "orfi.zer0@gmail.com" },
    })

    if (!mainUser) {
        const hashedPassword = await bcrypt.hash("wBIBMFQ4jgZDXj", 10)
        mainUser = await prisma.user.create({
            data: {
                name: "Orfi Zero",
                username: "orfi.zer0",
                email: "orfi.zer0@gmail.com",
                password: hashedPassword,
                avatar: "/placeholder-user.jpg",
                bio: "WishList User",
            },
        })

        console.log("✅ Main user created:", {
            email: mainUser.email,
            username: mainUser.username,
        })

        // Create test wishlists only if user is new
        const wishlist = await prisma.wishlist.create({
            data: {
                name: "My Wish List",
                description: "Things I want to get",
                emoji: "🎁",
                isPrivate: false,
                userId: mainUser.id,
                items: {
                    create: [
                        {
                            title: "Sony WH-1000XM5 Wireless Headphones",
                            price: 349.99,
                            image: "/placeholder.svg",
                            store: "Amazon",
                            url: "https://amazon.com",
                            priority: "high",
                            notes: "The midnight black color!",
                        },
                        {
                            title: "Dyson Airwrap Complete",
                            price: 599.99,
                            image: "/placeholder.svg",
                            store: "Dyson",
                            url: "https://dyson.com",
                            priority: "high",
                        },
                        {
                            title: "Apple AirPods Pro 2nd Gen",
                            price: 249.0,
                            image: "/placeholder.svg",
                            store: "Apple",
                            url: "https://apple.com",
                            priority: "high",
                        },
                    ],
                },
            },
            include: { items: true },
        })

        // Create private wishlist with access key
        const privateWishlist = await prisma.wishlist.create({
            data: {
                name: "Private Wishlist",
                description: "Only for close friends",
                emoji: "🎉",
                isPrivate: true,
                accessKey: generateAccessKey(),
                userId: mainUser.id,
                items: {
                    create: [
                        {
                            title: "Lego Botanical Collection",
                            price: 49.99,
                            image: "/placeholder.svg",
                            store: "Lego",
                            url: "https://lego.com",
                            priority: "medium",
                        },
                    ],
                },
            },
            include: { items: true },
        })

        console.log("✅ Test data created:")
        console.log("   - Wishlist:", wishlist.name, "with", wishlist.items.length, "items")
        console.log("   - Private Wishlist:", privateWishlist.name, "Access Key:", privateWishlist.accessKey)
    } else {
        console.log("✅ Main user already exists:", {
            email: mainUser.email,
            username: mainUser.username,
        })
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("📝 Credentials:")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("\n🔐 Admin Account:")
    console.log("   Email: admin@wishlist.app")
    console.log("   Password: admin123")
    
    console.log("\n👤 Main User Account:")
    console.log("   Email: orfi.zer0@gmail.com")
    console.log("   Password: wBIBMFQ4jgZDXj")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
}

main()
    .catch((error) => {
        console.error("Seed error:", error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
