import { NextResponse } from "next/server"
import { parseProduct } from "@/lib/parser"

// POST /api/parse — parse a product URL directly (no Python needed)
export async function POST(req: Request) {
    try {
        const { url } = await req.json()

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 })
        }

        // Validate URL
        try {
            new URL(url)
        } catch {
            return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
        }

        const data = await parseProduct(url)

        return NextResponse.json({
            title: data.title || "Unknown Product",
            price: data.price || 0,
            oldPrice: data.oldPrice || null,
            currency: data.currency || "UAH",
            image: data.image_url || "",
            store: data.store_name || "",
            url: data.source_url || url,
            description: data.description || "",
        })
    } catch (error) {
        console.error("Parse error:", error)
        const message = error instanceof Error ? error.message : "Failed to parse URL"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
