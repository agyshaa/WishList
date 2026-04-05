import * as cheerio from "cheerio"
import { cleanPrice, cleanText, calculateDiscountPercent } from "../utils"
import { detectDiscount } from "../smart-discount"
import type { ProductData } from "../types"
import { UniversalParser } from "../universal"

/**
 * Megasport parser
 */
export class MegasportParser extends UniversalParser {
    parse(url: string, html: string): ProductData {
        const $ = cheerio.load(html)

        // Try JSON-LD first
        let ldData: Partial<ProductData> = {}
        try {
            ldData = super.parse(url, html)
        } catch {}

        // Megasport has multiple prices: full price and club card price
        // We need the FULL price (повна ціна), not club card price
        let domPrice = this.extractFullPrice($, html)

        // Try inline JSON if DOM extraction failed
        if (domPrice === 0) {
            domPrice = this.tryInlineJsonPrice(html)
        }

        // Extract old price (discount)
        let domOldPrice = this.extractOldPrice($, html)

        // Product image
        let imageUrl = this.findProductImage($, url)

        // Title
        let title = $("h1.product__title").text().trim() ||
                   $("h1").text().trim() ||
                   ldData.title ||
                   ""

        // Prefer DOM price, fallback to JSON-LD
        const price = domPrice > 0 ? domPrice : (ldData.price || 0)
        
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
            store_name: "Megasport",
        }
    }

    private extractFullPrice($: cheerio.CheerioAPI, html: string): number {
        // Strategy: Find MAIN price (full price, not club card price)
        // Look at the primary price area on the page
        
        // Most important: Search HTML for actual price patterns (4-5 digit numbers)
        // Megasport prices are in format: XXXXX грн or ₴ XXXXX
        const mainPricePatterns = [
            /(\d{4,6})\s*грн/gi,           // 10370 грн
            /₴\s*(\d{4,6})/gi,              // ₴ 10370
            /price["\s:]*(\d{4,6})/gi,      // price: 10370
            /["']price["']:\s*(\d{4,6})/gi, // "price": 10370
        ]

        const foundPrices: number[] = []

        for (const pattern of mainPricePatterns) {
            const matches = html.matchAll(pattern)
            for (const match of matches) {
                const price = parseInt(match[1])
                
                // Only accept 3-6 digit prices (100 to 999999)
                if (price >= 100 && price < 1000000) {
                    foundPrices.push(price)
                }
            }
        }

        // Remove duplicates and get unique prices
        const uniquePrices = Array.from(new Set(foundPrices)).sort((a, b) => b - a)
        
        if (uniquePrices.length > 0) {
            // Return the first (largest) price
            // Full price is always more than club card price
            const bestPrice = uniquePrices[0]
            
            if (uniquePrices.length > 1) {
                console.log(`[Megasport] Found multiple prices: ${uniquePrices.join(", ")} → Using full price: ${bestPrice}`)
            } else {
                console.log(`[Megasport] Found price: ${bestPrice}`)
            }
            return bestPrice
        }

        // Last resort: Use DOM selector for price span
        const priceSpans = [
            ".product-price-current",
            "[class*='current-price']",
            "[itemprop='price']",
            "span[class*='Price']",
        ]

        for (const selector of priceSpans) {
            const elem = $(selector).first()
            if (elem.length) {
                const text = elem.text()
                const price = cleanPrice(text)
                if (price > 100) {
                    console.log(`[Megasport] Found price ${price} via DOM selector: ${selector}`)
                    return price
                }
            }
        }

        return 0
    }

    private tryInlineJsonPrice(html: string): number {
        // Look for price in inline JSON patterns
        const patterns = [
            /"price"\s*:\s*(\d[\d,.]+)/,
            /"productPrice"\s*:\s*(\d[\d,.]+)/,
            /"currentPrice"\s*:\s*(\d[\d,.]+)/,
            /"priceUAH"\s*:\s*(\d[\d,.]+)/,
            /priceUAH[:\s"']*(\d[\d,.]+)/,
            /data-price[:\s"'=]*(\d[\d,.]+)/,
            /{"price[^}]*":\s*(\d[\d,.]+)/,
        ]

        for (const pattern of patterns) {
            const match = html.match(pattern)
            if (match) {
                const price = cleanPrice(match[1])
                if (price > 0) {
                    console.log(`[Megasport] Found price ${price} in inline JSON`)
                    return price
                }
            }
        }

        return 0
    }

    private extractOldPrice($: cheerio.CheerioAPI, html: string): number | undefined {
        // Megasport shows old/original price near discounted items
        // Look for strikethrough text or "original price" indicators
        
        console.log("[Megasport] Searching for oldPrice...")
        
        // Strategy 1: Find crossed-out/strikethrough prices in DOM
        const oldPriceSelectors = [
            "s",  // Strikethrough tag
            "del",  // Delete tag
            "[style*='line-through']",  // CSS strikethrough
            "[class*='old-price']",
            "[class*='original-price']",
            "[class*='compare-at']",
            "span.old-price",
        ]
        
        for (const selector of oldPriceSelectors) {
            const elem = $(selector).first()
            if (elem.length) {
                const text = elem.text()
                const price = cleanPrice(text)
                if (price > 0) {
                    console.log(`[Megasport] Found oldPrice ${price} with selector: ${selector}`)
                    return price
                }
            }
        }
        
        console.log("[Megasport] No oldPrice found in DOM selectors")
        
        // Strategy 2: Look in HTML for old price patterns
        // Megasport might have "was" or original price indicators
        const oldPricePatterns = [
            /was[:\s]*(\d[\d,.]+)/gi,
            /original[:\s]*(\d[\d,.]+)/gi,
            /oldPrice[:\s"']*(\d[\d,.]+)/gi,
            /["']oldPrice["']:\s*(\d[\d,.]+)/,
        ]
        
        for (const pattern of oldPricePatterns) {
            const match = html.match(pattern)
            if (match) {
                const price = cleanPrice(match[1])
                if (price > 0) {
                    console.log(`[Megasport] Found oldPrice ${price} in HTML pattern`)
                    return price
                }
            }
        }
        
        // Strategy 3: SmartDiscount fallback
        const smartResult = detectDiscount(html, 0, "")
        if (smartResult) {
            console.log(`[Megasport] Found oldPrice ${smartResult.oldPrice} via SmartDiscount`)
            return smartResult.oldPrice
        }
        
        console.log("[Megasport] No oldPrice found - product may not have discount")
        return undefined
    }

    protected findProductImage($: cheerio.CheerioAPI, url: string): string {
        // OG image
        const og = $('meta[property="og:image"]').attr("content")
        if (og && this.isProductImage(og)) return og

        // Product image selectors
        const selectors = [
            ".product__image img",
            "[class*='product-image'] img",
            "[class*='main-image'] img",
            ".gallery img",
            "img[data-testid='product-image']",
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
        const exclude = [/logo/i, /icon/i, /avatar/i, /placeholder/i, /loading/i]
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
