import { execSync } from "child_process"

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
    let browser
    
    try {
        browser = await puppeteer.default.launch({
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-gpu",
                "--disable-dev-shm-usage",
                "--disable-blink-features=AutomationControlled"
            ],
        })

        const page = await browser.newPage()
        
        // Evasion: Advanced stealth injection
        await page.evaluateOnNewDocument(() => {
            // Overwrite the `webdriver` property to undefine it
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
            // Spoof Chrome runtime
            // @ts-ignore
            window.navigator.chrome = { runtime: {}, app: {} }
            // Spoof permissions
            const originalQuery = window.navigator.permissions.query
            // @ts-ignore
            window.navigator.permissions.query = (parameters) => (
                parameters.name === 'notifications' ? 
                    Promise.resolve({ state: Notification.permission } as PermissionStatus) : 
                    originalQuery(parameters)
            )
            // Spoof plugins
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] })
            Object.defineProperty(navigator, 'languages', { get: () => ['uk-UA', 'uk', 'en-US', 'en'] })
        })

        await page.setUserAgent(
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
        )
        // Pass standard headers
        await page.setExtraHTTPHeaders({
            "Accept-Language": "uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7",
        })
        
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 })
        
        let html = await page.content()
        // Wait for Incapsula / Cloudflare JS challenges to resolve and reload the page
        if (html.includes("Incapsula_Resource") || html.includes("Pardon Our Interruption") || html.includes("Just a moment")) {
            console.log(`[Puppeteer] WAF Challenge detected for ${url}. Waiting for JS resolution...`)
            await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {})
            html = await page.content()
        }

        return html
    } catch (error: any) {
        console.error("Puppeteer render error:", error)
        return `<!-- PUPPETEER_ERROR: ${error.message} \n ${error.stack} -->`
    } finally {
        if (browser) await browser.close().catch(() => {})
    }
}

export async function fetchHtml(url: string, usePuppeteer: boolean = false): Promise<string> {
    if (usePuppeteer) {
        return await renderHtmlWithPuppeteer(url)
    }

    try {
        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                "Accept-Language": "uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7",
                "Cache-Control": "max-age=0",
                "Sec-Ch-Ua": '"Chromium";v="125", "Not.A/Brand";v="24"',
                "Sec-Ch-Ua-Mobile": "?0",
                "Sec-Ch-Ua-Platform": '"macOS"',
                "Sec-Fetch-Dest": "document",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-Site": "none",
                "Sec-Fetch-User": "?1",
                "Upgrade-Insecure-Requests": "1"
            },
            next: { revalidate: 0 } // no-cache
        })
        
        if (!res.ok) {
            console.error(`[fetchHtml] HTTP error! status: ${res.status}`)
        }
        const html = await res.text()

        // Fallback to Puppeteer if we hit a WAF/Captcha block
        if (html.includes("Pardon Our Interruption") || html.includes("Cloudflare") || res.status === 403) {
            console.log(`[fetchHtml] WAF block detected for ${url}. Falling back to Puppeteer...`)
            return await renderHtmlWithPuppeteer(url)
        }

        return html
    } catch (error) {
        console.error("[fetchHtml] fetch failed:", error instanceof Error ? error.message : error)
        return ""
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
