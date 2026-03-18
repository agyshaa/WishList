import * as cheerio from "cheerio"
import { extractProductData } from "./lib/parser/index"
import { BrainParser } from "./lib/parser/sites/brain"
import { cleanPrice } from "./lib/parser/utils"

async function main() {
    const url = "https://brain.com.ua/ukr/Zaryadna_stanciya_Jackery_Explorer_1000_v2_1500W_1070Wh_Explorer_1000_v2-p1312603.html"
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }})
    const html = await res.text()
    
    console.log("HTML length:", html.length)
    const $ = cheerio.load(html)
    
    const mainBlock = $("div.main-price-block")
    console.log("mainBlock length:", mainBlock.length)
    if (mainBlock.length) {
        console.log("Raw mainBlock text:", mainBlock.text().trim())
        const cloned = mainBlock.clone()
        cloned.find(".old-price").remove()
        console.log("Cloned text after removal:", cloned.text().trim())
        console.log("Cleaned price:", cleanPrice(cloned.text()))
    } else {
        const fall = $("div.br-pr-price")
        console.log("br-pr-price length:", fall.length)
        if (fall.length) {
             const cloned = fall.clone()
             cloned.find(".old-price").remove()
             console.log("Cloned fallback text after removal:", cloned.text().trim())
             console.log("Cleaned price:", cleanPrice(cloned.text()))
        }
    }
    
    const oldPriceElem = $("div.old-price, span.old-price")
    console.log("oldPriceElem length:", oldPriceElem.length)
    if (oldPriceElem.length) {
        console.log("oldPrice text:", oldPriceElem.first().text().trim())
        console.log("oldPrice cleaned:", cleanPrice(oldPriceElem.first().text()))
    }
}

main().catch(console.error)
