import { PrismaClient } from "@prisma/client";
import { parseProduct } from "./lib/parser/index";

const prisma = new PrismaClient();

async function run() {
    console.log("Fetching all wishlist items...");
    const items = await prisma.wishlistItem.findMany();
    
    console.log(`Found ${items.length} items. Starting update process...`);
    let updated = 0;
    
    for (const item of items) {
        if (!item.url) continue;
        
        try {
            console.log(`\nParsing [${item.store}] ${item.title.substring(0, 30)}...`);
            const parsed = await parseProduct(item.url);
            
            if (parsed.oldPrice && parsed.oldPrice > parsed.price) {
                console.log(`=> Found discount! Old: ${parsed.oldPrice}, New: ${parsed.price}. Saving...`);
                await prisma.wishlistItem.update({
                    where: { id: item.id },
                    data: {
                        oldPrice: parsed.oldPrice,
                        price: parsed.price 
                    }
                });
                updated++;
            } else if (parsed.price !== item.price) {
                console.log(`=> Price change without discount. Old DB: ${item.price}, New: ${parsed.price}. Saving...`);
                await prisma.wishlistItem.update({
                    where: { id: item.id },
                    data: {
                        price: parsed.price 
                    }
                });
                updated++;
            } else {
                console.log("=> Price unchanged, no discount.");
            }
        } catch (e: any) {
            console.error(`=> Failed to parse ${item.url}: ${e.message}`);
        }
    }
    
    console.log(`\nFinished! Updated ${updated} items.`);
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
