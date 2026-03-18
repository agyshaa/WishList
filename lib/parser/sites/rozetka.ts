import * as cheerio from "cheerio"
import { cleanPrice, cleanText, calculateDiscountPercent } from "../utils"
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
            "p.product-prices__big", "div.product-price__big", "p.product__price"
        ];
        for (const selector of priceSelectors) {
            const price = cleanPrice($(selector).first().text());
            if (price > 0) { domPrice = price; break; }
        }

        // ============ OLD PRICE (Discount) ============
        let domOldPrice: number | undefined;

        // 1. DOM пошук
        const oldPriceSelectors = [
            "p.product-prices__small", "div.product-price__small", ".product-about__price--old", "p.product-price--old", "del"
        ];
        for (const selector of oldPriceSelectors) {
            const oldPrice = cleanPrice($(selector).first().text());
            // Використовуємо ldData.price як базу, якщо domPrice ще не знайдено
            const basePrice = domPrice > 0 ? domPrice : (ldData.price || 0);
            if (basePrice > 0 && oldPrice > basePrice) {
                domOldPrice = oldPrice;
                break;
            }
        }

        // 2. Скриптовий пошук (Якщо DOM порожній через блокування або недозавантаження)
        if (!domOldPrice) {
            const scriptMatches = html.match(/["']old_price["']\s*:\s*(\d+(\.\d+)?)/gi);
            if (scriptMatches) {
                const basePrice = domPrice > 0 ? domPrice : (ldData.price || 0);
                for (const match of scriptMatches) {
                    const priceMatch = match.match(/\d+(\.\d+)?/);
                    if (priceMatch) {
                        const price = parseFloat(priceMatch[0]);
                        if (basePrice > 0 && price > basePrice) {
                            domOldPrice = price;
                            console.log(`[RozetkaParser] Extracted oldPrice from script: ${price}`);
                            break;
                        }
                    }
                }
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