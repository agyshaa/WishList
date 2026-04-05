/**
 * SmartDiscount Engine - Universal discount detection from ANY website
 * 
 * Strategy: Multi-layered approach without ML complexity
 * 1. Context-based price mining (текст + HTML context)
 * 2. Regex patterns for common discount formats
 * 3. Data attribute extraction
 * 4. Statistical analysis (find price pairs where 2nd > 1st)
 */

import * as cheerio from "cheerio"
import { cleanPrice } from "./utils"

export interface DiscountResult {
    oldPrice: number | undefined
    currentPrice: number
    discountPercent?: number
    confidence: number  // 0-100, how sure we are
    method: "selector" | "regex" | "context" | "mining" | "attributes"
    explanation: string
}

/**
 * Main entry point - find discount on ANY website
 */
export function detectDiscount(
    html: string,
    currentPrice: number,
    url: string
): DiscountResult | null {
    const $ = cheerio.load(html)

    // If no current price, can't calculate discount
    if (currentPrice <= 0) {
        return null
    }

    // Try methods in order of confidence
    let result: DiscountResult | null = null

    // Method 1: Smart context analysis (highest confidence if found)
    result = findOldPriceByContext($, currentPrice)
    if (result && result.confidence >= 80) return result

    // Method 2: Regex patterns for common discount text
    result = findOldPriceByRegex(html, currentPrice)
    if (result && result.confidence >= 75) return result

    // Method 3: Percentage-based discounts ("50% OFF", "Save 30%")
    result = findOldPriceByPercentage(html, currentPrice)
    if (result && result.confidence >= 75) return result

    // Method 4: Multiple price formats ("Was 999 | Now 599")
    result = findOldPriceByMultiplePrices(html, currentPrice)
    if (result && result.confidence >= 75) return result

    // Method 5: Hidden elements analysis
    result = findOldPriceInHiddenElements($, html, currentPrice)
    if (result && result.confidence >= 65) return result

    // Method 6: Currency conversion support
    result = findOldPriceWithCurrencyConversion(html, currentPrice)
    if (result && result.confidence >= 70) return result

    // Method 7: Data attributes
    result = findOldPriceByAttributes($, currentPrice)
    if (result && result.confidence >= 70) return result

    // Method 8: Statistical price mining (lowest confidence — only use if high enough)
    result = findOldPriceByMining($, html, currentPrice)
    if (result && result.confidence >= 70) return result

    return null
}

/**
 * Method 1: Find old price by analyzing text context
 * Looks for patterns like "was 999", "original 1500", etc.
 */
function findOldPriceByContext(
    $: cheerio.CheerioAPI,
    currentPrice: number
): DiscountResult | null {
    // Keywords that indicate старая\original\original price (in various languages)
    const keywordPatterns = {
        old: /\b(was|original|before|previous|old|price)\b/i,
        save: /\b(save|discount|reduced|cut|off)\b/i,
        currency: /₴|грн|uah|$|€|£/i,
    }

    // Check common locations for old price
    const contextSelectors = [
        // Strikethrough sections (highest priority)
        { selector: "s, del, [style*='line-through'], [class*='crossed']", weight: 0.95 },
        // Price comparison areas
        { selector: "[class*='original'], [class*='was-price'], [class*='old-price']", weight: 0.90 },
        // Discount indicators
        { selector: "[class*='discount'], [class*='save'], [data-discount]", weight: 0.85 },
        // Generic price elements
        { selector: "span[class*='price'], div[class*='price']", weight: 0.60 },
    ]

    for (const { selector, weight } of contextSelectors) {
        const elements = $(selector)
        
        for (let i = 0; i < elements.length; i++) {
            const elem = $(elements[i])
            const text = elem.text()
            const html = elem.html() || ""

            // Extract all numbers that look like prices
            const numbers = extractPriceNumbers(text)

            for (const price of numbers) {
                if (price > currentPrice && price < currentPrice * 5) {
                    // Found a price higher than current = likely old price
                    
                    // Boost confidence if context keywords match
                    let confidence = weight * 100
                    
                    // Check for keyword indicators
                    if (keywordPatterns.old.test(text)) confidence += 10
                    if (html.includes("<s>") || html.includes("<del>")) confidence += 15
                    if (elem.find("s, del").length > 0) confidence += 10

                    confidence = Math.min(confidence, 100)

                    return {
                        oldPrice: price,
                        currentPrice,
                        discountPercent: Math.round(((price - currentPrice) / price) * 100),
                        confidence: Math.min(confidence, 100),
                        method: "context",
                        explanation: `Found in context selector: ${selector}`,
                    }
                }
            }
        }
    }

    return null
}

/**
 * Method 2: Find old price using regex patterns
 * Matches common text patterns like "Was $199 Now $99"
 */
function findOldPriceByRegex(
    html: string,
    currentPrice: number
): DiscountResult | null {
    // Patterns: capture old price and current price
    const patterns = [
        // "Was $999, Now $599" / "Було 999, Тепер 599"
        /(?:was|было|було|original|оригинальная|оригінальна)[\s:]*(\d+[.,]\d+|\d+)[\s]*(?:now|стал|став|тепер)?[\s:]*(?:$|₴|грн)?[\s]*(\d+[.,]\d+|\d+)/gi,
        
        // "Price reduced from 999 to 599"
        /(?:reduced|сниженная|знижена)[\s]*(?:from)?[\s]*(\d+[.,]\d+|\d+)[\s]*(?:to|до)?[\s]*(\d+[.,]\d+|\d+)/gi,
        
        // "Save 300!" with calculation
        /save[\s]*(?:up to)?[\s]*(?:uah)?[\s]*(\d+[.,]\d+|\d+)[\s]*(?:on|при)?[\s]*[^\d]*(\d+[.,]\d+|\d+)/gi,
        
        // "50% OFF was 1000 now 500"
        /(\d+)%[\s]*(?:off|off)[\s]*(?:was)?[\s]*(\d+[.,]\d+|\d+)/gi,
        
        // Structured: "was: 999 now: 599"
        /was[\s]*:?[\s]*(\d+[.,]\d+|\d+)[\s]*now[\s]*:?[\s]*(\d+[.,]\d+|\d+)/gi,

        // Ukrainian patterns: "Було 1599 Тепер 799"
        /(?:було|была)[\s]*(\d+[.,]\d+|\d+)[\s]*(?:тепер|теперь)[\s]*(\d+[.,]\d+|\d+)/gi,

        // "Original price 999, Sale price 599"
        /(?:original|оригинальная|оригінальна)[\s]*(?:price)?[\s]*(\d+[.,]\d+|\d+)[\s]*(?:sale|продажная|продажна)[\s]*(?:price)?[\s]*(\d+[.,]\d+|\d+)/gi,
        
        // Simple strikethrough price pattern: "Ціна: 999 грн" near current price
        // Looks for prices with currency that would make sense as old price
        /(?:ціна|цена|price)[\s]*:?[\s]*(\d+[.,]\d+|\d+)[\s]*(?:грн|uah|р\.|руб)/gi,
    ]

    for (const pattern of patterns) {
        let match
        while ((match = pattern.exec(html)) !== null) {
            if (!match[2]) {
                // For patterns that only capture one price, skip - need two prices to compare
                if (match[0].includes('Ціна') || match[0].includes('цена') || match[0].includes('price')) {
                    // For simple price patterns, treat as potential old price
                    const possibleOldPrice = cleanPrice(match[1])
                    if (possibleOldPrice > currentPrice && possibleOldPrice < currentPrice * 3) {
                        // Check if this looks like a reasonable old price
                        return {
                            oldPrice: possibleOldPrice,
                            currentPrice,
                            discountPercent: Math.round(((possibleOldPrice - currentPrice) / possibleOldPrice) * 100),
                            confidence: 70,
                            method: "regex",
                            explanation: `Found higher price pattern matching old price indicator`,
                        }
                    }
                }
                continue
            }
            
            const num1 = cleanPrice(match[1])
            const num2 = cleanPrice(match[2])

            // Determine which is old (higher) and which is current
            const [oldPrice, newPrice] = num1 > num2 ? [num1, num2] : [num2, num1]

            // Validate: old price should be close to our detected current price
            if (Math.abs(newPrice - currentPrice) < currentPrice * 0.15) {
                // Within 15% = likely correct pairing
                return {
                    oldPrice: oldPrice,
                    currentPrice: newPrice,
                    discountPercent: Math.round(((oldPrice - newPrice) / oldPrice) * 100),
                    confidence: 85,
                    method: "regex",
                    explanation: `Matched pattern: ${pattern.source}`,
                }
            }
        }
    }

    return null
}

/**
 * Method 3: Find old price from percentage discount patterns
 * Matches: "30% discount was 1000", "50% OFF 2000 now 1000"
 * ONLY uses explicit percentages with paired prices - NO calculated values
 * This prevents false positives from random "50%" appearing in text
 */
function findOldPriceByPercentage(
    html: string,
    currentPrice: number
): DiscountResult | null {
    // STRICT: Only match percentages that are paired with explicit prices
    // This avoids false positives from "50 оцінок" or CSS width values
    const patterns = [
        // "30% discount was 1000" or "50% OFF für 2000"
        /(\d+)%\s*(?:off|discount|скидка|знижка)\s+(?:was|было|було)?[\s:]*(\d+[.,]\d+|\d+)/gi,
        
        // "Save 30% on 1000" 
        /save\s+(?:up to)?\s*(\d+)%\s+(?:on|при)\s+(\d+[.,]\d+|\d+)/gi,
        
        // "Original 1000, now 50% off (500)"
        /(\d+[.,]\d+|\d+)[\s]*(?:грн|uah)?[\s]*(?:was|original|стара|оригінальна)?[\s]*(?:reduced|знижена)?\s+(\d+)%\s*(?:off|discount|скидка)/gi,
    ]

    for (const pattern of patterns) {
        let match
        while ((match = pattern.exec(html)) !== null) {
            const discountPercent = parseInt(match[1])
            const explicitPrice = cleanPrice(match[2])
            
            // Skip unrealistic discounts
            if (discountPercent <= 0 || discountPercent >= 100) {
                continue
            }
            
            // We have both percentage and explicit price
            if (explicitPrice > 0) {
                // Determine which is old (higher) and which is current
                const [oldPrice, newPrice] = explicitPrice > currentPrice 
                    ? [explicitPrice, currentPrice]
                    : [currentPrice, explicitPrice]
                
                // Validate: at least one price should match our current price closely
                if (Math.abs(newPrice - currentPrice) < currentPrice * 0.15 ||
                    Math.abs(explicitPrice - currentPrice) < currentPrice * 0.15) {
                    return {
                        oldPrice: oldPrice,
                        currentPrice: newPrice,
                        discountPercent,
                        confidence: 85,
                        method: "regex",
                        explanation: `Percentage discount: ${discountPercent}% with explicit prices paired`,
                    }
                }
            }
        }
    }

    return null
}

/**
 * Method 4: Find old price from multiple price formats  
 * Matches: "Original 2000 | Sale 1299", "Was 999 | Is 599", "199 → 99", "350 390"
 * ALSO handles multiline formats like KSD: "350 грн\nЦе нова ціна\n390 грн\nЦе стара ціна"
 */
function findOldPriceByMultiplePrices(
    html: string,
    currentPrice: number
): DiscountResult | null {
    // PRIORITY 0: KSD-style multiline layout with text indicators
    // "350 грн ... нова ціна ... 390 грн ... стара ціна"
    // Uses [\s\S] to match ANY chars including newlines
    const ksdPattern = /(\d+[.,]\d+|\d+)\s*(?:грн|uah)[\s\S]*?(?:нова ціна|new price|current|this price)[\s\S]{0,200}?(\d+[.,]\d+|\d+)\s*(?:грн|uah)[\s\S]*?(?:стара ціна|old price|was|original)/gi
    let match = ksdPattern.exec(html)
    if (match) {
        const price1 = cleanPrice(match[1])
        const price2 = cleanPrice(match[2])
        if (price1 !== price2) {
            const [oldPrice, newPrice] = price1 > price2 ? [price1, price2] : [price2, price1]
            if (Math.abs(newPrice - currentPrice) < currentPrice * 0.15) {
                return {
                    oldPrice: oldPrice,
                    currentPrice: newPrice,
                    discountPercent: Math.round(((oldPrice - newPrice) / oldPrice) * 100),
                    confidence: 95,
                    method: "regex",
                    explanation: `KSD multiline format: ${oldPrice} → ${newPrice} (found with text indicators)`,
                }
            }
        }
    }

    // Order matters: Check most specific patterns FIRST to avoid false matches
    const patterns = [
        // PRIORITY 1: Both prices MUST have currency: "350 грн 390 грн"
        /(\d+[.,]\d+|\d+)\s*(?:грн|uah)[\s]{0,50}(\d+[.,]\d+|\d+)\s*(?:грн|uah)(?!\d)/gi,
        
        // PRIORITY 2: Two prices with explicit old/new keywords
        // "Original 2000 | Sale 1299" or "Was 999 | Is 599" 
        /(?:original|original price|was|було|було|стара ціна|старая цена)\s*(?:price)?\s*[:\-|→]?\s*(\d+[.,]\d+|\d+)\s*[|→:]\s*(?:sale|sale price|current|now|тепер|теперь|is|becomes|нова ціна|новая цена)?\s*(?:price)?\s*\$?\s*(\d+[.,]\d+|\d+)/gi,
        
        // PRIORITY 3: Explicit separator formats
        // Pipe separator: "999 | 599" or "999 vs 599"
        /(\d+[.,]\d+|\d+)\s*(?:\||vs|vs\.|versus)\s*(\d+[.,]\d+|\d+)/gi,
        
        // Arrow notation: "999 → 599" or "1000 > 600"
        /(\d+[.,]\d+|\d+)\s*(?:→|--|»|>|—)\s*(\d+[.,]\d+|\d+)/gi,
        
        // PRIORITY 4: Reversed format
        // "1299 was originally 2000"
        /(\d+[.,]\d+|\d+)\s*(?:was|is|становится)\s*(?:originally|before)?\s*\$?\s*(\d+[.,]\d+|\d+)/gi,
    ]

    for (const pattern of patterns) {
        let match
        while ((match = pattern.exec(html)) !== null) {
            const price1 = cleanPrice(match[1])
            const price2 = cleanPrice(match[2])
            
            if (price1 === price2) continue  // Skip if prices are equal
            
            const [oldPrice, newPrice] = price1 > price2 ? [price1, price2] : [price2, price1]
            
            // Validate: new price should be close to currentPrice
            if (Math.abs(newPrice - currentPrice) < currentPrice * 0.15) {
                return {
                    oldPrice: oldPrice,
                    currentPrice: newPrice,
                    discountPercent: Math.round(((oldPrice - newPrice) / oldPrice) * 100),
                    confidence: 85,
                    method: "regex",
                    explanation: `Multiple price format: ${oldPrice} → ${newPrice}`,
                }
            }
        }
    }

    return null
}

/**
 * Method 5: Find old price in hidden elements
 * Searches for price data in display:none, opacity:0, hidden attributes
 */
function findOldPriceInHiddenElements(
    $: cheerio.CheerioAPI,
    html: string,
    currentPrice: number
): DiscountResult | null {
    // Selectors for hidden but present elements
    const hiddenSelectors = [
        '[style*="display:none"]',
        '[style*="display: none"]',
        '[style*="opacity:0"]',
        '[style*="opacity: 0"]',
        '[style*="visibility:hidden"]',
        '[hidden]',
        '[class*="hidden"]',
        '[class*="no-display"]',
        'noscript',  // Price might be in noscript for JS rendering
    ]

    for (const selector of hiddenSelectors) {
        const elements = $(selector)
        
        for (let i = 0; i < elements.length; i++) {
            const elem = $(elements[i])
            const text = elem.text()
            const innerHtml = elem.html() || ""
            
            // Look for price patterns in hidden content
            const prices = extractPriceNumbers(text)
            
            for (const price of prices) {
                if (price > currentPrice && price < currentPrice * 3) {
                    // Check if text contains discount-related keywords
                    if (/(?:was|original|old|previous|full|price)/i.test(text)) {
                        return {
                            oldPrice: price,
                            currentPrice,
                            discountPercent: Math.round(((price - currentPrice) / price) * 100),
                            confidence: 65,
                            method: "context",
                            explanation: `Found in hidden element: ${selector}`,
                        }
                    }
                }
            }
        }
    }

    return null
}

/**
 * Method 6: Find old price with currency conversion support
 * Handles: "$99 USD" converting to UAH, "€99", "£99"
 */
function findOldPriceWithCurrencyConversion(
    html: string,
    currentPrice: number
): DiscountResult | null {
    // Currency conversion rates to UAH (approximate)
    const conversionRates: { [key: string]: number } = {
        usd: 40,
        eur: 43,
        gbp: 50,
        "$": 40,  // Dollar assumed USD
        "€": 43,  // Euro
        "£": 50,  // Pound
    }

    const patterns = [
        // "$99 USD" or "€99 EUR" format
        /([\$€£])?\s*(\d+[.,]\d+|\d+)\s*(?:usd|eur|gbp|dollar|euro|pound|долл|евро)/gi,
        
        // "Price in USD: 99"
        /(?:price\s+in)?\s*(usd|eur|gbp|dollar|euro|pound)\s*[:\-]?\s*([\$€£])?\s*(\d+[.,]\d+|\d+)/gi,
    ]

    for (const pattern of patterns) {
        let match
        while ((match = pattern.exec(html)) !== null) {
            let amount = 0
            let currency = ""
            
            // Determine amount and currency based on pattern
            if (match[2]) {
                // First pattern: currency symbol in match[1], amount in match[2]
                amount = cleanPrice(match[2])
                currency = match[1]?.toLowerCase() || "usd"
            } else if (match[3]) {
                // Second pattern: currency in match[1], amount in match[3]
                amount = cleanPrice(match[3])
                currency = match[1]?.toLowerCase() || match[2]?.toLowerCase() || "usd"
            }

            if (amount > 0) {
                const rate = conversionRates[currency] || 1
                const priceInUah = Math.round(amount * rate)
                
                // Check if converted price would indicate a discount
                if (priceInUah > currentPrice && priceInUah < currentPrice * 3) {
                    return {
                        oldPrice: priceInUah,
                        currentPrice,
                        discountPercent: Math.round(((priceInUah - currentPrice) / priceInUah) * 100),
                        confidence: 70,
                        method: "regex",
                        explanation: `Converted from ${amount} ${currency.toUpperCase()} at rate ${rate}`,
                    }
                }
            }
        }
    }

    return null
}

/**
 * Method 7: Extract from data attributes
 */
function findOldPriceByAttributes(
    $: cheerio.CheerioAPI,
    currentPrice: number
): DiscountResult | null {
    const attributes = [
        "data-old-price",
        "data-original-price",
        "data-compare-at-price",
        "data-was-price",
        "data-before-price",
        "data-discount-price",
        "data-msrp",
        "data-regular-price",
    ]

    for (const attr of attributes) {
        const value = $(`[${attr}]`).first().attr(attr)
        if (value) {
            const price = cleanPrice(value)
            if (price > currentPrice && price < currentPrice * 4) {
                return {
                    oldPrice: price,
                    currentPrice,
                    discountPercent: Math.round(((price - currentPrice) / price) * 100),
                    confidence: 90,
                    method: "attributes",
                    explanation: `Found in attribute: ${attr}`,
                }
            }
        }
    }

    return null
}

/**
 * Method 4: Statistical price mining
 * Extract ALL numbers from HTML, find price pairs where higher > lower
 */
function findOldPriceByMining(
    $: cheerio.CheerioAPI,
    html: string,
    currentPrice: number
): DiscountResult | null {
    // Extract all numbers that look like prices (100-100000)
    const priceRegex = /\b(\d{2,5}(?:[.,]\d{1,2})?)\b/g
    const matches = html.match(priceRegex) || []
    
    const prices = new Set<number>()
    for (const match of matches) {
        const price = cleanPrice(match)
        if (price >= 50 && price <= 100000) {
            prices.add(price)
        }
    }

    const priceArray = Array.from(prices).sort((a, b) => b - a)

    // Look for a price higher than currentPrice that could be the old price.
    // The old price must be 5-60% higher than current, and close in HTML proximity.
    for (const potentialOld of priceArray) {
        if (potentialOld <= currentPrice) continue  // old price must be higher

        const discountPercent = ((potentialOld - currentPrice) / potentialOld) * 100

        // Discount should be 5-60% to be realistic (avoid outliers)
        if (discountPercent < 5 || discountPercent > 60) continue

        // Check proximity in HTML (numbers should be relatively close)
        if (arePricesNearby(html, potentialOld, currentPrice, 300)) {
            return {
                oldPrice: potentialOld,
                currentPrice,
                discountPercent: Math.round(discountPercent),
                confidence: 70,
                method: "mining",
                explanation: `Statistical mining: found old price ${potentialOld} near current ${currentPrice}`,
            }
        }
    }

    return null
}

/**
 * Helper: Extract all price-like numbers from text
 */
function extractPriceNumbers(text: string): number[] {
    const matches = text.match(/\b(\d+[.,]\d{1,2}|\d{2,5})\b/g) || []
    return matches
        .map(m => cleanPrice(m))
        .filter((p, i, arr) => p > 0 && arr.indexOf(p) === i)  // unique and > 0
}

/**
 * Helper: Check if two prices appear close to each other in HTML
 */
function arePricesNearby(html: string, price1: number, price2: number, maxDistance: number): boolean {
    const str1 = price1.toString()
    const str2 = price2.toString()

    const idx1 = html.indexOf(str1)
    const idx2 = html.indexOf(str2)

    if (idx1 === -1 || idx2 === -1) return false

    return Math.abs(idx1 - idx2) <= maxDistance
}

/**
 * Helper: Calculate discount percentage
 */
export function calculateDiscountFromOldPrice(
    currentPrice: number,
    oldPrice: number | undefined
): number | undefined {
    if (!oldPrice || oldPrice <= currentPrice) return undefined
    return Math.round(((oldPrice - currentPrice) / oldPrice) * 100)
}
