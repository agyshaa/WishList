import type { ProductData } from "../types"
import { UniversalParser } from "../universal"

/**
 * Pull & Bear parser: relies on JSON-LD (SPA site with SSR).
 */
export class PullAndBearParser extends UniversalParser {
    parse(url: string, html: string): ProductData {
        // P&B is an SPA — rely on JSON-LD from SSR
        try {
            const data = super.parse(url, html)
            if (data.title && data.price) {
                return { ...data, source_url: url, store_name: "Pull & Bear" }
            }
        } catch { }

        return {
            title: "",
            price: 0,
            currency: "",
            image_url: "",
            description: "",
            source_url: url,
            store_name: "Pull & Bear",
        }
    }
}
