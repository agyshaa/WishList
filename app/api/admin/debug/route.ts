import { NextResponse } from "next/server"
import { parseProduct } from "@/lib/parser/index"
import { fetchHtml, clearParseCache } from "@/lib/parser/utils"

export const dynamic = "force-dynamic"

// GET /api/admin/debug?url=...&raw=true&clear-cache=true
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const url = searchParams.get("url") || "https://rozetka.com.ua/ua/razer_rz04_04430200_r3m1/p365481459/"
        const raw = searchParams.get("raw") === "true"
        const usePuppeteer = searchParams.get("puppeteer") === "true"
        const clearCache = searchParams.get("clear-cache") === "true"

        if (clearCache) {
            clearParseCache()
            return NextResponse.json({ message: "Cache cleared successfully" })
        }

        console.log(`[debug] Fetching ${url} (puppeteer=${usePuppeteer})...`)

        // Get HTML
        const html = await fetchHtml(url, usePuppeteer)

        if (raw) {
            // Return raw HTML for inspection
            return new NextResponse(html, {
                headers: { "Content-Type": "text/html; charset=utf-8" }
            })
        }

        // Try parsing
        const data = await parseProduct(url)

        return NextResponse.json({
            title: data.title,
            price: data.price,
            oldPrice: data.oldPrice,
            discount_percent: data.discount_percent,
            store_name: data.store_name,
            image_url: data.image_url ? `${data.image_url.slice(0, 100)}...` : "N/A",
            html_length: html.length,
            html_has_price: /\d+[\s,\.]\d{3,}/.test(html),
            html_preview: html.slice(0, 500)
        })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message, details: error.stack },
            { status: 500 }
        )
    }
}
