import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { parseProduct } from "@/lib/parser"
import { getAuthUserId } from "@/lib/auth"

/**
 * POST /api/admin/reparse-item
 * 
 * Reparsе a single wishlist item with the latest parser logic.
 * This helps update items that were parsed with old parsers.
 * 
 * Query params:
 * - itemId: wish list item ID to reparse
 * 
 * Usage:
 * POST /api/admin/reparse-item?itemId=123
 */
export async function POST(request: NextRequest) {
    try {
        // Auth check
        const userId = await getAuthUserId()
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const searchParams = request.nextUrl.searchParams
        const itemId = searchParams.get("itemId")

        if (!itemId) {
            return NextResponse.json(
                { error: "itemId is required" },
                { status: 400 }
            )
        }

        // Get the item
        const item = await prisma.wishlistItem.findUnique({
            where: { id: itemId },
            include: {
                wishlist: {
                    select: { userId: true }
                }
            }
        })

        if (!item) {
            return NextResponse.json(
                { error: "Item not found" },
                { status: 404 }
            )
        }

        // Check ownership
        if (item.wishlist.userId !== userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        // Reparse the item
        console.log(`[admin] Reparsing item ${itemId}: ${item.url}`)
        const parsed = await parseProduct(item.url)

        // Update the item with new parsed data
        const updated = await prisma.wishlistItem.update({
            where: { id: itemId },
            data: {
                title: parsed.title || item.title,
                image: parsed.image_url || item.image,
                price: parsed.price || item.price,
                oldPrice: parsed.oldPrice || item.oldPrice,
                store: parsed.store_name || item.store,
            }
        })

        return NextResponse.json({
            success: true,
            item: updated,
            parsed: {
                title: parsed.title,
                price: parsed.price,
                image: parsed.image_url,
                store: parsed.store_name
            }
        })

    } catch (error) {
        console.error("[admin/reparse-item] Error:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        )
    }
}

/**
 * GET /api/admin/reparse-all
 * 
 * Reparse ALL items in user's wishlist that have 0 price or no image.
 * This is useful after parser updates.
 * 
 * Usage:
 * GET /api/admin/reparse-all
 */
export async function GET(request: NextRequest) {
    try {
        // Auth check
        const userId = await getAuthUserId()
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        // Get all items for this user that need reparsing
        const items = await prisma.wishlistItem.findMany({
            where: {
                wishlist: {
                    userId
                },
                OR: [
                    { price: 0 },
                    { image: "" }
                ]
            }
        })

        console.log(`[admin] Found ${items.length} items to reparse`)

        const results = []
        const errors = []

        for (const item of items) {
            try {
                console.log(`[admin] Reparsing: ${item.url}`)
                const parsed = await parseProduct(item.url)

                const updated = await prisma.wishlistItem.update({
                    where: { id: item.id },
                    data: {
                        title: parsed.title || item.title,
                        image: parsed.image_url || item.image,
                        price: parsed.price || item.price,
                        oldPrice: parsed.oldPrice || item.oldPrice,
                        store: parsed.store_name || item.store,
                    }
                })

                results.push({
                    itemId: item.id,
                    title: updated.title,
                    price: updated.price,
                    image: updated.image,
                    status: "success"
                })
            } catch (error) {
                errors.push({
                    itemId: item.id,
                    url: item.url,
                    error: error instanceof Error ? error.message : "Unknown error"
                })
            }
        }

        return NextResponse.json({
            success: true,
            total: items.length,
            updated: results.length,
            failed: errors.length,
            results,
            errors: errors.length > 0 ? errors : undefined
        })

    } catch (error) {
        console.error("[admin/reparse-all] Error:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        )
    }
}
