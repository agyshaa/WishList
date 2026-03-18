import * as cheerio from "cheerio"
import { cleanPrice, cleanText, calculateDiscountPercent } from "../utils"
import type { ProductData } from "../types"
import { UniversalParser } from "../universal"

/**
 * Answear parser (answear.com, answear.ua)
 */
export class AnswearParser extends UniversalParser {
    parse(url: string, html: string): ProductData {
        const $ = cheerio.load(html)

        // Try JSON-LD first  
        let ldData: Partial<ProductData> = {}
        try {
            ldData = super.parse(url, html)
        } catch {}

        // Title
        const title = $("h1").first().text().trim() ||
                     $("[class*='product-name']").first().text().trim() ||
                     $("[data-testid*='product-name']").first().text().trim() ||
                     ldData.title ||
                     ""

        // Price - Answear uses specific classes
        let domPrice = 0
        const priceSelectors = [
            "[class*='ProductPrice']",
            "[class*='product-price']",
            "[data-testid*='product-price']",
            ".price",
            "[class*='Price']",
            "[itemprop='price']",
            ".current-price",
            "span[class*='price']",
        ]

        for (const sel of priceSelectors) {
            const elem = $(sel).first()
            if (elem.length) {
                const text = elem.text()
                const p = cleanPrice(text)
                if (p > 0) {
                    domPrice = p
                    console.log(`[Answear] Found price ${p} with selector: ${sel}`)
                    break
                }
            }
        }

        // Image extraction
        let imageUrl = this.extractImage($, url) || ldData.image_url || ""

        // Old price
        let oldPrice: number | undefined = undefined
        const oldPriceSelectors = [
            "[class*='crossed-price']",
            "[class*='old-price']",
            "s.price",
            "s",
            "del",
            "[class*='original-price']",
            "[class*='compare-at']",
            "[style*='line-through']",
            "[class*='price-before-discount']",
        ]
        for (const sel of oldPriceSelectors) {
            const elem = $(sel).first()
            if (elem.length) {
                const p = cleanPrice(elem.text())
                if (p > domPrice) {
                    oldPrice = p
                    console.log(`[Answear] Found oldPrice ${p} with selector: ${sel}`)
                    break
                }
            }
        }

        const description = $("[data-testid*='description']").first().text().trim() ||
                          $("[class*='description']").first().text().trim() ||
                          ldData.description ||
                          ""

        const price = domPrice > 0 ? domPrice : (ldData.price || 0)

        return {
            title: cleanText(title),
            price,
            oldPrice,
            discount_percent: calculateDiscountPercent(price, oldPrice),
            currency: "USD", // Answear often uses USD/EUR
            image_url: imageUrl,
            description: cleanText(description),
            source_url: url,
            store_name: "Answear",
        }
    }

    private extractImage($: cheerio.CheerioAPI, url: string): string {
        // Try OG image
        const og = $('meta[property="og:image"]').attr("content")
        if (og && this.isProductImage(og)) return og

        // Primary selectors - Answear typically has main-image class
        const selectors = [
            "[class*='main-image'] img",
            "[class*='product-image'] img",
            "[class*='gallery'] img",
            "[class*='ProductImage'] img",
            "img[class*='photo']",
            "img[alt*='product' i]",
            "img[data-testid*='image']",
            ".product-photo img",
            "[class*='MainImage'] img",
        ]

        for (const selector of selectors) {
            const elements = $(selector)
            for (let i = 0; i < elements.length; i++) {
                const elem = $(elements[i])
                let src = elem.attr("src") || elem.attr("data-src") || elem.attr("data-image") || ""

                // Filter out non-product and placeholder images
                if (!src || src.includes("logo") || src.includes("icon") || 
                    src.includes("avatar") || src.includes("placeholder") ||
                    src.includes("thumbnail") || src.includes("thumb") ||
                    src.includes("no-image") || src.includes("empty") ||
                    !this.isValidImageUrl(src)) {
                    continue
                }

                src = this.makeAbsoluteUrl(src, url)
                if (src) {
                    console.log(`[Answear] Found image: ${src.slice(0, 80)}...`)
                    return src
                }
            }
        }

        // Fallback: Look for first real image in product container
        const productContainer = $("[class*='product']").first()
        if (productContainer.length) {
            const img = productContainer.find("img").first()
            if (img.length) {
                let src = img.attr("src") || img.attr("data-src") || ""
                if (src && this.isProductImage(src) && !src.includes("no-image")) {
                    src = this.makeAbsoluteUrl(src, url)
                    return src
                }
            }
        }

        return og || ""
    }

    private isValidImageUrl(src: string): boolean {
        return /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(src) || src.includes("image")
    }
}
