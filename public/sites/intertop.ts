import * as cheerio from "cheerio"
import { cleanPrice, cleanText, calculateDiscountPercent } from "../utils"
import { detectDiscount } from "../smart-discount"
import type { ProductData } from "../types"
import { UniversalParser } from "../universal"

/**
 * Intertop parser
 */
export class IntertopParser extends UniversalParser {
    parse(url: string, html: string): ProductData {
        const $ = cheerio.load(html)

        // Try JSON-LD first
        let ldData: Partial<ProductData> = {}
        try {
            ldData = super.parse(url, html)
        } catch {}

        // Intertop price selectors
        let domPrice = 0
        const priceSelectors = [
            "[data-test='product-price']",
            ".product-price",
            "[class*='ProductPrice']",
            ".price",
            "[itemprop='price']",
            "[class*='current-price']",
            "span[class*='price']",
            ".product__price",
        ]

        for (const sel of priceSelectors) {
            const elem = $(sel).first()
            if (elem.length) {
                const p = cleanPrice(elem.text())
                if (p > 0) {
                    domPrice = p
                    console.log(`[Intertop] Found price ${p}`)
                    break
                }
            }
        }

        // Extract old price (discount)
        let domOldPrice = this.extractOldPrice($, html)

        // Product image
        let imageUrl = this.findProductImage($, url)

        // Title
        let title = $("h1").text().trim() ||
                   $("[data-test='product-title']").text().trim() ||
                   ldData.title ||
                   ""

        const price = domPrice || ldData.price || 0
        
        // Prefer DOM oldPrice, fallback to JSON-LD
        let oldPrice = domOldPrice || ldData.oldPrice
        if (oldPrice && oldPrice <= price) oldPrice = undefined

        return {
            title: cleanText(title),
            price,
            oldPrice,
            discount_percent: calculateDiscountPercent(price, oldPrice),
            currency: "UAH",
            image_url: imageUrl,
            description: ldData.description || "",
            source_url: url,
            store_name: "Intertop",
        }
    }

    private extractOldPrice($: cheerio.CheerioAPI, html: string): number | undefined {
        // Intertop shows old/discount prices for items on sale
        
        // Strategy 1: DOM selectors for strikethrough/old prices
        const oldPriceSelectors = [
            "s",  // Strikethrough
            "del",  // Delete tag
            "[style*='line-through']",
            "[class*='old-price']",
            "[class*='original-price']",
            "[class*='compare-at']",
            "[class*='crossed-price']",
            "[class*='price-before-discount']",
        ]
        
        for (const selector of oldPriceSelectors) {
            const elem = $(selector).first()
            if (elem.length) {
                const text = elem.text()
                const price = cleanPrice(text)
                if (price > 0) {
                    console.log(`[Intertop] Found oldPrice ${price} with selector: ${selector}`)
                    return price
                }
            }
        }
        
        // Strategy 2: Look for old price patterns in HTML
        const oldPricePatterns = [
            /was[:\s]*(\d[\d,.]+)/gi,
            /original[:\s]*(\d[\d,.]+)/gi,
            /oldPrice[:\s"']*(\d[\d,.]+)/gi,
        ]
        
        for (const pattern of oldPricePatterns) {
            const match = html.match(pattern)
            if (match) {
                const price = cleanPrice(match[1])
                if (price > 0) {
                    console.log(`[Intertop] Found oldPrice ${price} in HTML`)
                    return price
                }
            }
        }
        
        // SmartDiscount fallback
        const smartResult = detectDiscount(html, 0, "")
        if (smartResult) {
            return smartResult.oldPrice
        }
        
        return undefined
    }

    protected findProductImage($: cheerio.CheerioAPI, url: string): string {
        const og = $('meta[property="og:image"]').attr("content")
        if (og && this.isProductImage(og)) return og

        const selectors = [
            "img[class*='product-image']",
            "img[class*='ProductImage']",
            ".product-gallery img",
            "[class*='main-image'] img",
            "img[alt*='product' i]",
        ]

        for (const sel of selectors) {
            const imgs = $(sel)
            for (let i = 0; i < imgs.length; i++) {
                const src = $(imgs[i]).attr("src") || 
                           $(imgs[i]).attr("data-src") || ""
                
                if (src && this.isProductImage(src)) {
                    return this.makeAbsoluteUrl(src, url)
                }
            }
        }

        return og || ""
    }

    protected isProductImage(url: string): boolean {
        const exclude = [/logo/i, /icon/i, /avatar/i, /placeholder/i]
        return !exclude.some(p => p.test(url))
    }

    protected makeAbsoluteUrl(url: string, baseUrl: string): string {
        if (url.startsWith("http")) return url
        if (url.startsWith("//")) return "https:" + url
        try {
            return new URL(url, baseUrl).href
        } catch {
            return url
        }
    }
}
