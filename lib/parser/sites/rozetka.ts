import * as cheerio from "cheerio"
import { cleanPrice, cleanText } from "../utils"
import type { ProductData } from "../types"
import { UniversalParser } from "../universal"

/**
 * Rozetka parser: JSON-LD first, then manual selectors.
 */
export class RozetkaParser extends UniversalParser {
    parse(url: string, html: string): ProductData {
        let ldData: Partial<ProductData> = {}
        try {
            ldData = super.parse(url, html)
        } catch {}

        // Manual extraction
        const $ = cheerio.load(html)

        const titleElem = $("h1.product__title")
        const domTitle = titleElem.text().trim() || ""

        const priceElem = $("p.product-prices__big, div.product-price__big")
        const domPrice = priceElem.length ? cleanPrice(priceElem.first().text()) : 0

        // Try extracting old price (discount)
        const oldPriceElem = $("p.product-prices__small, div.product-price__small")
        const domOldPrice = oldPriceElem.length ? cleanPrice(oldPriceElem.first().text()) : undefined

        const imageElem = $("img.product-photo__picture")
        const domImageUrl = imageElem.attr("src") || ""

        const descElem = $("div.product-about__description-content")
        const domDescription = descElem.length ? cleanText(descElem.text()) : ""

        const title = domTitle || ldData.title || ""
        const price = [domPrice, ldData.price || 0].find(p => p > 0) || 0
        let oldPrice = [domOldPrice, ldData.oldPrice].find(p => p !== undefined && p > 0)
        
        if (oldPrice && oldPrice <= price) oldPrice = undefined

        return {
            title: cleanText(title),
            price,
            oldPrice,
            currency: "UAH",
            image_url: domImageUrl || ldData.image_url || "",
            description: cleanText(domDescription || ldData.description || ""),
            source_url: url,
            store_name: "Rozetka",
        }
    }
}
