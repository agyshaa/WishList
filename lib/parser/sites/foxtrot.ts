import * as cheerio from "cheerio"
import { cleanPrice, cleanText, calculateDiscountPercent } from "../utils"
import type { ProductData } from "../types"
import { UniversalParser } from "../universal"

export class FoxtrotParser extends UniversalParser {
    parse(url: string, html: string): ProductData {
        let result = super.parse(url, html)
        const $ = cheerio.load(html)

        // 1. Спочатку залізно фіксуємо поточну (нову) ціну
        const currentPrice = result.price || this.findCurrentPrice($) || 0;

        // 2. Шукаємо стару ціну
        const domOldPrice = this.extractOldPrice($, currentPrice, html)

        if (domOldPrice && domOldPrice > currentPrice) {
            result.oldPrice = domOldPrice
            result.discount_percent = calculateDiscountPercent(currentPrice, domOldPrice)
            console.log(`[FoxtrotParser] ✅ Успіх! Стара ціна: ${domOldPrice}, Нова: ${currentPrice}, Знижка: ${result.discount_percent}%`)
        } else {
            console.log(`[FoxtrotParser] ⚠️ Знижки немає або стару ціну не знайдено.`)
        }

        result.price = currentPrice;
        result.store_name = "foxtrot.com.ua"
        return result
    }

    private findCurrentPrice($: cheerio.CheerioAPI): number {
        const np = $(".price__main, .product-price__main, div.price__relevant").first().text();
        return cleanPrice(np);
    }

    private extractOldPrice($: cheerio.CheerioAPI, currentPrice: number, rawHtml: string): number | undefined {
        if (currentPrice === 0) return undefined;

        const candidates = new Set<number>();

        // 1. Пошук по всіх тегах, що відповідають за закреслений текст або старі класи
        const selectors = [
            ".price__old .price__relevant",
            ".product-price__old",
            ".price-box__old",
            "div.price__old",
            "span[class*='old-price']",
            "del",
            "s"
        ];

        for (const selector of selectors) {
            $(selector).each((_, el) => {
                const text = $(el).text().trim();
                const price = cleanPrice(text);
                if (price > currentPrice && price < currentPrice * 4) {
                    candidates.add(price);
                }
            });
        }

        // 2. Пошук всередині JS-стану Foxtrot (window.__NUXT__ або подібне)
        const regexPatterns = [
            /"oldPrice"\s*:\s*(\d+)/g,
            /"priceOld"\s*:\s*(\d+)/g,
            /"basePrice"\s*:\s*(\d+)/g,
            /data-old-price="(\d+)"/g
        ];

        for (const pattern of regexPatterns) {
            let match;
            while ((match = pattern.exec(rawHtml)) !== null) {
                const price = parseInt(match[1], 10);
                if (price > currentPrice && price < currentPrice * 4) {
                    candidates.add(price);
                }
            }
        }

        // Відбираємо кандидати, які СУВОРО більші за поточну ціну
        const validCandidates = Array.from(candidates).filter(p => p > currentPrice);

        if (validCandidates.length > 0) {
            // Якщо знайшли кілька варіантів, беремо найбільший (справжня ціна до знижки)
            const bestOldPrice = Math.max(...validCandidates);
            return bestOldPrice;
        }

        return undefined;
    }
}