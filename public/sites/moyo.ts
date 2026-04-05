import * as cheerio from "cheerio"
import { cleanPrice, cleanText, calculateDiscountPercent } from "../utils"
import type { ProductData } from "../types"
import { UniversalParser } from "../universal"

export class MoyoParser extends UniversalParser {
    parse(url: string, html: string): ProductData {
        let result = super.parse(url, html)
        const $ = cheerio.load(html)

        // 1. Знайти поточну ціну
        const currentPrice = result.price || this.findCurrentPrice($) || 0;

        // 2. Знайти стару ціну
        if (currentPrice > 0) {
            const oldPrice = this.findOldPrice($, currentPrice, html)
            
            if (oldPrice && oldPrice > currentPrice) {
                result.oldPrice = oldPrice
                result.discount_percent = calculateDiscountPercent(currentPrice, oldPrice)
                console.log(`[MoyoParser] ✅ Знижка знайдена! Стара: ${oldPrice}, Нова: ${currentPrice}, % знижки: ${result.discount_percent}%`)
            }
        }

        result.price = currentPrice;
        result.store_name = "moyo.ua"
        return result
    }

    private findCurrentPrice($: cheerio.CheerioAPI): number {
        const priceSelectors = [
            ".product_price_current",
            ".js-current-price",
            ".product_fixed_buy_price_current",
            ".product-price",
            ".current-price",
            "[data-current-price]",
            ".price__current",
            ".product__price",
            "span[class*='price-value']",
        ];

        for (const selector of priceSelectors) {
            const price = cleanPrice($(selector).first().text());
            if (price > 0) return price;
        }

        // Резервний поиск через атрибути
        const attr = $("[data-current-price]").attr("data-current-price");
        if (attr) return cleanPrice(attr);

        return 0;
    }

    private findOldPrice($: cheerio.CheerioAPI, currentPrice: number, rawHtml: string): number | undefined {
        const candidates = new Set<number>();

        // Moyo-specific selectors (highest priority)
        const selectors = [
            ".product_price_oldprice",
            ".js-old-price",
            ".product_fixed_buy_price_old",
            ".old-price",
            ".original-price",
            ".compare-at-price",
            ".price__old",
            ".product__old-price",
            "span[class*='old-price']",
            "span[class*='original-price']",
            "span[class*='was-price']",
            "del",
            "s",
            "[style*='line-through']",
            "[data-old-price]",
            "[data-original-price]",
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

        // 2. Пошук через JS паттерни
        const regexPatterns = [
            /"oldPrice"\s*:\s*(\d+)/g,
            /"originalPrice"\s*:\s*(\d+)/g,
            /"priceOld"\s*:\s*(\d+)/g,
            /old_price\s*:\s*(\d+)/g,
            /"priceBeforeDiscount"\s*:\s*(\d+)/g,
            /data-old-price="(\d+)"/g,
            /data-original-price="(\d+)"/g,
            /"comparePrice"\s*:\s*(\d+)/g,
            /"wasPriceText"\s*:\s*"(\d+)/g,
            /was_price\s*:\s*(\d+)/g,
            /"before_discount"\s*:\s*(\d+)/g,
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

        // 3. Пошук через data атрибути в DOM
        const dataOldPrice = $("[data-old-price], [data-original-price]").attr("data-old-price") || 
                             $("[data-original-price]").attr("data-original-price");
        if (dataOldPrice) {
            const price = cleanPrice(dataOldPrice);
            if (price > currentPrice && price < currentPrice * 4) {
                candidates.add(price);
            }
        }

        // Вибираємо найбільший валідний кандидат
        const validCandidates = Array.from(candidates).filter(p => p > currentPrice);
        if (validCandidates.length > 0) {
            return Math.max(...validCandidates);
        }

        return undefined;
    }
}
