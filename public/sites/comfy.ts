import * as cheerio from "cheerio"
import { cleanPrice, cleanText, calculateDiscountPercent } from "../utils"
import { detectDiscount } from "../smart-discount"
import type { ProductData } from "../types"
import { UniversalParser } from "../universal"

/**
 * Comfy parser: JSON-LD → __PRELOADED_STATE__ → inline JSON price + OG fallback.
 */
export class ComfyParser extends UniversalParser {
  parse(url: string, html: string): ProductData {
    const $ = cheerio.load(html)
    
    // 1. DOM classes - Current price
    let cheerioPrice = 0
    let cheerioOldPrice: number | undefined = undefined

    $(".price__current, .price-value").each((_, el) => {
        if (cheerioPrice > 0) return
        const val = cleanPrice($(el).text())
        if (val > 0) cheerioPrice = val
    })

    // 2. DOM classes - Old price (comprehensive selectors for Comfy)
    const oldPriceSelectors = [
        ".price__old-price",
        ".price__old",
        ".price__compare-price",
        "[class*='price__old']",
        "[class*='old-price']",
        "s.price__current",  // Strikethrough current price
        "del",  // Delete tag
        "[class*='compare-at']",
        "[style*='line-through']",
    ]
    
    for (const selector of oldPriceSelectors) {
        const elem = $(selector).first()
        if (elem.length) {
            const val = cleanPrice(elem.text())
            if (val > 0) {
                cheerioOldPrice = val
                console.log(`[Comfy] Found oldPrice ${val} with selector: ${selector}`)
                break
            }
        }
    }
    
    if (cheerioOldPrice && cheerioOldPrice <= cheerioPrice) {
        cheerioOldPrice = undefined
    }

    // 2. JSON-LD fallback
    let ldData: Partial<ProductData> = {}
    try {
        ldData = super.parse(url, html)
    } catch {}

    // 3. Preloaded State fallback
    const preloadedResult = this.tryPreloadedState($, url)

    // 4. Meta / Inline fallback
    const inlinePrice = this.tryInlineJsonPrice(html)
    const inlineOldPrice = this.tryInlineJsonOldPrice(html)
    const ogTitle = $('meta[property="og:title"]').attr("content") || ""
    const ogImage = $('meta[property="og:image"]').attr("content") || ""
    const ogDescription = $('meta[property="og:description"]').attr("content") || ""
    const ogPrice = cleanPrice($('meta[property="product:price:amount"]').attr("content") || "")

    // Merge attributes safely - extract image with smart filtering
    const title = preloadedResult?.title || ldData.title || ogTitle || ""
    const image_url = this.extractImage($, preloadedResult?.image_url || ldData.image_url || ogImage) || ogImage || ""
    const description = preloadedResult?.description || ldData.description || ogDescription || ""
    
    const priceCandidates = [
        cheerioPrice,
        preloadedResult?.price || 0,
        ldData.price || 0,
        ogPrice,
        inlinePrice
    ]
    const price = priceCandidates.find(p => p > 0) || 0

    const oldPriceCandidates = [
        cheerioOldPrice,
        preloadedResult?.oldPrice,
        ldData.oldPrice,
        inlineOldPrice
    ]
    let oldPrice = oldPriceCandidates.find(p => p !== undefined && p > 0)
    if (oldPrice && oldPrice <= price) oldPrice = undefined

    // SmartDiscount fallback
    if (!oldPrice && price > 0) {
        const smartResult = detectDiscount(html, price, "")
        if (smartResult) {
            oldPrice = smartResult.oldPrice
        }
    }

    return {
        title: cleanText(title),
        price,
        oldPrice,
        discount_percent: calculateDiscountPercent(price, oldPrice),
        currency: "UAH",
        image_url,
        description: cleanText(description),
        source_url: url,
        store_name: "Comfy"
    }
  }

  private tryPreloadedState($: cheerio.CheerioAPI, url: string): ProductData | null {
    const scripts = $("script")

    for (let i = 0; i < scripts.length; i++) {
      const scriptText = $(scripts[i]).html() || ""
      if (scriptText.includes("window.__PRELOADED_STATE__")) {
        try {
          const jsonText = scriptText.split("window.__PRELOADED_STATE__ =")[1]
          const trimmed = jsonText.split("};")[0] + "}"
          const data = JSON.parse(trimmed)

          const product = data?.product?.product
          if (product) {
            // Price extraction: special_price (discounted) > price (current)
            const currentPrice = parseFloat(product.special_price || product.price) || 0
            
            // Old price: if there's special_price, original is regular price
            // Also check for explicit oldPrice, regular_price, originalPrice fields
            let oldPrice: number | undefined = undefined
            
            if (product.special_price && product.price) {
              // Has discount: special_price is current, price is old
              oldPrice = parseFloat(product.price)
            } else if (product.regular_price && product.price) {
              // Sometimes it's regular_price instead
              oldPrice = parseFloat(product.regular_price)
            } else if (product.originalPrice) {
              oldPrice = parseFloat(product.originalPrice)
            } else if (product.compareAtPrice) {
              oldPrice = parseFloat(product.compareAtPrice)
            }
            
            // Validate: oldPrice must be higher than current
            if (oldPrice && oldPrice <= currentPrice) {
              oldPrice = undefined
            }
            
            return {
              title: product.name || "",
              price: currentPrice,
              oldPrice,
              currency: "UAH",
              image_url: product.img || "",
              description: product.description || "",
              source_url: url,
              store_name: "Comfy",
            }
          }
        } catch (e) {
          console.log(`[Comfy] PreloadedState parsing error:`, e)
          continue
        }
      }
    }

    return null
  }

  private tryInlineJsonPrice(html: string): number {
    // Look for price in inline JSON: "price":"49999" or "price":49999
    const patterns = [
      /"price"\s*:\s*"(\d[\d,.]+)"/,
      /"price"\s*:\s*(\d[\d,.]+)/,
      /"product_price"\s*:\s*"?(\d[\d,.]+)/,
      /"special_price"\s*:\s*"?(\d[\d,.]+)/,
    ]

    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match) {
        const price = cleanPrice(match[1])
        if (price > 0) return price
      }
    }

    return 0
  }

  private tryInlineJsonOldPrice(html: string): number | undefined {
    // Look for old/compare price in inline JSON
    const patterns = [
      /"oldPrice"\s*:\s*"?(\d[\d,.]+)/,
      /"compareAtPrice"\s*:\s*"?(\d[\d,.]+)/,
      /"regular_price"\s*:\s*"?(\d[\d,.]+)/,
      /"originalPrice"\s*:\s*"?(\d[\d,.]+)/,
    ]

    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match) {
        const price = cleanPrice(match[1])
        if (price > 0) {
          console.log(`[Comfy] Found oldPrice ${price} in inline JSON`)
          return price
        }
      }
    }

    return undefined
  }

  private extractImage($: cheerio.CheerioAPI, fallbackImage?: string): string {
    // Try OG image first
    if (fallbackImage && this.isProductImage(fallbackImage)) {
      return fallbackImage
    }

    // Primary selectors for Comfy product images
    const selectors = [
      "img.product-image",
      "img[data-testid='product-image']",
      "div.product-gallery img",
      "img.main-image",
      "img[src*='product']",
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
          console.log(`[Comfy] Found image: ${src.slice(0, 80)}...`)
          return src
        }
      }
    }

    // Fallback to provided image if no good product image found
    return fallbackImage || ""
  }
}
