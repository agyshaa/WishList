import * as cheerio from "cheerio"
import { cleanPrice, cleanText, convertUsdToUah, calculateDiscountPercent } from "./utils"
import { detectDiscount } from "./smart-discount"
import type { ProductData, ProductParser } from "./types"

/**
 * Universal parser: tries JSON-LD (Schema.org), then OpenGraph, then <title> fallback.
 * All site-specific parsers extend this as their first attempt.
 */
export class UniversalParser implements ProductParser {
    parse(url: string, html: string): ProductData {
        const $ = cheerio.load(html)

        // Try JSON-LD first
        const jsonLd = this.parseJsonLd($)
        if (jsonLd && jsonLd.price > 0 && jsonLd.title) return jsonLd

        // Try OpenGraph
        const og = this.parseOpenGraph($)
        if (og && og.price > 0 && og.title) return og

        // Try DOM selectors as fallback
        const dom = this.parseDom($, url, html)
        if (dom && dom.price > 0 && dom.title) return dom

        // Fallback: just get the page title
        const title = $("title").text() || ""
        return {
            title: cleanText(title),
            price: 0,
            currency: "",
            image_url: "",
            description: "",
            source_url: url,
            store_name: "",
        }
    }

    /**
     * Try extracting from DOM with common selectors
     */
    protected parseDom($: cheerio.CheerioAPI, url: string, html?: string): ProductData | null {
        // Universal price selectors that work on many sites
        const priceSelectors = [
            "span[class*='price']",
            "[data-testid*='price']",
            ".price-current",
            ".current-price",
            ".product-price",
            "span.price",
            ".item-price",
            "[itemprop='price']",
            "[class*='sale-price']",
            "[class*='current-price']",
            "p[class*='price']",
            "div[class*='price-']",
            ".product__price",
            ".product__sale-price",
            "[class*='new-price']",
            "[data-current-price]",
            "[data-price]",
            ".actual-price",
            ".sell-price",
            ".price-sell",
            ".product-cost",
            "span.big-price",
            ".big-sale-price",
            "meta[itemprop='price']",
        ]

        let price = 0
        for (const sel of priceSelectors) {
            const elem = $(sel).first()
            if (elem.length) {
                const text = elem.text()
                const p = cleanPrice(text)
                if (p > 0) {
                    price = p
                    break
                }
            }
        }

        if (price === 0) return null

        // Title selectors
        const titleSelectors = [
            "h1",
            '[itemprop="name"]',
            "[data-testid*='name']",
            ".product-name",
            ".product-title",
            ".product__title",
            "[class*='product-title']",
            "[class*='product__name']",
        ]
        let title = ""
        for (const sel of titleSelectors) {
            const elem = $(sel).first()
            if (elem.length) {
                title = elem.text().trim()
                if (title) break
            }
        }

        // Image - prefer product image over logo/icon
        let imageUrl = this.findProductImage($, url)

        // Old price detection: Try traditional selectors first, then SmartDiscount
        let oldPrice: number | undefined = undefined
        const oldPriceSelectors = [
            "s",  // Strikethrough
            "del",  // Delete tag
            "span[class*='old-price']",
            "[class*='old-price']",
            "[class*='crossed-price']",
            "[class*='original-price']",
            "[class*='compare-at']",
            "[style*='line-through']",
            "[class*='before-price']",
            "[class*='was-price']",
            "[class*='original']",
            "span.crossed",
            "span.strikethrough",
            "[data-old-price]",
            ".discount-original",
            ".original",
            "del span",
            "s span",
        ]

        for (const sel of oldPriceSelectors) {
            const elem = $(sel).first()
            if (elem.length) {
                const text = elem.text()
                const p = cleanPrice(text)
                if (p > price) {
                    oldPrice = p
                    break
                }
            }
        }

        // Також перевіримо через data атрибути
        if (!oldPrice) {
            const dataOldPrice = $("[data-old-price]").attr("data-old-price")
            if (dataOldPrice) {
                const p = cleanPrice(dataOldPrice)
                if (p > price) {
                    oldPrice = p
                }
            }
        }

        // If still not found, try SmartDiscount engine (multi-method detection)
        if (!oldPrice && price > 0 && html) {
            const smartResult = detectDiscount(html, price, url)
            if (smartResult && smartResult.confidence >= 60) {
                oldPrice = smartResult.oldPrice
                console.log(
                    `[SmartDiscount] 🎯 Found discount via ${smartResult.method} ` +
                    `(confidence: ${smartResult.confidence}%, -${smartResult.discountPercent}%)`
                )
            }
        }

        return {
            title: cleanText(title),
            price,
            oldPrice,
            currency: "UAH",
            image_url: imageUrl,
            description: "",
            source_url: url,
            store_name: "",
        }
    }

    /**
     * Smart image extraction: prioritize product images over logos
     */
    protected findProductImage($: cheerio.CheerioAPI, url: string): string {
        // Try OG image first (usually curated)
        const ogImage = $('meta[property="og:image"]').attr("content")
        if (ogImage && this.isProductImage(ogImage)) {
            return ogImage
        }

        // Look for images in product-specific containers
        const productImageSelectors = [
            "[class*='product-image'] img",
            "[class*='product__image'] img",
            "[class*='product-photo'] img",
            "[class*='ProductImage'] img",
            "[class*='main-image'] img",
            "[class*='primary-image'] img",
            "[data-testid*='product-image'] img",
            "img[alt*='product' i]",
            "img[alt*='Product' i]",
            "img[class*='product' i]",
        ]

        for (const selector of productImageSelectors) {
            const imgs = $(selector)
            for (let i = 0; i < imgs.length; i++) {
                const src = $(imgs[i]).attr("src") || 
                           $(imgs[i]).attr("data-src") ||
                           $(imgs[i]).attr("data-image") ||
                           ""
                
                if (src && this.isProductImage(src)) {
                    return this.makeAbsoluteUrl(src, url)
                }
            }
        }

        // Fallback: get first large image
        const allImages = $("img")
        for (let i = 0; i < Math.min(allImages.length, 10); i++) {
            const src = $(allImages[i]).attr("src") || 
                       $(allImages[i]).attr("data-src") ||
                       ""
            
            if (src && this.isProductImage(src)) {
                return this.makeAbsoluteUrl(src, url)
            }
        }

        return ogImage || ""
    }

    /**
     * Check if URL looks like a product image (not logo/icon/avatar)
     */
    protected isProductImage(url: string): boolean {
        // Exclude common non-product image patterns
        const excludePatterns = [
            /logo/i,
            /icon/i,
            /avatar/i,
            /placeholder/i,
            /loading/i,
            /spinner/i,
            /badge/i,
            /flag/i,
            /star/i,
            /arrow/i,
            /button/i,
            /data:image/i,
            /\.gif$/i,
            /1x1/i,
            /transparent/i,
        ]

        for (const pattern of excludePatterns) {
            if (pattern.test(url)) return false
        }

        // Include patterns that suggest product image
        const includePatterns = [
            /product/i,
            /photo/i,
            /image/i,
            /picture/i,
            /gallery/i,
            /item/i,
            /\.(jpg|jpeg|png|webp)$/i,
        ]

        return includePatterns.some(p => p.test(url))
    }

    /**
     * Convert relative URL to absolute
     */
    protected makeAbsoluteUrl(url: string, baseUrl: string): string {
        if (url.startsWith("http")) return url
        if (url.startsWith("//")) return "https:" + url
        if (url.startsWith("/")) {
            try {
                return new URL(url, baseUrl).href
            } catch {
                return url
            }
        }
        try {
            return new URL(url, baseUrl).href
        } catch {
            return url
        }
    }

    protected parseJsonLd($: cheerio.CheerioAPI): ProductData | null {
        const scripts = $('script[type="application/ld+json"]')

        for (let i = 0; i < scripts.length; i++) {
            try {
                const text = $(scripts[i]).html()
                if (!text) continue

                const content = JSON.parse(text)

                // JSON-LD can be array or object
                if (Array.isArray(content)) {
                    for (const item of content) {
                        const result = this.extractFromJsonNode(item)
                        if (result) return result
                    }
                } else if (typeof content === "object") {
                    // Check for @graph
                    if (content["@graph"]) {
                        for (const item of content["@graph"]) {
                            const result = this.extractFromJsonNode(item)
                            if (result) return result
                        }
                    } else {
                        const result = this.extractFromJsonNode(content)
                        if (result) return result
                    }
                }
            } catch {
                continue
            }
        }

        return null
    }

    protected extractFromJsonNode(node: any): ProductData | null {
        const type = node?.["@type"]
        if (!["Product", "ItemPage", "SoftwareApplication"].includes(type)) {
            return null
        }

        // Sometimes Product is nested in mainEntity
        if (!node.name && node.mainEntity) {
            return this.extractFromJsonNode(node.mainEntity)
        }

        const name = node.name
        if (!name) return null

        const description = node.description || ""

        // Handle image (can be string, array, or object)
        let image = node.image || ""
        if (Array.isArray(image)) image = image[0]
        if (typeof image === "object") image = image?.url || ""

        // Handle offers
        let price = 0
        let oldPrice: number | undefined = undefined
        let currency = ""
        const offers = node.offers

        if (offers && typeof offers === "object" && !Array.isArray(offers)) {
            price = offers.price || offers.lowPrice || 0
            oldPrice = offers.highPrice || offers.originalPrice || undefined
            currency = offers.priceCurrency || ""
        } else if (Array.isArray(offers) && offers.length > 0) {
            const offer = offers[0]
            price = offer.price || offer.lowPrice || 0
            oldPrice = offer.highPrice || offer.originalPrice || undefined
            currency = offer.priceCurrency || ""
        }

        // Convert USD to UAH if needed
        if (price > 0 && (currency === "USD" || currency === "$")) {
            price = convertUsdToUah(price)
            if (oldPrice && oldPrice > 0) oldPrice = convertUsdToUah(oldPrice)
            currency = "UAH"
        }

        const finalPrice = price ? cleanPrice(String(price)) : 0
        let finalOldPrice = oldPrice ? cleanPrice(String(oldPrice)) : undefined
        if (finalOldPrice && finalOldPrice <= finalPrice) finalOldPrice = undefined

        return {
            title: cleanText(name),
            price: finalPrice,
            oldPrice: finalOldPrice,
            discount_percent: calculateDiscountPercent(finalPrice, finalOldPrice),
            currency: currency || "",
            image_url: typeof image === "string" ? image : "",
            description: cleanText(description),
            source_url: "",
            store_name: "",
        }
    }

    protected parseOpenGraph($: cheerio.CheerioAPI): ProductData | null {
        const title = $('meta[property="og:title"]').attr("content")
        if (!title) return null

        const description = $('meta[property="og:description"]').attr("content") || $('meta[name="description"]').attr("content") || ""
        const image = $('meta[property="og:image"]').attr("content") || ""
        
        const priceAmount = $('meta[property="product:price:amount"]').attr("content") || ""
        const salePriceAmount = $('meta[property="product:sale_price:amount"]').attr("content") || ""
        const originalPriceAmount = $('meta[property="product:original_price:amount"]').attr("content") || ""
        const priceCurrency = $('meta[property="product:price:currency"]').attr("content") || ""

        // Prefer sale_price > price
        let price = salePriceAmount ? cleanPrice(salePriceAmount) : (priceAmount ? cleanPrice(priceAmount) : 0)
        
        // Prefer original_price > price (if sale is present)
        let oldPrice: number | undefined = originalPriceAmount ? cleanPrice(originalPriceAmount) : undefined
        if (!oldPrice && salePriceAmount && priceAmount) {
            oldPrice = cleanPrice(priceAmount)
        }
        if (oldPrice && oldPrice <= price) oldPrice = undefined

        let currency = priceCurrency

        // Convert USD to UAH if needed
        if (price > 0 && (currency === "USD" || currency === "$")) {
            price = convertUsdToUah(price)
            if (oldPrice && oldPrice > 0) oldPrice = convertUsdToUah(oldPrice)
            currency = "UAH"
        }

        return {
            title: cleanText(title),
            price,
            oldPrice,
            discount_percent: calculateDiscountPercent(price, oldPrice),
            currency,
            image_url: image,
            description: cleanText(description),
            source_url: "",
            store_name: "",
        }
    }
}
