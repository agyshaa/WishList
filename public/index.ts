import type { ProductData, ProductParser } from "./types"
import { fetchHtml, getStoreName, getCachedParse, setCachedParse } from "./utils"
import { getFromRedisCache, saveToRedisCache } from "./redis-cache"
import { UniversalParser } from "./universal"
import { RozetkaParser } from "./sites/rozetka"
import { BrainParser } from "./sites/brain"
import { ComfyParser } from "./sites/comfy"
import { PullAndBearParser } from "./sites/pullandbear"
import { ZakolotParser } from "./sites/zakolot"
import { MegasportParser } from "./sites/megasport"
import { IntertopParser } from "./sites/intertop"
import { VivatsParser } from "./sites/vivat"
import { KsdParser } from "./sites/ksd"
import { AnswearParser } from "./sites/answear"
import { FoxtrotParser } from "./sites/foxtrot"
import { YablokiParser } from "./sites/yabloki"
import { MoyoParser } from "./sites/moyo"
import { AlloParser } from "./sites/allo"
import { JyskParser } from "./sites/jysk"
import { CtrsParser } from "./sites/ctrs"
import { PromParser } from "./sites/prom"

/**
 * Get the appropriate parser for a URL based on domain.
 */
function getParser(url: string): ProductParser {
    const domain = new URL(url).hostname.toLowerCase()

    if (domain.includes("rozetka")) return new RozetkaParser()
    if (domain.includes("brain.com.ua")) return new BrainParser()
    if (domain.includes("comfy.ua")) return new ComfyParser()
    if (domain.includes("foxtrot")) return new FoxtrotParser()
    if (domain.includes("yablok")) return new YablokiParser()
    if (domain.includes("pullandbear")) return new PullAndBearParser()
    if (domain.includes("zakolot")) return new ZakolotParser()
    if (domain.includes("megasport")) return new MegasportParser()
    if (domain.includes("intertop")) return new IntertopParser()
    if (domain.includes("vivat")) return new VivatsParser()
    if (domain.includes("ksd")) return new KsdParser()
    if (domain.includes("answear")) return new AnswearParser()
    if (domain.includes("moyo")) return new MoyoParser()
    if (domain.includes("allo.ua")) return new AlloParser()
    if (domain.includes("jysk.ua")) return new JyskParser()
    if (domain.includes("ctrs.com.ua")) return new CtrsParser()
    if (domain.includes("prom.ua")) return new PromParser()

    return new UniversalParser()
}

/**
 * Main entry point: fetch HTML and parse product data from a URL.
 * 
 * Strategy:
 * 1. Try FAST fetch first (50-200ms delay) with good headers
 * 2. If blocked (403/429) → try Puppeteer (for JS-heavy sites)
 * 3. Cache results so same URL doesn't need re-fetching
 */
export async function parseProduct(url: string): Promise<ProductData> {
    // Check in-memory cache first (fastest)
    const cached = getCachedParse(url)
    if (cached) {
        return cached
    }

    // Check Redis cache second (persistent but slower)
    const redisCached = await getFromRedisCache(url)
    if (redisCached) {
        // Also restore to in-memory cache for faster future access
        setCachedParse(url, redisCached)
        return redisCached
    }

    const domain = new URL(url).hostname.toLowerCase()
    
    // Sites that REQUIRE Puppeteer (JS-heavy, slow to render, or WAF protected)
    // Expanded list: sites that are known to block or have heavy JS
    const puppeteerRequiredSites = [
        "megasport",          // Heavy JS animations
        "comfy.ua",           // Imperva WAF protected
        "rozetka",            // Complex React app + WAF
        "moyo.ua",            // Heavy JS + Cloudflare
        "staff-clothes",      // Loading state initially
        "jysk.ua",            // React SPA
        "intertop.ua",        // Heavy images + JS
        "answear",            // Complex product page JS
    ]
    const requiresPuppeteer = puppeteerRequiredSites.some(site => domain.includes(site))
    
    let html = ""
    
    if (requiresPuppeteer) {
        // Skip fast fetch, go straight to Puppeteer for known JS-heavy sites
        console.log(`[parser] ${domain} requires Puppeteer, skipping fast fetch...`)
        html = await fetchHtml(url, true)
    } else {
        // Try fast fetch FIRST for normal sites
        console.log(`[parser] Trying fast fetch for ${domain}...`)
        try {
            html = await fetchHtml(url, false)  // false = use fetch, not Puppeteer
            if (html && html.length > 500) {
                console.log(`[parser] ✅ Got ${html.length} bytes with fetch`)
            }
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error)
            console.log(`[parser] ⚠️ Fetch failed: ${errMsg}. Trying Puppeteer...`)
            
            // Only use Puppeteer if fetch actually failed
            html = await fetchHtml(url, true)  // true = use Puppeteer
        }
    }

    console.log(`[parser] fetchHtml for ${domain}: ${html.length} bytes`)
    const parser = getParser(url)
    const data = parser.parse(url, html)

    // Fill in source_url and store_name if not set by the parser
    const result = {
        ...data,
        source_url: data.source_url || url,
        store_name: data.store_name || getStoreName(url),
    }
    
    // Only cache if we got meaningful data (not a failed/empty parse)
    if (result.title || result.price > 0) {
        setCachedParse(url, result)
        await saveToRedisCache(url, result).catch(err => {
            console.debug("[parser] Redis cache save failed (non-blocking):", err.message)
        })
    } else {
        console.log(`[parser] ⚠️ Skipping cache for ${domain} — empty result (parse failed)`)
    }
    
    return result
}
