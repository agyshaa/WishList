import { cleanPrice, calculateDiscountPercent } from "../utils"
import type { ProductData } from "../types"
import { UniversalParser } from "../universal"

/**
 * Allo.ua parser: extracts prices from window.priceConfig JSON blob (SSR injected).
 * Structure: priceConfig = { price: { price: 11999, old_price: 19999, ... } }
 */
export class AlloParser extends UniversalParser {
    parse(url: string, html: string): ProductData {
        const result = super.parse(url, html)

        // allo.ua injects window.priceConfig as an inline script — parse it directly
        let domPrice = 0
        let domOldPrice: number | undefined = undefined

        const priceConfigMatch = html.match(/priceConfig\s*=\s*(\{.{20,2000}?\})\s*;/)
        if (priceConfigMatch) {
            try {
                const config = JSON.parse(priceConfigMatch[1])
                const priceData = config?.price
                if (priceData) {
                    domPrice = cleanPrice(String(priceData.price || 0))
                    const rawOld = cleanPrice(String(priceData.old_price || 0))
                    if (rawOld > domPrice) domOldPrice = rawOld
                    console.log(`[Allo] priceConfig → price: ${domPrice}, old_price: ${rawOld}`)
                }
            } catch (e) {
                console.log(`[Allo] priceConfig parse error`)
            }
        } else {
            console.log(`[Allo] priceConfig not found in HTML`)
        }

        const price = domPrice > 0 ? domPrice : result.price
        const oldPrice = domOldPrice ?? result.oldPrice

        return {
            ...result,
            price,
            oldPrice,
            discount_percent: calculateDiscountPercent(price, oldPrice),
            store_name: "Allo",
        }
    }
}
