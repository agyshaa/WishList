import * as cheerio from "cheerio"
import { cleanPrice, calculateDiscountPercent } from "../utils"
import type { ProductData } from "../types"
import { UniversalParser } from "../universal"

/**
 * Citrus (ctrs.com.ua) parser:
 * Old price: .old-price (OldPrice_oldPrice__*), current price: .Price_price__*
 */
export class CtrsParser extends UniversalParser {
    parse(url: string, html: string): ProductData {
        const result = super.parse(url, html)
        const $ = cheerio.load(html)

        const oldPriceText = $("[class*='OldPrice_oldPrice']").first().text()
            || $("[class*='old-price']").first().text()

        const domOldPrice = cleanPrice(oldPriceText)

        // Use result.price from JSON-LD (correct), only override old price from DOM
        const price = result.price
        const oldPrice = domOldPrice > price ? domOldPrice : result.oldPrice

        console.log(`[Ctrs] price (JSON-LD): ${price}, old (DOM): ${domOldPrice}`)

        return {
            ...result,
            price,
            oldPrice,
            discount_percent: calculateDiscountPercent(price, oldPrice),
            store_name: "Citrus",
        }
    }
}
