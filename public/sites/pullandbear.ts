import * as cheerio from "cheerio"
import type { ProductData } from "../types"
import { cleanPrice, cleanText, calculateDiscountPercent } from "../utils"
import { detectDiscount } from "../smart-discount"
import { UniversalParser } from "../universal"

/**
 * Pull & Bear parser: relies on JSON-LD (SPA site with SSR) + DOM fallbacks
 */
export class PullAndBearParser extends UniversalParser {
    parse(url: string, html: string): ProductData {
        let ldData: Partial<ProductData> = {}
        
        // First try universal parser (JSON-LD → OpenGraph)
        try {
            ldData = super.parse(url, html)
            if (ldData.title && ldData.price) {
                return { 
                    ...ldData, 
                    discount_percent: calculateDiscountPercent(ldData.price, ldData.oldPrice),
                    source_url: url, 
                    store_name: "Pull & Bear" 
                } as ProductData
            }
        } catch (e) {
            console.log("[PullAndBear] JSON-LD parsing failed, trying DOM selectors...")
        }

        // Fallback to DOM selectors
        const $ = cheerio.load(html)

        const title = 
            $("h1").first().text().trim() ||
            $("[data-testid='product-name']").first().text().trim() ||
            $(".product-name").first().text().trim() ||
            ldData.title ||
            ""

        let price = 0
        const priceSelectors = [
            "[data-testid='product-price']",
            "[class*='ProductPrice']",
            "[class*='product-price']",
            ".price",
            "[class*='price-amount']",
            "span[class*='Price']",
            "div[class*='Price']",
            "[itemprop='price']",
        ]
        for (const sel of priceSelectors) {
            const p = cleanPrice($(sel).first().text())
            if (p > 0) {
                price = p
                console.log(`[PullAndBear] Found price ${price} with selector: ${sel}`)
                break
            }
        }

        // Fallback to ldData price if DOM extraction failed
        if (price === 0 && ldData.price && ldData.price > 0) {
            price = ldData.price
            console.log(`[PullAndBear] Using JSON-LD price: ${price}`)
        }

        let oldPrice: number | undefined = undefined
        const oldPriceSelectors = [
            "[class*='price-before-discount']",
            "[class*='original-price']",
            "s.price",
            "s",
            "del",
            "[class*='crossed-price']",
            "[class*='compare-at']",
            "[style*='line-through']",
            "[class*='old-price']",
        ]
        for (const sel of oldPriceSelectors) {
            const p = cleanPrice($(sel).first().text())
            if (p > price) {
                oldPrice = p
                console.log(`[PullAndBear] Found oldPrice ${p} with selector: ${sel}`)
                break
            }
        }

        // Use extracted image with smart filtering
        const imageUrl = this.extractImage($, ldData.image_url)

        // SmartDiscount fallback
        if (!oldPrice && price > 0) {
            const smartResult = detectDiscount(html, price, "")
            if (smartResult) {
                oldPrice = smartResult.oldPrice
            }
        }

        const description = 
            $("[data-testid='product-description']").first().text().trim() ||
            $(".product-description").first().text().trim() ||
            ldData.description ||
            ""

        return {
            title: cleanText(title),
            price: price || 0,
            oldPrice,
            discount_percent: calculateDiscountPercent(price, oldPrice),
            currency: "EUR", // Pull & Bear typically uses EUR
            image_url: imageUrl,
            description: cleanText(description),
            source_url: url,
            store_name: "Pull & Bear",
        }
    }

    private extractImage($: cheerio.CheerioAPI, fallbackImage?: string): string {
        // Try fallback image first if valid
        if (fallbackImage && this.isProductImage(fallbackImage)) {
            return fallbackImage
        }

        // Primary selectors for product images
        const selectors = [
            "img[data-testid='product-image']",
            ".product-image img",
            "[class*='ProductImage'] img",
            "img[src*='product']",
            "div.gallery img",
            "img.main-image",
        ]

        for (const selector of selectors) {
            const elements = $(selector)
            for (let i = 0; i < elements.length; i++) {
                const elem = $(elements[i])
                let src = elem.attr("src") || elem.attr("data-src") || ""

                // Filter out non-product images
                if (!src || src.includes("logo") || src.includes("icon") || 
                    src.includes("avatar") || src.includes("placeholder")) {
                    continue
                }

                if (src) {
                    console.log(`[PullAndBear] Found image: ${src.slice(0, 80)}...`)
                    return src
                }
            }
        }

        return fallbackImage || ""
    }
}
