import * as cheerio from "cheerio"
import { cleanPrice, cleanText, convertUsdToUah, calculateDiscountPercent } from "../utils"
import type { ProductData } from "../types"
import { UniversalParser } from "../universal"

/**
 * Zakolot.store parser: Використовує Puppeteer для JS рендерингу
 */
export class ZakolotParser extends UniversalParser {

    parse(url: string, html: string): ProductData {
        let ldData: Partial<ProductData> = {}
        try {
            ldData = super.parse(url, html)
        } catch { }

        // Ручне видобування
        const $ = cheerio.load(html)

        let title = ""
        let domPrice = 0
        let domOldPrice: number | undefined = undefined
        let imageUrl = ""
        let description = ""

        // Витяг назви з різних джерел
        title = $("h1").first().text().trim() ||
                $("h2").first().text().trim() ||
                $(".product-title").first().text().trim() ||
                $("[class*='ProductTitle']").first().text().trim() ||
                $("title").text().split("|")[0].trim() ||
                ldData.title ||
                ""

        // Витяг ціни - спробуємо всі можливі селектори
        const priceSelectors = [
            "span[class*='Price'][class*='current']",
            "span[class*='CurrentPrice']",
            "span[class*='price'][class*='current']",
            "[data-testid*='price']",
            "[class*='finalPrice']",
            "span[class*='Price']",
            "div[class*='Price']",
            "p[class*='price']",
            "[class*='product-price']",
            "[class*='productPrice']",
            ".price-tag",
            "span.price",
            "div.price",
        ]

        let attempts = 0
        for (const selector of priceSelectors) {
            if (attempts > 20) break
            const elements = $(selector)
            
            for (let i = 0; i < Math.min(elements.length, 5); i++) {
                const elem = $(elements[i]).clone()
                // Strip out old prices from the DOM node before extracting text
                elem.find("s, del, [class*='old'], [class*='compare-at'], [class*='CompareAt']").remove()
                
                const text = elem.text()
                if (text && text.length > 0) {
                    domPrice = cleanPrice(text)
                    if (domPrice > 0) {
                        console.log(`[Zakolot] Found price ${domPrice} with selector: ${selector}`)
                        break
                    }
                }
            }
            if (domPrice > 0) break
            attempts++
        }

        // Fallback to ldData if DOM extraction failed
        if (domPrice === 0 && ldData.price && ldData.price > 0) {
            console.log(`[Zakolot] Using JSON-LD price: ${ldData.price}`)
            domPrice = ldData.price
        }

        // Витяг старої ціни (знижки)
        const oldPriceSelectors = [
            "span[class*='compare-at']",
            "span[class*='CompareAtPrice']",
            "[class*='old-price']",
            "[class*='oldPrice']",
            "[class*='crossed-price']",
            "[class*='original-price']",
            "[class*='price-before-discount']",
            "s",
            "del",
            "[style*='line-through']"
        ]

        for (const selector of oldPriceSelectors) {
            const elements = $(selector)
            for (let i = 0; i < Math.min(elements.length, 5); i++) {
                const text = $(elements[i]).text()
                if (text && text.length > 0) {
                    const priceVal = cleanPrice(text)
                    if (priceVal > domPrice) {
                        domOldPrice = priceVal
                        console.log(`[Zakolot] Found oldPrice ${priceVal} with selector: ${selector}`)
                        break
                    }
                }
            }
            if (domOldPrice && domOldPrice > 0) break
        }

        // Якщо ціна мала, це USD - конвертуємо (тільки для ручного видобутку)
        if (domPrice > 0 && domPrice < 500) {
            domPrice = convertUsdToUah(domPrice)
            if (domOldPrice && domOldPrice > 0) {
                domOldPrice = convertUsdToUah(domOldPrice)
            }
        }

        // Витяг зображення - фільтруємо логотип, беремо головне фото
        const imageSelectors = [
            "img[class*='ProductImage']",
            "img[class*='product'][class*='image']",
            "img[class*='mainImage']",
            "img[src*='product']",
            "[role='main'] img",
            ".product-image img",
            ".product__image img",
            "img[alt*='product' i]",
            "img[alt*='Product' i]",
            "img[class*='main' i]",
        ]

        for (const selector of imageSelectors) {
            const imgElements = $(selector)
            
            for (let i = 0; i < Math.min(imgElements.length, 5); i++) {
                const imgEl = $(imgElements[i])
                let src = imgEl.attr("src") || 
                         imgEl.attr("data-src") ||
                         imgEl.attr("data-image") ||
                         imgEl.attr("data-lazy-src") ||
                         ""
                
                // Filter out logos/icons
                if (!src || 
                    src.includes("loading") || 
                    src.includes("placeholder") ||
                    src.includes("avatar") ||
                    src.includes("logo") ||
                    src.includes("icon") ||
                    src.includes("data:image")) {
                    continue
                }

                // Prefer larger images (usually the product image)
                const width = imgEl.attr("width")
                const height = imgEl.attr("height")
                const size = (width && height) ? parseInt(width) * parseInt(height) : 0
                
                // Skip very small images (likely icons)
                if (src && size < 10000 && size > 0) {
                    continue
                }

                if (src && src.length > 10) {
                    imageUrl = src
                    console.log(`[Zakolot] Found product image ${src.slice(0, 80)}...`)
                    break
                }
            }
            
            if (imageUrl) break
        }

        // Перетворити відносні URL на абсолютні
        if (imageUrl && !imageUrl.startsWith("http")) {
            try {
                const urlObj = new URL(url)
                imageUrl = new URL(imageUrl, urlObj.origin).href
            } catch { }
        }

        // Витяг опису
        description = $(".product-description").first().text().trim() ||
                      $("[class*='description']").first().text().trim() ||
                      ""

        const price = [domPrice, ldData.price || 0].find(p => p > 0) || 0
        let oldPrice = [domOldPrice, ldData.oldPrice].find(p => p !== undefined && p > 0)
        
        if (oldPrice && oldPrice <= price) oldPrice = undefined

        return {
            title: cleanText(title),
            price,
            oldPrice,
            discount_percent: calculateDiscountPercent(price, oldPrice),
            currency: "UAH",
            image_url: imageUrl || ldData.image_url || "",
            description: cleanText(description || ldData.description || ""),
            source_url: url,
            store_name: "Zakolot",
        }
    }
}
