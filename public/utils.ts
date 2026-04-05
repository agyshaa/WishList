import { execSync } from "child_process"
import { getRandomHeaders, getRandomUserAgent, rateLimitedDelay, withRetry, calculateDiscountPercent } from "./anti-blocking"
import { createPage, closeBrowser, isBrowserRunning } from "./browser-manager"
import type { ProductData } from "./types"

/**
 * Normalize URL for caching (remove tracking params, sort query string)
 */
function normalizeUrlForCache(url: string): string {
    const urlObj = new URL(url)
    
    // Remove common tracking parameters
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid', 'msclkid', '_ga', 'ref']
    trackingParams.forEach(param => urlObj.searchParams.delete(param))
    
    // Sort query parameters for consistency
    const params = new URLSearchParams([...urlObj.searchParams.entries()].sort())
    urlObj.search = params.toString()
    
    return urlObj.toString()
}

/**
 * In-memory cache for parsed products (URL -> ProductData)
 * Cache expires after 1 hour to avoid stale data
 */
const PARSE_CACHE = new Map<string, { data: ProductData; timestamp: number }>()
const CACHE_TTL_MS = 3600000 // 1 hour

export function getCachedParse(url: string): ProductData | null {
    const normalizedUrl = normalizeUrlForCache(url)
    const cached = PARSE_CACHE.get(normalizedUrl)
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
    const normalizedUrl = normalizeUrlForCache(url)
    PARSE_CACHE.set(normalizedUrl, { data, timestamp: Date.now() })
    console.log(`[cache] 💾 Cached ${normalizedUrl}`)
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

    // Case 1: both comma and dot present → comma is thousands separator (e.g. "6,990.00")
    // Strip the thousands comma so we get "6990.00"
    if (cleaned.includes(",") && cleaned.includes(".")) {
        cleaned = cleaned.replace(/,/g, "")
    }
    // Case 2: comma present, no dot → comma is decimal separator (e.g. "699,00")
    else if (cleaned.includes(",") && !cleaned.includes(".")) {
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
 * Fetch HTML content using Puppeteer (singleton browser instance)
 * Uses the singleton browser manager to avoid launching new browsers per request.
 * 
 * Current approach: Launches new browser per request (3-5s overhead)
 * Singleton approach: Reuses browser instance, new page per request (~100ms)
 */
export async function renderHtmlWithPuppeteer(url: string): Promise<string> {
    const domain = new URL(url).hostname
    let page
    
    try {
        // Get a new page from singleton browser (no browser launch needed)
        page = await createPage()
        
        // Block images, fonts and media to speed up page loading.
        // This does NOT affect CF challenge (purely JS-based) or fingerprinting.
        await page.setRequestInterception(true)
        page.on("request", (req) => {
            const type = req.resourceType()
            if (type === "image" || type === "font" || type === "media") {
                req.abort()
            } else {
                req.continue()
            }
        })

        // Set Accept-Language and other headers (NOT User-Agent — let stealth handle that)
        const randomHeaders = getRandomHeaders(url)
        await page.setExtraHTTPHeaders({
            "Accept-Language": randomHeaders["Accept-Language"],
            "Accept": randomHeaders["Accept"],
            "Accept-Encoding": randomHeaders["Accept-Encoding"],
            "DNT": "1",
        })
        
        console.log(`[Puppeteer] Opening ${domain}...`)
        const startTime = Date.now()
        
        // Use networkidle2 for sites known to have async content loading
        // Otherwise use domcontentloaded for faster response
        // NOTE: staff-clothes uses domcontentloaded so CF JS challenge can execute freely
        // comfy.ua removed: Imperva WAF keeps network active → networkidle2 deadlocks
        const isAsyncHeavy = ["rozetka", "megasport"].some(site => domain.includes(site))
        const waitUntil = isAsyncHeavy ? "networkidle2" : "domcontentloaded"
        
        // NetworkIdle2 sites (rozetka/comfy/megasport) load heavily — give more time
        const gotoTimeout = isAsyncHeavy ? 45000 : 25000
        await page.goto(url, { waitUntil, timeout: gotoTimeout })
        
        let html = await page.content()
        const loadTime = Date.now() - startTime
        console.log(`[Puppeteer] ✅ Loaded ${domain} in ${loadTime}ms (${html.length} bytes)`)
        
        // Detect Cloudflare/WAF challenges using language-agnostic structural markers
        // Challenge pages are always small (<50KB), real product pages are always large (200KB+)
        // cdn-cgi is a Cloudflare-exclusive path never found on normal pages
        const isCloudflareChallenge = (h: string) =>
            h.length < 50000 && (
                h.includes('cdn-cgi') ||
                h.includes('window._cf_chl_opt') ||
                h.includes('id="challenge-running"') ||
                h.includes("Incapsula_Resource")
            )
        
        if (isCloudflareChallenge(html)) {
            console.log(`[Puppeteer] WAF Block detected for ${domain}. Waiting for CF challenge to auto-solve...`)
            // CF Managed Challenge replaces page content via JS in-place (no full navigation event).
            // We poll page size — once content grows beyond 50KB CF has passed us through.
            const challengeStart = Date.now()
            let resolved = false
            while (Date.now() - challengeStart < 30000 && !resolved) {
                await new Promise(r => setTimeout(r, 1500))
                try {
                    const size = await page.evaluate(() => document.documentElement.outerHTML.length)
                    if (size > 50000) {
                        html = await page.content()
                        if (!isCloudflareChallenge(html)) {
                            resolved = true
                        }
                    }
                } catch (e) {
                    // page may have navigated, retry
                }
            }
            
            if (!resolved) {
                // Browser is tainted — CF keeps challenging it. Restart browser and retry once.
                console.log(`[Puppeteer] ⚠️ CF challenge not resolved. Restarting browser and retrying...`)
                await page.close().catch(() => {})
                page = undefined
                await closeBrowser()
                // Retry with fresh browser (no recursion — just one retry)
                return await renderHtmlWithPuppeteer(url)
            }

            const retryTime = Date.now() - startTime
            console.log(`[Puppeteer] ✅ CF challenge resolved in ${retryTime}ms`)
        }

        return html
    } catch (error: any) {
        console.error(`[Puppeteer] Error rendering ${domain}: ${error?.message || error}`)
        return `<!-- PUPPETEER_ERROR: ${error?.message} -->`
    } finally {
        // Page will auto-close after 5 minutes (managed by browser-manager)
        if (page) {
            try {
                await page.close()
            } catch (e) {
                // Page already closed, ignore
            }
        }
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
