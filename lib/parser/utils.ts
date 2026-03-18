import { execSync } from "child_process"
import { getRandomHeaders, getRandomUserAgent, rateLimitedDelay, withRetry, calculateDiscountPercent } from "./anti-blocking"
import type { ProductData } from "./types"

/**
 * In-memory cache for parsed products (URL -> ProductData)
 * Cache expires after 1 hour to avoid stale data
 */
const PARSE_CACHE = new Map<string, { data: ProductData; timestamp: number }>()
const CACHE_TTL_MS = 3600000 // 1 hour

export function getCachedParse(url: string): ProductData | null {
    const cached = PARSE_CACHE.get(url)
    if (!cached) return null
    
    const age = Date.now() - cached.timestamp
    if (age > CACHE_TTL_MS) {
        PARSE_CACHE.delete(url)
        return null
    }
    
    console.log(`[cache] 🎯 Cache HIT for ${url} (age: ${Math.round(age / 1000)}s)`)
    return cached.data
}

export function setCachedParse(url: string, data: ProductData): void {
    PARSE_CACHE.set(url, { data, timestamp: Date.now() })
    console.log(`[cache] 💾 Cached ${url}`)
}

export function clearParseCache(): void {
    PARSE_CACHE.clear()
    console.log(`[cache] 🗑️ Cache cleared`)
}

/**
 * Clean a price string and return a float.
 * Removes non-numeric characters, handles commas/dots as decimal separators.
 */
export function cleanPrice(priceStr: string): number {
    if (!priceStr) return 0

    // Remove non-breaking spaces and regular spaces
    let cleaned = priceStr.replace(/\u00a0/g, "").replace(/\s/g, "")

    // If comma is used as decimal separator (no dot present)
    if (cleaned.includes(",") && !cleaned.includes(".")) {
        cleaned = cleaned.replace(",", ".")
    }

    // Extract numeric part
    const match = cleaned.match(/(\d+(\.\d+)?)/)
    return match ? parseFloat(match[1]) : 0
}

// Re-export anti-blocking utilities
export { getRandomHeaders, getRandomUserAgent, calculateDiscountPercent }

/**
 * Clean whitespace from text.
 */
export function cleanText(text: string): string {
    if (!text) return ""
    return text.split(/\s+/).join(" ").trim()
}

/**
 * Fetch HTML content from a URL using curl.
 * Uses curl instead of Node.js fetch/https because sites like Comfy use
 * Imperva (Incapsula) anti-bot that serves JS challenge pages to Node.js
 * but allows curl through with proper headers.
 */
export async function renderHtmlWithPuppeteer(url: string): Promise<string> {
    const puppeteer = await import("puppeteer")
    const domain = new URL(url).hostname
    let browser
    
    try {
        browser = await puppeteer.default.launch({
            headless: true,  // Modern headless mode
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-gpu",
                "--disable-dev-shm-usage",
                "--disable-blink-features=AutomationControlled",
                "--disable-web-resources",  // Disable web resource loading detection
                "--disable-extensions",
                "--disable-plugins",
                "--disable-images",  // Disable images for faster loading
            ],
        })

        const page = await browser.newPage()
        
        // Set viewport to look like a real browser
        await page.setViewport({ width: 1920, height: 1080 })

        // Advanced evasion: Override detection methods
        await page.evaluateOnNewDocument(() => {
            // Hide puppeteer
            Object.defineProperty(navigator, 'webdriver', { get: () => false })
            
            // Spoof Chrome
            // @ts-ignore
            window.navigator.chrome = { runtime: {} }
            
            // Override permissions
            const originalQuery = window.navigator.permissions.query
            // @ts-ignore
            window.navigator.permissions.query = (params) => (
                params.name === 'notifications'
                    ? Promise.resolve({ state: Notification.permission })
                    : originalQuery(params)
            )
            
            // Fake plugins
            Object.defineProperty(navigator, 'plugins', {
                get: () => [
                    { name: 'Chrome PDF Plugin', description: 'Portable Document Format', filename: 'internal-pdf-viewer' },
                    { name: 'Chrome PDF Viewer', description: '', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
                ]
            })
            
            // Languages
            Object.defineProperty(navigator, 'languages', {
                get: () => ['uk-UA', 'uk', 'en-US', 'en']
            })
            
            // Mock languages method
            // @ts-ignore
            Object.defineProperty(navigator, 'language', {
                get: () => 'uk-UA'
            })
        })

        // Set more realistic headers
        const randomHeaders = getRandomHeaders(url)
        await page.setUserAgent(randomHeaders["User-Agent"])
        await page.setExtraHTTPHeaders({
            "Accept-Language": randomHeaders["Accept-Language"],
            "Accept": randomHeaders["Accept"],
            "Accept-Encoding": randomHeaders["Accept-Encoding"],
            "DNT": "1",
        })

        // Small human-like delay before loading (not too long)
        await new Promise(r => setTimeout(r, Math.random() * 500 + 300))
        
        console.log(`[Puppeteer] Loading ${domain}...`)
        const startTime = Date.now()
        
        // Faster: use domcontentloaded instead of networkidle2
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 })
        
        // Quick wait for rendering
        await new Promise(r => setTimeout(r, 1000))
        
        let html = await page.content()
        const loadTime = Date.now() - startTime
        console.log(`[Puppeteer] ✅ Loaded ${domain} in ${loadTime}ms (${html.length} bytes)`)
        
        // Check for WAF blocks
        const isBlocked = html.includes("Incapsula_Resource") || 
                         html.includes("Pardon Our Interruption") || 
                         html.includes("Just a moment") ||
                         html.includes("403") ||
                         html.length < 100  // Suspiciously small response
        
        if (isBlocked) {
            console.log(`[Puppeteer] WAF Block detected for ${domain}. Retrying with networkidle2...`)
            // Reload with stronger wait
            await page.reload({ waitUntil: "networkidle2", timeout: 20000 }).catch(() => {})
            html = await page.content()
            const retryTime = Date.now() - startTime
            console.log(`[Puppeteer] ✅ Retry succeeded in ${retryTime}ms`)
        }

        return html
    } catch (error: any) {
        console.error(`[Puppeteer] Error rendering ${domain}: ${error?.message || error}`)
        return `<!-- PUPPETEER_ERROR: ${error?.message} -->`
    } finally {
        if (browser) await browser.close().catch(() => {})
    }
}

export async function fetchHtml(url: string, usePuppeteer: boolean = false, attempt: number = 0): Promise<string> {
    if (usePuppeteer) {
        return await renderHtmlWithPuppeteer(url)
    }

    const randomHeaders = getRandomHeaders(url)
    const domain = new URL(url).hostname

    try {
        // Add dynamic delay based on attempt number
        await rateLimitedDelay(url, attempt)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000)  // 30 sec timeout

        try {
            const res = await fetch(url, {
                headers: randomHeaders,
                signal: controller.signal,
                next: { revalidate: 0 } // no-cache
            })
            clearTimeout(timeoutId)
            
            if (res.status === 429 || res.status === 403) {
                console.log(`[fetchHtml] HTTP ${res.status} for ${domain} - switching to Puppeteer...`)
                return await fetchHtml(url, true, attempt)  // Fallback to Puppeteer
            }

            if (!res.ok) {
                console.error(`[fetchHtml] HTTP error! status: ${res.status} for ${domain}`)
                throw new Error(`HTTP ${res.status}`)
            }
            
            const html = await res.text()

            // Fallback to Puppeteer if we hit a WAF/Captcha block in HTML
            if (html.includes("Pardon Our Interruption") || html.includes("Cloudflare") || html.includes("Incapsula") || html.includes("Just a moment")) {
                console.log(`[fetchHtml] WAF HTML block detected for ${domain}. Trying Puppeteer...`)
                return await fetchHtml(url, true, attempt)  // Fallback to Puppeteer
            }

            return html
        } catch (fetchError: any) {
            clearTimeout(timeoutId)
            
            // Timeout errors - try Puppeteer
            if (fetchError.name === "AbortError" || fetchError.message.includes("timeout")) {
                console.log(`[fetchHtml] Timeout for ${domain}. Trying Puppeteer...`)
                return await fetchHtml(url, true, attempt)  // Fallback to Puppeteer
            }
            
            throw fetchError
        }
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error)
        const isDomainError = errMsg.includes("ENOTFOUND") || errMsg.includes("getaddrinfo") || errMsg.includes("fetch failed")
        
        // For domain errors - still try Puppeteer once
        if (isDomainError && attempt === 0) {
            console.log(`[fetchHtml] Network error for ${domain}. Trying Puppeteer...`)
            try {
                return await fetchHtml(url, true, attempt)  // Fallback to Puppeteer
            } catch {
                // If Puppeteer also fails, throw original error
                throw error
            }
        }

        console.error(`[fetchHtml] Attempt ${attempt + 1} failed for ${domain}: ${errMsg}`)
        throw error
    }
}

/**
 * Determine store name from URL domain.
 */
export function getStoreName(url: string): string {
    try {
        const domain = new URL(url).hostname.toLowerCase()
        const storeMap: Record<string, string> = {
            rozetka: "Rozetka",
            "brain.com.ua": "Brain",
            "comfy.ua": "Comfy",
            pullandbear: "Pull & Bear",
            zakolot: "Zakolot",
        }

        for (const [key, name] of Object.entries(storeMap)) {
            if (domain.includes(key)) return name
        }

        // Return cleaned domain as fallback
        return domain.replace("www.", "")
    } catch {
        return ""
    }
}

/**
 * Convert USD to UAH using current approximate exchange rate.
 * For production, use real exchange rate API.
 */
export function convertUsdToUah(usdPrice: number): number {
    const exchangeRate = 40 // Approximate rate (update as needed)
    return Math.round(usdPrice * exchangeRate)
}
