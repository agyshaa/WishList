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
        // Шукаємо по всіх можливих закреслених елементах та класах
        const oldPriceSelectors = [
            ".regular-price", ".old-price", ".price-old", "[class*='old-price']",
            "[class*='crossed-price']", "s", "del", "[style*='line-through']"
        ]

        for (const sel of oldPriceSelectors) {
            $(sel).each((_, el) => {
                const text = $(el).text()
                const p = cleanPrice(text)
                if (p > 0) {
                    console.log(`[KSD] Знайдено потенційну стару ціну в DOM (${sel}): "${text}" -> ${p}`)
                    candidatesOld.add(p)
                }
            })
        }

        // ДОДАЄМО З JSON-LD (це те, що я пропустив минулого разу)
        if (ldData.oldPrice) {
            console.log(`[KSD] Знайдено стару ціну в JSON-LD: ${ldData.oldPrice}`)
            candidatesOld.add(ldData.oldPrice)
        }

        // Відбираємо стару ціну
        let finalOldPrice: number | undefined = undefined
        const validOldPrices = Array.from(candidatesOld).filter(p => p > finalPrice && p < finalPrice * 5)

        if (validOldPrices.length > 0) {
            finalOldPrice = Math.max(...validOldPrices)
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