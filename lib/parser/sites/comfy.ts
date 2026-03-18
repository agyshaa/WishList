import * as cheerio from "cheerio"
import { cleanPrice, cleanText } from "../utils"
import type { ProductData } from "../types"
import { UniversalParser } from "../universal"

/**
 * Comfy parser: JSON-LD → __PRELOADED_STATE__ → inline JSON price + OG fallback.
 */
export class ComfyParser extends UniversalParser {
  parse(url: string, html: string): ProductData {
    const $ = cheerio.load(html)
    
    // 1. DOM classes
    let cheerioPrice = 0
    let cheerioOldPrice: number | undefined = undefined

    $(".price__current, .price-value").each((_, el) => {
        if (cheerioPrice > 0) return
        const val = cleanPrice($(el).text())
        if (val > 0) cheerioPrice = val
    })

    $(".price__old-price, .price__old").each((_, el) => {
        if (cheerioOldPrice !== undefined) return
        const val = cleanPrice($(el).text())
        if (val > 0) cheerioOldPrice = val
    })
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
    const ogTitle = $('meta[property="og:title"]').attr("content") || ""
    const ogImage = $('meta[property="og:image"]').attr("content") || ""
    const ogDescription = $('meta[property="og:description"]').attr("content") || ""
    const ogPrice = cleanPrice($('meta[property="product:price:amount"]').attr("content") || "")

    // Merge attributes safely
    const title = preloadedResult?.title || ldData.title || ogTitle || ""
    const image_url = preloadedResult?.image_url || ldData.image_url || ogImage || ""
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
        ldData.oldPrice
    ]
    let oldPrice = oldPriceCandidates.find(p => p !== undefined && p > 0)
    if (oldPrice && oldPrice <= price) oldPrice = undefined

    return {
        title: cleanText(title),
        price,
        oldPrice,
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
            return {
              title: product.name || "",
              price: parseFloat(product.special_price || product.price) || 0,
              oldPrice: product.special_price ? parseFloat(product.price) : undefined,
              currency: "UAH",
              image_url: product.img || "",
              description: product.description || "",
              source_url: url,
              store_name: "Comfy",
            }
          }
        } catch {
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
}
