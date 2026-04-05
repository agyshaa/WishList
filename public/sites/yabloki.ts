import * as cheerio from "cheerio"
import { cleanPrice, cleanText, calculateDiscountPercent } from "../utils"
import { detectDiscount } from "../smart-discount"
import type { ProductData } from "../types"
import { UniversalParser } from "../universal"

/**
 * Yabloki (YABLUKA.ua) parser - online store for Apple products and accessories
 */
export class YablokiParser extends UniversalParser {
    parse(url: string, html: string): ProductData {
        // Get base data from parent (JSON-LD parsing)
        let result = super.parse(url, html)
        
        // Enhance with DOM-based oldPrice extraction
        const $ = cheerio.load(html)
        const domOldPrice = this.extractOldPrice($, result.price, html)
        
        if (domOldPrice && domOldPrice > result.price) {
            result.oldPrice = domOldPrice
            result.discount_percent = calculateDiscountPercent(result.price, domOldPrice)
            console.log(`[YablokiParser] Found oldPrice from DOM: ${domOldPrice}, discount: ${result.discount_percent}%`)
        }

        result.store_name = "yabloki.ua"
        return result
    }

    private extractOldPrice($: cheerio.CheerioAPI, currentPrice: number, rawHtml: string): number | undefined {
        // YABLUKA selectors for price comparison
        const oldPriceSelectors = [
            // Strike-through tags
            "s",
            "del",
            "strike",
            
            // Classes commonly used
            "[class*='old-price']",
            "[class*='original-price']",
            "[class*='crossed-price']",
            "[class*='was-price']",
            "[class*='regular-price']",
            "[class*='compare-at']",
            
            // Data attributes
            "[data-old-price]",
            "[data-original-price]",
            
            // Styles
            "[style*='line-through']",
            "[style*='text-decoration: line-through']",
            
            // Within price containers
            ".price s",
            ".price del",
            ".product-price s",
            ".product-price del",
            ".price-container [style*='line-through']",
        ]

        for (const selector of oldPriceSelectors) {
            const elems = $(selector)
            for (let i = 0; i < elems.length; i++) {
                const text = $(elems[i]).text().trim()
                const price = cleanPrice(text)
                if (price > currentPrice) {
                    console.log(`[YablokiParser] Found oldPrice: ${price} with selector: ${selector}`)
                    return price
                }
            }
        }

        // Check all s and del elements for debugging
        const sElements = $("s")
        const delElements = $("del")
        if (sElements.length > 0 || delElements.length > 0) {
            console.log(`[YablokiParser] Found ${sElements.length} <s> and ${delElements.length} <del> tags:`)
            sElements.slice(0, 3).each((_, el) => {
                const text = $(el).text().trim()
                const price = cleanPrice(text)
                console.log(`  <s>: "${text}" (price: ${price})`)
            })
            delElements.slice(0, 3).each((_, el) => {
                const text = $(el).text().trim()
                const price = cleanPrice(text)
                console.log(`  <del>: "${text}" (price: ${price})`)
            })
        } else {
            console.log(`[YablokiParser] No <s> or <del> elements found`)
        }

        // SmartDiscount fallback
        const smartResult = detectDiscount(rawHtml, currentPrice, "")
        if (smartResult) {
            return smartResult.oldPrice
        }

        return undefined
    }
}
