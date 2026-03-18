/**
 * Sanitize wishlist input to prevent issues with special characters
 */
export function sanitizeWishlistName(name: string): string {
    if (!name) return "Untitled Wishlist"
    
    // Remove extra whitespace and limit length
    return name
        .trim()
        .slice(0, 50)
        .replace(/\s+/g, " ") // Replace multiple spaces with single space
}

/**
 * Sanitize wishlist description
 */
export function sanitizeWishlistDescription(desc: string): string {
    if (!desc) return ""
    
    return desc
        .trim()
        .slice(0, 200)
        .replace(/\s+/g, " ") // Replace multiple spaces with single space
}

/**
 * Validate emoji is single character and valid
 */
export function validateEmoji(emoji: string): boolean {
    if (!emoji) return false
    // Check if it's a single emoji/character
    return emoji.length <= 2 && /\p{Emoji}/u.test(emoji)
}

/**
 * Sanitize emoji - return first valid character or default
 */
export function sanitizeEmoji(emoji: string): string {
    if (!emoji || emoji.trim().length === 0) return "🎁"
    
    const trimmed = emoji.trim()
    // Accept any valid emoji character
    return /\p{Emoji}/u.test(trimmed) ? trimmed : "🎁"
}

/**
 * Validate and clean wishlist data
 */
export function validateWishlistData(data: {
    name: string
    description?: string | null
    emoji: string
    isPrivate: boolean
}): {
    name: string
    description: string
    emoji: string
    isPrivate: boolean
} {
    return {
        name: sanitizeWishlistName(data.name),
        description: sanitizeWishlistDescription(data.description || ""),
        emoji: sanitizeEmoji(data.emoji),
        isPrivate: Boolean(data.isPrivate),
    }
}
