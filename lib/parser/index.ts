import type { ProductData, ProductParser } from "./types"
import { fetchHtml, getStoreName } from "./utils"
import { UniversalParser } from "./universal"
import { RozetkaParser } from "./sites/rozetka"
import { BrainParser } from "./sites/brain"
import { ComfyParser } from "./sites/comfy"
import { PullAndBearParser } from "./sites/pullandbear"
import { ZakolotParser } from "./sites/zakolot"

/**
 * Get the appropriate parser for a URL based on domain.
 */
function getParser(url: string): ProductParser {
    const domain = new URL(url).hostname.toLowerCase()

    if (domain.includes("rozetka")) return new RozetkaParser()
    if (domain.includes("brain.com.ua")) return new BrainParser()
    if (domain.includes("comfy.ua")) return new ComfyParser()
    if (domain.includes("pullandbear")) return new PullAndBearParser()
    if (domain.includes("zakolot")) return new ZakolotParser()

    return new UniversalParser()
}

/**
 * Main entry point: fetch HTML and parse product data from a URL.
 */
export async function parseProduct(url: string): Promise<ProductData> {
    const domain = new URL(url).hostname.toLowerCase()
    // Use async rendering for zakolot (needs JS always)
    let html = ""
    if (domain.includes("zakolot")) {
        html = await fetchHtml(url, true)
    } else {
        html = await fetchHtml(url)
    }


    console.log(`[parser] fetchHtml for ${new URL(url).hostname}: ${html.length} bytes`)
    const parser = getParser(url)
    const data = parser.parse(url, html)

    // Fill in source_url and store_name if not set by the parser
    return {
        ...data,
        source_url: data.source_url || url,
        store_name: data.store_name || getStoreName(url),
    }
}
