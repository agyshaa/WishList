import * as cheerio from "cheerio"
import { cleanPrice, cleanText, calculateDiscountPercent } from "../utils"
import { detectDiscount } from "../smart-discount"
import type { ProductData } from "../types"
import { UniversalParser } from "../universal"

export class RozetkaParser extends UniversalParser {
    parse(url: string, html: string): ProductData {
        if (html.includes("Помилка 404") || html.includes("не знайдена")) {
            throw new Error("404: Товар не знайден на Rozetka. Перевірте посилання")
        }

        let ldData: Partial<ProductData> = {}
        try { ldData = super.parse(url, html) } catch { }

        const $ = cheerio.load(html)

        // ============ TITLE ============
        let domTitle = $("h1.product__title, h1").first().text().trim()

        // ============ PRICE (Current) ============
        let domPrice = 0;
        const priceSelectors = [
            "p.product-price__big",  // new class
            "p.product-prices__big", // old class (fallback)
            "div.product-price__big",
            "div.product-price__big.text-2xl",
            "p.product__price"
        ];
        for (const selector of priceSelectors) {
            const price = cleanPrice($(selector).first().text());
            if (price > 0) { domPrice = price; break; }
        }

        // ============ OLD PRICE (Discount) ============
        let domOldPrice: number | undefined;

        // 1. DOM пошук з кращими селекторами
        const oldPriceSelectors = [
            "p.product-price__small",   // new class
            "p.product-prices__small",  // old class (fallback)
            "div.product-price__small",
            ".product-about__price--old", 
            "p.product-price--old", 
            "del",
            ".discount-price",
            "[data-old-price]",
            ".old-price",
            ".original-price",
            "span.price--old",
            "span.price-old",
            ".text-muted.text-decoration-line-through", // Bootstrap style
        ];
        for (const selector of oldPriceSelectors) {
            const oldPrice = cleanPrice($(selector).first().text());
            const basePrice = domPrice > 0 ? domPrice : (ldData.price || 0);
            if (basePrice > 0 && oldPrice > basePrice) {
                domOldPrice = oldPrice;
                break;
            }
        }

        // 2. Скриптовий пошук із розшираними патернами
        if (!domOldPrice) {
            const scriptPatterns = [
                /["']old_price["']\s*:\s*(\d+(?:\.\d+)?)/gi,
                /["']oldPrice["']\s*:\s*(\d+(?:\.\d+)?)/gi,
                /["']original_price["']\s*:\s*(\d+(?:\.\d+)?)/gi,
                /["']originalPrice["']\s*:\s*(\d+(?:\.\d+)?)/gi,
                /["']discount_price["']\s*:\s*(\d+(?:\.\d+)?)/gi,
                /["']discounted["']\s*:\s*(\d+(?:\.\d+)?)/gi,
                /["']before_discount["']\s*:\s*(\d+(?:\.\d+)?)/gi,
                /"priceWas"\s*:\s*(\d+(?:\.\d+)?)/gi,
                /price_was\s*=\s*(\d+(?:\.\d+)?)/gi,
            ];

            const basePrice = domPrice > 0 ? domPrice : (ldData.price || 0);
            
            for (const pattern of scriptPatterns) {
                const matches = html.match(pattern);
                if (matches) {
                    for (const match of matches) {
                        const priceMatch = match.match(/\d+(?:\.\d+)?/);
                        if (priceMatch) {
                            const price = parseFloat(priceMatch[0]);
                            if (basePrice > 0 && price > basePrice) {
                                domOldPrice = price;
                                console.log(`[RozetkaParser] Extracted oldPrice from script: ${price}`);
                                break;
                            }
                        }
                    }
                    if (domOldPrice) break;
                }
            }
        }

        // 3. Пошук через JSON-LD структурені дані в HTML
        if (!domOldPrice) {
            const jsonLdMatches = html.match(/<script type="application\/ld\+json"[^>]*>([^<]+)<\/script>/gi);
            if (jsonLdMatches) {
                const basePrice = domPrice > 0 ? domPrice : (ldData.price || 0);
                for (const match of jsonLdMatches) {
                    try {
                        const jsonStr = match.replace(/<[^>]+>/g, '');
                        const data = JSON.parse(jsonStr);
                        if (data.offers && Array.isArray(data.offers)) {
                            for (const offer of data.offers) {
                                if (offer.price && offer.price < basePrice && basePrice > 0) {
                                    domOldPrice = parseFloat(offer.price);
                                    console.log(`[RozetkaParser] Extracted oldPrice from JSON-LD: ${domOldPrice}`);
                                    break;
                                }
                            }
                        }
                    } catch (e) {
                        // Ігноруємо помилки при парсингу JSON
                    }
                    if (domOldPrice) break;
                }
            }
        }

        // 4. SmartDiscount fallback (універсальна машина для пошуку знижок)
        if (!domOldPrice && domPrice > 0) {
            const smartResult = detectDiscount(html, domPrice, url)
            if (smartResult && smartResult.confidence >= 70) {
                domOldPrice = smartResult.oldPrice
                console.log(
                    `[RozetkaParser] SmartDiscount found via ${smartResult.method} ` +
                    `(confidence: ${smartResult.confidence}%, -${smartResult.discountPercent}%)`
                )
            }
        }

        // ============ ІНШІ ДАНІ ============
        let domImageUrl = $("img.product-photo__picture").first().attr("src") || ""
        let domDescription = cleanText($("div.product-about__description-content").first().text())

        const title = domTitle || ldData.title || ""
        const price = domPrice || ldData.price || 0
        let oldPrice = domOldPrice || ldData.oldPrice

        if (oldPrice && oldPrice <= price) oldPrice = undefined

        return {
            title: cleanText(title),
            price,
            oldPrice,
            discount_percent: calculateDiscountPercent(price, oldPrice),
            currency: "UAH",
            image_url: domImageUrl || ldData.image_url || "",
            description: cleanText(domDescription || ldData.description || ""),
            source_url: url,
            store_name: "Rozetka",
        }
    }
}