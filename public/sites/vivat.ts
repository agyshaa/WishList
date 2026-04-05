import * as cheerio from "cheerio"
import { cleanPrice, cleanText, calculateDiscountPercent } from "../utils"
import type { ProductData } from "../types"
import { UniversalParser } from "../universal"

export class VivatsParser extends UniversalParser {
    parse(url: string, html: string): ProductData {
        const $ = cheerio.load(html)
        let ldData: Partial<ProductData> = {}
        try { ldData = super.parse(url, html) } catch { }

        const title = $("h1").first().text().trim() ||
            $("[class*='product-name']").first().text().trim() ||
            ldData.title || ""

        const candidatesNew = new Set<number>()
        const candidatesOld = new Set<number>()

        // ============ ЗБИРАЄМО ПОТОЧНУ ЦІНУ ============
        const priceSelectors = [
            ".price-current", ".product-price", ".price", ".current-price",
            "span[class*='price']", "[itemprop='price']", ".product__price"
        ]

        for (const sel of priceSelectors) {
            $(sel).each((_, el) => {
                const p = cleanPrice($(el).text())
                if (p > 0) candidatesNew.add(p)
            })
        }
        if (ldData.price) candidatesNew.add(ldData.price)

        let finalPrice = candidatesNew.size > 0 ? Math.min(...Array.from(candidatesNew)) : 0

        // ============ ЗБИРАЄМО СТАРУ ЦІНУ ============
        const oldPriceSelectors = [
            ".price--old", ".old-price", ".price-old", "[class*='old-price']",
            ".product-price__old", "s", "del", "[style*='line-through']"
        ]

        for (const sel of oldPriceSelectors) {
            $(sel).each((_, el) => {
                const text = $(el).text()
                const p = cleanPrice(text)
                if (p > 0) {
                    console.log(`[Vivats] Знайдено потенційну стару ціну в DOM (${sel}): "${text}" -> ${p}`)
                    candidatesOld.add(p)
                }
            })
        }

        // ДОДАЄМО З JSON-LD
        if (ldData.oldPrice) {
            console.log(`[Vivats] Знайдено стару ціну в JSON-LD: ${ldData.oldPrice}`)
            candidatesOld.add(ldData.oldPrice)
        }

        // Parse inline JSON price blob (vivat SSR injects price object)
        // Pattern: "price":{"retail":999,"promotion":896,"priceRebate":896,"priceWithOutDiscount":999}
        const priceJsonMatch = html.match(/"price"\s*:\s*(\{[^}]{10,200}\})/)
        if (priceJsonMatch) {
            try {
                const priceObj = JSON.parse(priceJsonMatch[1])
                const retail = cleanPrice(String(priceObj.retail || priceObj.priceWithOutDiscount || 0))
                const promotion = cleanPrice(String(priceObj.promotion || priceObj.priceRebate || 0))
                if (promotion > 0) finalPrice = promotion
                if (retail > promotion) candidatesOld.add(retail)
                console.log(`[Vivats] inline price JSON → retail: ${retail}, promotion: ${promotion}`)
            } catch { }
        }

        // Відбираємо стару ціну
        let finalOldPrice: number | undefined = undefined
        const validOldPrices = Array.from(candidatesOld).filter(p => p > finalPrice && p < finalPrice * 5)

        if (validOldPrices.length > 0) {
            finalOldPrice = Math.max(...validOldPrices)
            console.log(`[Vivats] ✅ Обрано стару ціну: ${finalOldPrice} (Нова: ${finalPrice})`)
        } else {
            console.log(`[Vivats] ⚠️ Стару ціну не знайдено або вона менша/рівна новій ціні.`)
        }

        // ============ ІНШІ ДАНІ ============
        let imageUrl = this.extractImage($, url) || ldData.image_url || ""
        const description = $("[data-testid*='description']").first().text().trim() || ldData.description || ""

        return {
            title: cleanText(title),
            price: finalPrice,
            oldPrice: finalOldPrice,
            discount_percent: calculateDiscountPercent(finalPrice, finalOldPrice),
            currency: "UAH",
            image_url: imageUrl,
            description: cleanText(description),
            source_url: url,
            store_name: "Vivat",
        }
    }

    private extractImage($: cheerio.CheerioAPI, url: string): string {
        const og = $('meta[property="og:image"]').attr("content")
        if (og && this.isProductImage(og)) return og

        const selectors = [
            "img[class*='product-image']", "[class*='gallery'] img",
            "[class*='main-image'] img", ".product-photo img"
        ]

        for (const selector of selectors) {
            const elements = $(selector)
            for (let i = 0; i < elements.length; i++) {
                let src = $(elements[i]).attr("src") || $(elements[i]).attr("data-src") || ""
                if (!src || src.includes("logo") || src.includes("icon")) continue

                src = this.makeAbsoluteUrl(src, url)
                if (src && this.isValidImageUrl(src)) return src
            }
        }
        return og || ""
    }

    private isValidImageUrl(src: string): boolean {
        return /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(src) || src.includes("image")
    }
}