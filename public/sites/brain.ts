import * as cheerio from "cheerio"
import { cleanPrice, cleanText, calculateDiscountPercent } from "../utils"
import { detectDiscount } from "../smart-discount"
import type { ProductData } from "../types"
import { UniversalParser } from "../universal"

export class BrainParser extends UniversalParser {
    parse(url: string, html: string): ProductData {
        if (html.length < 1000 ||
            (html.includes("<title>404") || html.includes("<title>Error 404")) ||
            (html.toLowerCase().includes("<h1>404") && !html.includes("Jackery"))) {
            throw new Error("404: Товар не знайден на Brain. Перевірте посилання")
        }

        let ldData: Partial<ProductData> = {}
        try {
            ldData = super.parse(url, html)
        } catch { }

        const $ = cheerio.load(html)

        const title = this.extractTitle($) || ldData.title || ""
        const domPrice = this.extractPrice($)
        const domOldPrice = this.extractOldPrice($, domPrice, html)
        const imageUrl = this.extractImage($) || ldData.image_url || ""
        const description = this.extractDescription($) || ldData.description || ""

        const price = [domPrice, ldData.price || 0].find(p => p > 0) || 0
        let oldPrice = [domOldPrice, ldData.oldPrice].find(p => p !== undefined && p > 0)

        if (oldPrice && oldPrice <= price) oldPrice = undefined

        console.log(`[BrainParser] Extracted - title: ${title.substring(0, 50)}, price: ${price}, oldPrice: ${oldPrice}`)

        return {
            title: cleanText(title),
            price,
            oldPrice,
            discount_percent: calculateDiscountPercent(price, oldPrice),
            currency: "UAH",
            image_url: imageUrl,
            description: cleanText(description),
            source_url: url,
            store_name: "Brain",
        }
    }

    private extractOldPrice($: cheerio.CheerioAPI, currentPrice: number, rawHtml: string): number | undefined {
        // Найточніші селектори Brain для старої ціни
        const selectors = [
            ".br-pr-op",
            ".old-price",
            "div.main-price-block s",
            "div.main-price-block del",
            "s",
            "del"
        ]

        for (const sel of selectors) {
            const elems = $(sel)
            for (let i = 0; i < elems.length; i++) {
                const text = $(elems[i]).text().trim()
                if (text) {
                    const price = cleanPrice(text)
                    // Стара ціна обов'язково має бути більшою за поточну
                    if (price > currentPrice && price < currentPrice * 4) {
                        console.log(`[BrainParser] Selected oldPrice: ${price} with selector: ${sel}`)
                        return price
                    }
                }
            }
        }

        // SmartDiscount fallback
        const smartResult = detectDiscount(rawHtml, currentPrice, "")
        if (smartResult) {
            return smartResult.oldPrice
        }

        console.log(`[BrainParser] No oldPrice found`)
        return undefined
    }

    private extractTitle($: cheerio.CheerioAPI): string {
        for (const cls of ["main-title", "desktop-only-title"]) {
            const elem = $(`h1.${cls}`)
            if (elem.length) return elem.text().trim()
        }

        const h1 = $("h1")
        if (h1.length) return h1.first().text().trim()

        const og = $('meta[property="og:title"]').attr("content")
        if (og) return cleanText(og)

        return ""
    }

    private extractPrice($: cheerio.CheerioAPI): number {
        // Спочатку шукаємо суто нову ціну (.br-pr-np), щоб гарантовано не захопити стару
        const np = $(".br-pr-np")
        if (np.length) return cleanPrice(np.first().text())

        // Fallback: клонуємо блок і видаляємо з нього елементи зі старою ціною
        const mainBlock = $("div.main-price-block, div.br-pr-price").first()
        if (mainBlock.length) {
            const cloned = mainBlock.clone()
            cloned.find(".old-price, .br-pr-op, s, del").remove()
            return cleanPrice(cloned.text())
        }

        return 0
    }

    private extractImage($: cheerio.CheerioAPI): string {
        const og = $('meta[property="og:image"]').attr("content")
        if (og && !og.includes("logo")) return og

        const selectors = [
            "img.br-pr-photo",
            "img#product_main_image",
            "img[data-testid='product-photo']",
            "div.product-gallery img",
        ]

        for (const selector of selectors) {
            const elements = $(selector)
            for (let i = 0; i < elements.length; i++) {
                const elem = $(elements[i])
                let src = elem.attr("src") || elem.attr("data-src") || ""

                if (!src || src.includes("logo") || src.includes("icon") || src.includes("placeholder")) {
                    continue
                }

                if (src && !src.startsWith("http")) {
                    src = `https://brain.com.ua${src}`
                }

                if (src) {
                    console.log(`[Brain] Found image: ${src.slice(0, 80)}...`)
                    return src
                }
            }
        }

        return og || ""
    }

    private extractDescription($: cheerio.CheerioAPI): string {
        const og = $('meta[property="og:description"]').attr("content")
        if (og) return cleanText(og)

        const descElem = $("div.description-text")
        if (descElem.length) return cleanText(descElem.text())

        return ""
    }
}