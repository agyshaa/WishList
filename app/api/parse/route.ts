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

        try {
            const data = await parseProduct(url)

            return NextResponse.json({
                title: data.title || "Unknown Product",
                price: data.price || 0,
                oldPrice: data.oldPrice || null,
                discount_percent: data.discount_percent || null,
                currency: data.currency || "UAH",
                image: data.image_url || "",
                store: data.store_name || "",
                url: data.source_url || url,
                description: data.description || "",
            })
        } catch (parseError) {
            const errorMsg = parseError instanceof Error ? parseError.message : String(parseError)

            // Determine error type and provide helpful message
            let userMessage = "Не вдалося спарсити сторінку"
            let detail = "parse_failed"
            let retryAfter = null

            // Network errors
            if (errorMsg.includes("ENOTFOUND") || errorMsg.includes("getaddrinfo")) {
                userMessage = "❌ Помилка з'єднання з магазином. Перевірте URL або спробуйте пізніше"
                detail = "network_error"
                retryAfter = 30
            }
            // Rate limiting / blocking
            else if (errorMsg.includes("403") || errorMsg.includes("429")) {
                userMessage = "🚫 Магазин заблокував запитання. Спробуйте через 2-5 хвилин..."
                detail = "site_blocked"
                retryAfter = 300
            }
            // Timeout
            else if (errorMsg.includes("timeout") || errorMsg.includes("Timeout")) {
                userMessage = "⏱️ Магазин занадто довго реагує. Спробуйте ще раз..."
                detail = "timeout"
                retryAfter = 30
            }
            // Puppeteer/JS rendering errors
            else if (errorMsg.includes("Puppeteer") || errorMsg.includes("PUPPETEER")) {
                userMessage = "⚠️ Не вдалось завантажити сторінку з JavaScript. Спробуйте пізніше"
                detail = "js_render_failed"
                retryAfter = 60
            }

            console.error(`[api/parse] ${detail}: ${errorMsg}`)

            const response: any = {
                error: userMessage,
                detail,
            }
            if (retryAfter) response.retry_after = retryAfter

            const statusCode = detail === "site_blocked" ? 429 : 400
            return NextResponse.json(response, { status: statusCode })
        }
    } catch (error) {
        console.error("Parse request error:", error)
        const message = error instanceof Error ? error.message : "Failed to parse URL"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
