/**
 * Anti-blocking utilities for parsers
 * Implements:
 * - User-Agent rotation
 * - Request delays (exponential backoff)
 * - Headers rotation
 * - Rate limiting
 * - Cookie simulation
 * - Behavioral patterns
 */

// Popular User-Agents that don't trigger bot detection
// Включає актуальні версії переглядачів (2026)
const USER_AGENTS = [
    // Chrome desktop
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    
    // Chrome mobile
    "Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
    
    // Safari
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
    
    // Firefox
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7; rv:125.0) Gecko/20100101 Firefox/125.0",
    
    // Edge
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0",
    
    // Samsung Internet
    "Mozilla/5.0 (Linux; Android 13; SAMSUNG SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/125.0.0.0 Mobile Safari/537.36",
]

// Common browser headers that make requests look legitimate
const ACCEPT_LANGUAGE_VARIANTS = [
    "uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7",
    "en-US,en;q=0.9,uk;q=0.8",
    "uk;q=0.9,en;q=0.8",
    "pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7",
    "ru-RU,ru;q=0.9,en-US;q=0.8",
    "de-DE,de;q=0.9,en-US;q=0.8",
]

const ACCEPT_ENCODINGS = [
    "gzip, deflate, br",
    "gzip, deflate",
    "br;q=1.0, gzip;q=0.8, *;q=0.1",
]

// Рефереры містять також українські джерела
const REFERERS = [
    "https://www.google.com/",
    "https://www.google.com.ua/",
    "https://www.google.co.uk/",
    "https://www.bing.com/",
    "https://duckduckgo.com/",
    "https://www.instagram.com/",
    "https://www.facebook.com/",
    "https://www.reddit.com/",
    "https://www.youtube.com/",
    "https://www.yandex.ua/",
    "https://www.twitter.com/",
]

let lastRequestTime = 0
let requestCount = 0
let perDomainRequestCounts: Record<string, number> = {}
let perDomainLastTime: Record<string, number> = {}

const MAX_REQUESTS_PER_MINUTE = 25  // Знижено з 30 на 25
const MAX_REQUESTS_PER_DOMAIN_PER_MINUTE = 5  // Макс запитів на домен

/**
 * Get a random User-Agent
 */
export function getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

/**
 * Get random headers that mimic a real browser
 */
export function getRandomHeaders(domain?: string): Record<string, string> {
    const randomReferer = REFERERS[Math.floor(Math.random() * REFERERS.length)]
    const randomAcceptLanguage = ACCEPT_LANGUAGE_VARIANTS[Math.floor(Math.random() * ACCEPT_LANGUAGE_VARIANTS.length)]
    const randomAcceptEncoding = ACCEPT_ENCODINGS[Math.floor(Math.random() * ACCEPT_ENCODINGS.length)]

    // Додаємо реалістичніші headers
    return {
        "User-Agent": getRandomUserAgent(),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": randomAcceptLanguage,
        "Accept-Encoding": randomAcceptEncoding,
        "Accept-Charset": "utf-8",
        "DNT": "1",
        "Connection": "keep-alive",
        "Keep-Alive": "timeout=5, max=100",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Cache-Control": "max-age=0",
        "Referer": randomReferer,
        "Pragma": "no-cache",
        "Sec-Ch-Ua": '"Not_A Brand";v="99", "Google Chrome";v="125", "Chromium";v="125"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"macOS"',
    }
}

/**
 * Get domain from URL
 */
function getDomain(url: string): string {
    try {
        return new URL(url).hostname
    } catch {
        return "unknown"
    }
}

/**
 * Sites that are more aggressive with bot detection
 * Need longer delays between requests
 */
function isAggressiveSite(domain: string): boolean {
    const aggressiveSites = ["rozetka.com.ua", "comfy.ua", "zakolot.store"]
    return aggressiveSites.some(site => domain.includes(site))
}

/**
 * Implement exponential backoff delay for rate limiting
 * With per-domain tracking to avoid overwhelming specific servers
 * 
 * For first attempt (attempt=0): minimal delays, try fast fetch
 * For retries: aggressive delays to avoid blocks
 */
export async function rateLimitedDelay(url: string, attempt: number = 0): Promise<void> {
    const domain = getDomain(url)
    const now = Date.now()
    const isAggressive = isAggressiveSite(domain)
    
    // Інітялізуємо якщо потрібно
    if (!perDomainRequestCounts[domain]) {
        perDomainRequestCounts[domain] = 0
        perDomainLastTime[domain] = 0
    }

    const timeSinceLastRequest = now - lastRequestTime
    const timeSinceDomainRequest = now - perDomainLastTime[domain]
    
    // ✅ QUICK STRATEGY: First attempt is FAST, retries are SLOW
    let minDelayMs: number
    if (attempt === 0) {
        // First attempt: быстрый запрос с минимальной задержкой
        minDelayMs = 50 + Math.random() * 150  // 50-200ms (дуже коротко!)
    } else {
        // Перевизнач для ретрай - більше затримки
        minDelayMs = isAggressive 
            ? 5000 + Math.random() * 5000   // 5-10 sec для агресивних
            : 1000 + Math.random() * 1000   // 1-2 sec для інших
    }

    // Check global rate limit: max 25 requests per minute
    if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
        const resetTime = lastRequestTime + 60000 - now
        if (resetTime > 0) {
            console.log(`[anti-blocking] Global rate limit reached. Waiting ${resetTime}ms before next request...`)
            await new Promise(resolve => setTimeout(resolve, resetTime + 1000))
            requestCount = 0
            return
        }
    }

    // Check per-domain rate limit: max 5 requests per minute per domain
    // For aggressive sites: max 4 requests per minute (relaxed from 3 after WAF improvements)
    const maxPerDomain = isAggressive ? 4 : 5
    if (perDomainRequestCounts[domain] >= maxPerDomain) {
        const resetTime = perDomainLastTime[domain] + 60000 - now
        if (resetTime > 0) {
            console.log(`[anti-blocking] Rate limit for ${domain} reached (${perDomainRequestCounts[domain]}/${maxPerDomain}). Waiting ${resetTime}ms...`)
            await new Promise(resolve => setTimeout(resolve, resetTime + 2000))
            perDomainRequestCounts[domain] = 0
            return
        }
    }

    // Exponential backoff for retries: 2s, 4s, 8s, 16s, але з капом на 45s
    // For aggressive sites: 5s, 10s, 20s, 40s
    const backoffMultiplier = isAggressive ? 5000 : 2000
    const backoffMs = Math.min(backoffMultiplier * Math.pow(2, Math.max(0, attempt - 1)), 45000)
    const delayMs = Math.max(minDelayMs, backoffMs)

    if (timeSinceLastRequest < delayMs) {
        const waitTime = delayMs - timeSinceLastRequest
        if (attempt > 0) {
            console.log(`[anti-blocking] Retry ${attempt}: Waiting ${waitTime}ms before request to ${domain}${isAggressive ? " (aggressive site)" : ""}...`)
        }
        await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    lastRequestTime = Date.now()
    perDomainLastTime[domain] = Date.now()
    requestCount++
    perDomainRequestCounts[domain]++
}

/**
 * Reset rate limit counter (call this every minute)
 */
export function resetRateLimit(): void {
    requestCount = 0
    lastRequestTime = 0
    perDomainRequestCounts = {}
    perDomainLastTime = {}
}

/**
 * Retry logic with exponential backoff
 * Useful for handling temporary blocks or rate limits
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    onRetry?: (attempt: number, error: Error) => void
): Promise<T> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn()
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error))
            const errMsg = err.message.toLowerCase()

            if (onRetry) {
                onRetry(attempt, err)
            }

            if (attempt === maxAttempts) {
                throw error
            }

            // Більш агресивне очікування для 403/429
            const is403or429 = errMsg.includes("403") || errMsg.includes("429") || errMsg.includes("too many requests")
            
            let delayMs: number
            if (is403or429) {
                // Для 403/429 очікуємо ДУЖЕ довго (10-45 сек)
                delayMs = 10000 + Math.random() * 35000
                console.log(`[anti-blocking] ⚠️ Got blocked (403/429). Waiting ${Math.round(delayMs/1000)}s before retry attempt ${attempt}/${maxAttempts}...`)
            } else {
                // Для інших помилок: стандартний exponential backoff
                delayMs = 1000 * Math.pow(2.5, attempt - 1)  // 2.5s, 6.25s, 15.6s...
                console.log(`[anti-blocking] Retry attempt ${attempt}/${maxAttempts} in ${Math.round(delayMs/1000)}s...`)
            }

            await new Promise(resolve => setTimeout(resolve, delayMs))
        }
    }

    throw new Error("All retry attempts failed")
}

/**
 * Calculate discount percentage
 */
export function calculateDiscountPercent(price: number, oldPrice?: number): number | undefined {
    if (!oldPrice || oldPrice <= price) return undefined
    return Math.round(((oldPrice - price) / oldPrice) * 100)
}
