import * as cheerio from "cheerio"
import { cleanPrice, cleanText, calculateDiscountPercent } from "../utils"
import type { ProductData } from "../types"
import { UniversalParser } from "../universal"

export class KsdParser extends UniversalParser {
    parse(url: string, html: string): ProductData {
        const $ = cheerio.load(html)
        let ldData: Partial<ProductData> = {}
        try { ldData = super.parse(url, html) } catch { }

        const title = $("h1").first().text().trim() ||
            $("[class*='product-title']").first().text().trim() ||
            ldData.title || ""

        const candidatesNew = new Set<number>()
        const candidatesOld = new Set<number>()

        // ============ ЗБИРАЄМО ПОТОЧНУ ЦІНУ ============
        const priceSelectors = [
            ".price", ".club-price", "[class*='Price']", "[itemprop='price']",
            ".product__price", "div[class*='current']"
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
        // ksd.ua main product: old price is an MuiTypography-h4 sibling of the MuiTypography-h2 (current price)
        // in the same parent container. Scoping here avoids picking up prices from related product cards.
        let finalOldPrice: number | undefined = undefined

        const priceH2 = $('[class*="MuiTypography-h2"]').filter((_, el) => /\d{3,}/.test($(el).text())).first()
        if (priceH2.length) {
            const siblingOld = priceH2.parent().find('[class*="MuiTypography-h4"]').first()
            const siblingPrice = cleanPrice(siblingOld.text())
            if (siblingPrice > finalPrice) {
                finalOldPrice = siblingPrice
                console.log(`[KSD] h4 sibling old price: ${finalOldPrice}`)
            }
        }

        // Fallback: generic old-price selectors
        if (!finalOldPrice) {
            const oldPriceSelectors = [
                ".regular-price", ".old-price", ".price-old", "[class*='old-price']",
                "[class*='crossed-price']", "s", "del", "[style*='line-through']"
            ]
            for (const sel of oldPriceSelectors) {
                $(sel).each((_, el) => {
                    const p = cleanPrice($(el).text())
                    if (p > finalPrice) candidatesOld.add(p)
                })
            }
            if (ldData.oldPrice && ldData.oldPrice > finalPrice) candidatesOld.add(ldData.oldPrice)
            const valid = Array.from(candidatesOld).filter(p => p > finalPrice && p < finalPrice * 5)
            if (valid.length > 0) finalOldPrice = Math.min(...valid)
        }

        if (finalOldPrice) {
            console.log(`[KSD] ✅ Обрано стару ціну: ${finalOldPrice} (Нова: ${finalPrice})`)
        } else {
            console.log(`[KSD] ⚠️ Стару ціну не знайдено або вона менша/рівна новій ціні.`)
        }

        // ============ ІНШІ ДАНІ ============
        let imageUrl = this.extractImage($, url) || ldData.image_url || ""
        const description = $("[class*='description']").first().text().trim() || ldData.description || ""

        return {
            title: cleanText(title),
            price: finalPrice,
            oldPrice: finalOldPrice,
            discount_percent: calculateDiscountPercent(finalPrice, finalOldPrice),
            currency: "UAH",
            image_url: imageUrl,
            description: cleanText(description),
            source_url: url,
            store_name: "KSD",
        }
    }

    private extractImage($: cheerio.CheerioAPI, url: string): string {
        const og = $('meta[property="og:image"]').attr("content")
        if (og && this.isProductImage(og)) return og

        const selectors = [
            "[class*='product-image'] img", "[class*='ProductImage'] img",
            "[class*='main-image'] img", ".gallery img"
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