export interface ProductData {
    title: string
    price: number
    oldPrice?: number
    currency: string
    image_url: string
    description: string
    source_url: string
    store_name: string
}

export interface ProductParser {
    parse(url: string, html: string): ProductData
}
