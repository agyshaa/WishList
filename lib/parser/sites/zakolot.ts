import * as cheerio from "cheerio"
import { cleanPrice, cleanText, convertUsdToUah } from "../utils"
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
            "[class*='price']",
            "span[class*='Price']",
            "div[class*='Price']",
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
                    if (domPrice > 0) break
                }
            }
            if (domPrice > 0) break
            attempts++
        }

        // Витяг старої ціни (знижки)
        const oldPriceSelectors = [
            "span[class*='compare-at']",
            "span[class*='CompareAtPrice']",
            "[class*='old-price']",
            "[class*='oldPrice']",
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

        // Витяг зображення
        const imageSelectors = [
            "img[class*='ProductImage']",
            "img[class*='product'][class*='image']",
            "img[class*='mainImage']",
            "img[src*='product']",
            "[role='main'] img",
            ".product-image img",
            ".product__image img",
            "img[alt]",
        ]

        for (const selector of imageSelectors) {
            const imgElements = $(selector)
            
            for (let i = 0; i < Math.min(imgElements.length, 5); i++) {
                const src = $(imgElements[i]).attr("src") || 
                           $(imgElements[i]).attr("data-src") ||
                           $(imgElements[i]).attr("data-image") ||
                           ""
                           
                if (src && src.length > 10 && 
                    !src.includes("loading") && 
                    !src.includes("placeholder") &&
                    !src.includes("data:image")) {
                    imageUrl = src
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
            currency: "UAH",
            image_url: imageUrl || ldData.image_url || "",
            description: cleanText(description || ldData.description || ""),
            source_url: url,
            store_name: "Zakolot",
        }
    }
}
