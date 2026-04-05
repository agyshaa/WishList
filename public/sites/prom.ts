import { cleanPrice, calculateDiscountPercent } from "../utils"
import type { ProductData } from "../types"
import { UniversalParser } from "../universal"

/**
 * Prom.ua parser: extracts prices from window.ApolloCacheState SSR JSON.
 * Each product entry contains "priceOriginal" (old) and "discountedPrice" (current).
 */
export class PromParser extends UniversalParser {
    parse(url: string, html: string): ProductData {
        const result = super.parse(url, html)

        let domPrice = 0
        let domOldPrice: number | undefined = undefined

        // Extract the product object from the Apollo cache
        // Pattern: "priceOriginal":"5689","discountedPrice":"5220"
        const priceOriginalMatch = html.match(/"priceOriginal"\s*:\s*"(\d+(?:\.\d+)?)"/)
        const discountedPriceMatch = html.match(/"discountedPrice"\s*:\s*"(\d+(?:\.\d+)?)"/)

        if (discountedPriceMatch) {
            domPrice = cleanPrice(discountedPriceMatch[1])
            console.log(`[Prom] discountedPrice: ${domPrice}`)
        }

        if (priceOriginalMatch) {
            const rawOld = cleanPrice(priceOriginalMatch[1])
            const currentPrice = domPrice || result.price
            if (rawOld > currentPrice) {
                domOldPrice = rawOld
            }
            console.log(`[Prom] priceOriginal: ${rawOld}`)
        }

        const price = domPrice > 0 ? domPrice : result.price
        const oldPrice = domOldPrice ?? result.oldPrice

        return {
            ...result,
            price,
            oldPrice,
            discount_percent: calculateDiscountPercent(price, oldPrice),
            store_name: "Prom",
        }
    }
}
