import * as cheerio from "cheerio"
import { cleanPrice, cleanText, convertUsdToUah } from "./utils"
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
        if (jsonLd) return jsonLd

        // Try OpenGraph
        const og = this.parseOpenGraph($)
        if (og) return og

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
        let currency = ""
        const offers = node.offers

        if (offers && typeof offers === "object" && !Array.isArray(offers)) {
            price = offers.price
            currency = offers.priceCurrency || ""
        } else if (Array.isArray(offers) && offers.length > 0) {
            const offer = offers[0]
            price = offer.price || offer.lowPrice || 0
            currency = offer.priceCurrency || ""
        }

        // Convert USD to UAH if needed
        if (price > 0 && (currency === "USD" || currency === "$")) {
            price = convertUsdToUah(price)
            currency = "UAH"
        }

        return {
            title: cleanText(name),
            price: price ? cleanPrice(String(price)) : 0,
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
            currency,
            image_url: image,
            description: cleanText(description),
            source_url: "",
            store_name: "",
        }
    }
}
