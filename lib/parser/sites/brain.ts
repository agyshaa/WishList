import * as cheerio from "cheerio"
import { cleanPrice, cleanText } from "../utils"
import type { ProductData } from "../types"
import { UniversalParser } from "../universal"

/**
 * Brain parser: JSON-LD first, then manual selectors.
 */
export class BrainParser extends UniversalParser {
    parse(url: string, html: string): ProductData {
        let ldData: Partial<ProductData> = {}
        try {
            ldData = super.parse(url, html)
        } catch {}

        // Manual extraction
        const $ = cheerio.load(html)

        const title = this.extractTitle($) || ldData.title || ""
        const domPrice = this.extractPrice($)
        const domOldPrice = this.extractOldPrice($)
        const imageUrl = this.extractImage($) || ldData.image_url || ""
        const description = this.extractDescription($) || ldData.description || ""

        const price = [domPrice, ldData.price || 0].find(p => p > 0) || 0
        let oldPrice = [domOldPrice, ldData.oldPrice].find(p => p !== undefined && p > 0)
        
        if (oldPrice && oldPrice <= price) oldPrice = undefined

        return {
            title: cleanText(title),
            price,
            oldPrice,
            currency: "UAH",
            image_url: imageUrl,
            description: cleanText(description),
            source_url: url,
            store_name: "Brain",
        }
    }

    private extractOldPrice($: cheerio.CheerioAPI): number | undefined {
        // Brain discount is usually in div.old-price or .br-pr-op
        const oldPriceElem = $("div.old-price, span.old-price, .br-pr-op")
        if (oldPriceElem.length) return cleanPrice(oldPriceElem.first().text())
        return undefined
    }

    private extractTitle($: cheerio.CheerioAPI): string {
        // Brain uses h1.main-title or h1.desktop-only-title
        for (const cls of ["main-title", "desktop-only-title"]) {
            const elem = $(`h1.${cls}`)
            if (elem.length) return elem.text().trim()
        }

        // Fallback: any h1
        const h1 = $("h1")
        if (h1.length) return h1.first().text().trim()

        // Fallback: OG title
        const og = $('meta[property="og:title"]').attr("content")
        if (og) return cleanText(og)

        return ""
    }

    private extractPrice($: cheerio.CheerioAPI): number {
        // Primary: div.main-price-block
        const mainBlock = $("div.main-price-block")
        if (mainBlock.length) {
            // Prefer the "new price" specifically if it exists to avoid old prices entirely
            const np = mainBlock.find(".br-pr-np")
            if (np.length) return cleanPrice(np.text())
            // Else use wrapper and strip known old-price tags
            const wrapper = mainBlock.find("div.price-wrapper")
            if (wrapper.length) {
                 const cloned = wrapper.clone()
                 cloned.find(".old-price, .br-pr-op").remove()
                 const cleaned = cleanPrice(cloned.text())
                 if (cleaned > 0) return cleaned
            }
            
            // Clone block and remove old price text so it doesn't get grabbed
            const cloned = mainBlock.clone()
            cloned.find(".old-price, .br-pr-op").remove()
            return cleanPrice(cloned.text())
        }

        // Fallback: any div.br-pr-price
        const priceElem = $("div.br-pr-price")
        if (priceElem.length) {
            const cloned = priceElem.clone()
            cloned.find(".old-price, .br-pr-op").remove()
            return cleanPrice(cloned.text())
        }

        return 0
    }

    private extractImage($: cheerio.CheerioAPI): string {
        const og = $('meta[property="og:image"]').attr("content")
        if (og) return og

        let img = $("img.br-pr-photo")
        if (!img.length) img = $("img#product_main_image")

        if (img.length) {
            let src = img.attr("src") || ""
            if (src && !src.startsWith("http")) {
                src = `https://brain.com.ua${src}`
            }
            return src
        }

        return ""
    }

    private extractDescription($: cheerio.CheerioAPI): string {
        const og = $('meta[property="og:description"]').attr("content")
        if (og) return cleanText(og)

        const descElem = $("div.description-text")
        if (descElem.length) return cleanText(descElem.text())

        return ""
    }
}
