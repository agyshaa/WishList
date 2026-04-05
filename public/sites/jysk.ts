import * as cheerio from "cheerio"
import { cleanPrice, calculateDiscountPercent } from "../utils"
import type { ProductData } from "../types"
import { UniversalParser } from "../universal"

/**
 * JYSK.ua parser:
 * - current price: .product-price.discountprice / .product-price-value
 * - old price:     .beforeprice / .price-before
 */
export class JyskParser extends UniversalParser {
    parse(url: string, html: string): ProductData {
        const result = super.parse(url, html)
        const $ = cheerio.load(html)

        const curPriceText = $(".product-price.discountprice .product-price-value").first().text()
            || $(".product-price-value").first().text()
        const oldPriceText = $(".beforeprice .product-price-value").first().text()
            || $(".price-before .product-price-value").first().text()
            || $(".beforeprice").first().text()
            || $(".price-before").first().text()

        const domPrice = cleanPrice(curPriceText)
        const domOldPrice = cleanPrice(oldPriceText)

        console.log(`[Jysk] current: "${curPriceText.trim()}" → ${domPrice}, old: "${oldPriceText.trim()}" → ${domOldPrice}`)

        const price = domPrice > 0 ? domPrice : result.price
        const oldPrice = domOldPrice > price ? domOldPrice : result.oldPrice

        return {
            ...result,
            price,
            oldPrice,
            discount_percent: calculateDiscountPercent(price, oldPrice),
            store_name: "jysk.ua",
        }
    }
}
