import { NextResponse } from "next/server"
import { parseProduct } from "@/lib/parser/index"

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const url = "https://brain.com.ua/ukr/Zaryadna_stanciya_Jackery_Explorer_1000_v2_1500W_1070Wh_Explorer_1000_v2-p1312603.html"
        const data = await parseProduct(url)

        return NextResponse.json({ data })
    } catch (error: any) {
        return NextResponse.json(
            { error: "Failed to fetch items", details: error.message },
            { status: 500 }
        )
    }
}
