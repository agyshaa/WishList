"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { Search, SlidersHorizontal, Sparkles, X, LayoutGrid, Grid2X2, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useMemo, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
import { cn } from "@/lib/utils"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import type { WishlistItem } from "@/lib/types"

interface FilterState {
    categories: string[]
    minPrice: number
    maxPrice: number
    searchQuery: string
    sortBy: "newest" | "price-asc" | "price-desc"
}

export default function DiscoverPage() {
    const { t } = useLanguage()
    const [showFilters, setShowFilters] = useState(false)
    const [filters, setFilters] = useState<FilterState>({
        categories: [],
        minPrice: 0,
        maxPrice: 10000,
        searchQuery: "",
        sortBy: "newest",
    })
    const [showInspiration, setShowInspiration] = useState(false)
    const [allItems, setAllItems] = useState<WishlistItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [maxPrice, setMaxPrice] = useState(10000)
    const [availableCategories, setAvailableCategories] = useState<string[]>([])

    // UI states
    const [viewMode, setViewMode] = useState<"grid-lg" | "grid-sm" | "list">("grid-lg")
    const [visibleCount, setVisibleCount] = useState(9)

    // Fetch public items on mount
    useEffect(() => {
        const fetchPublicItems = async () => {
            try {
                const res = await fetch("/api/items/public")
                if (res.ok) {
                    const data = await res.json()
                    // Shuffle items on initial load for a random feed
                    const items = data.items || []
                    const shuffled = [...items].sort(() => Math.random() - 0.5)
                    setAllItems(shuffled)

                    if (data.items && data.items.length > 0) {
                        const itemsList = data.items as WishlistItem[]

                        const max = Math.max(...itemsList.map(item => item.price), 1000)
                        setMaxPrice(max)

                        // Extract unique categories directly from store tags or assign based on name/description 
                        // as mock-data WishlistItem might not have explicit category field 
                        const cats = new Set<string>()
                        itemsList.forEach(item => {
                            if (item.store) cats.add(item.store)
                            // Simulate categories based on keywords if needed
                            const titleLower = item.title.toLowerCase()
                            if (titleLower.includes('phone') || titleLower.includes('macbook') || titleLower.includes('monitor')) cats.add('Electronics')
                            if (titleLower.includes('shirt') || titleLower.includes('bag') || titleLower.includes('zara')) cats.add('Fashion')
                            if (titleLower.includes('machine') || titleLower.includes('home')) cats.add('Home')
                        })
                        setAvailableCategories(Array.from(cats))

                        // Update filter max price range
                        setFilters((prev) => ({
                            ...prev,
                            maxPrice: max,
                        }))
                    }
                }
            } catch (error) {
                console.error("Failed to fetch public items:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchPublicItems()
    }, [])

    const filteredItems = useMemo(() => {
        let result = allItems.filter((item) => {
            // Search query filter
            if (
                filters.searchQuery &&
                !item.title.toLowerCase().includes(filters.searchQuery.toLowerCase())
            ) {
                return false
            }

            // Price range filter
            if (item.price < filters.minPrice || item.price > filters.maxPrice) {
                return false
            }

            // Categories filter
            if (filters.categories.length > 0) {
                const titleLower = item.title.toLowerCase()
                let matchesCategory = false

                for (const cat of filters.categories) {
                    if (item.store === cat) matchesCategory = true
                    if (cat === 'Electronics' && (titleLower.includes('phone') || titleLower.includes('macbook') || titleLower.includes('monitor'))) matchesCategory = true
                    if (cat === 'Fashion' && (titleLower.includes('shirt') || titleLower.includes('bag') || titleLower.includes('zara'))) matchesCategory = true
                    if (cat === 'Home' && (titleLower.includes('machine') || titleLower.includes('home'))) matchesCategory = true
                }

                if (!matchesCategory) return false
            }

            return true
        })

        // Sorting
        if (filters.sortBy === "price-asc") {
            result.sort((a, b) => a.price - b.price)
        } else if (filters.sortBy === "price-desc") {
            result.sort((a, b) => b.price - a.price)
        } else {
            // newest - assuming order of arrival means newest first
            // We won't sort dynamically unless we have creation dates, keep existing order
        }

        return result
    }, [allItems, filters])

    // Reset pagination when filters change
    useEffect(() => {
        setVisibleCount(9)
    }, [filters.searchQuery, filters.categories, filters.minPrice, filters.maxPrice, filters.sortBy])

    // Generate inspired recommendations by shuffling the entire list
    const handleInspireMe = () => {
        if (allItems.length === 0) return

        // Shuffle all items
        const shuffled = [...allItems].sort(() => Math.random() - 0.5)
        setAllItems(shuffled)

        // Reset pagination
        setVisibleCount(9)

        // Show a quick pulse effect
        setShowInspiration(true)
        setTimeout(() => {
            setShowInspiration(false)
        }, 600)
    }

    // Display filtered items
    const displayItems = filteredItems

    // Category toggle helper
    const toggleCategory = (cat: string) => {
        setFilters(prev => {
            const newCats = prev.categories.includes(cat)
                ? prev.categories.filter(c => c !== cat)
                : [...prev.categories, cat]
            return { ...prev, categories: newCats }
        })
    }

    // Clear specific filter
    const removeFilter = (key: keyof FilterState) => {
        setFilters(prev => ({
            ...prev,
            [key]: key === 'categories' ? [] : key === 'searchQuery' ? "" : key === 'minPrice' ? 0 : key === 'maxPrice' ? maxPrice : "newest"
        }))
    }

    // Clear all filters
    const clearAllFilters = () => {
        setFilters({
            categories: [],
            minPrice: 0,
            maxPrice: maxPrice,
            searchQuery: "",
            sortBy: "newest"
        })
    }

    const hasActiveFilters = filters.searchQuery !== "" || filters.categories.length > 0 || filters.minPrice > 0 || filters.maxPrice < maxPrice || filters.sortBy !== "newest"

    return (
        <main className="min-h-screen bg-background">
            <Navbar />

            <div className="pt-24 pb-12 px-4">
                <div className="max-w-7xl mx-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                                <div>
                                    <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                                        {t("discover.title")}
                                    </h1>
                                    <p className="text-muted-foreground text-lg">
                                        {t("discover.subtitle")}
                                    </p>
                                </div>
                                <Button
                                    onClick={handleInspireMe}
                                    disabled={displayItems.length === 0}
                                    className="px-8 shadow-md"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    {t("discover.inspireMe")}
                                </Button>
                            </div>

                            {/* Search, Filter, and View Toggles */}
                            <div className="flex flex-col lg:flex-row gap-4 mb-6 justify-between lg:items-center">
                                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                                    <div className="relative flex-1 max-w-xl">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                        <Input
                                            placeholder={t("discover.searchProducts")}
                                            value={filters.searchQuery}
                                            onChange={(e) =>
                                                setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))
                                            }
                                            className="pl-10 h-10 lg:h-12 bg-muted border-border focus:border-primary"
                                        />
                                    </div>
                                    <Button
                                        onClick={() => setShowFilters(!showFilters)}
                                        variant="outline"
                                        className="h-10 lg:h-12 gap-2 border-border bg-transparent w-full sm:w-auto"
                                    >
                                        <SlidersHorizontal className="w-4 h-4" />
                                        {t("discover.filters")}
                                    </Button>
                                </div>

                                {/* View Mode Toggles */}
                                <div className="hidden sm:flex items-center p-1 bg-muted/50 rounded-xl border border-border/50 self-start lg:self-auto">
                                    <button
                                        onClick={() => setViewMode("grid-lg")}
                                        className={cn(
                                            "p-2.5 rounded-lg transition-smooth flex items-center gap-2 text-sm font-medium",
                                            viewMode === "grid-lg" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                        )}
                                        title="Large Grid"
                                    >
                                        <Grid2X2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode("grid-sm")}
                                        className={cn(
                                            "p-2.5 rounded-lg transition-smooth flex items-center gap-2 text-sm font-medium",
                                            viewMode === "grid-sm" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                        )}
                                        title="Small Grid"
                                    >
                                        <LayoutGrid className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode("list")}
                                        className={cn(
                                            "p-2.5 rounded-lg transition-smooth flex items-center gap-2 text-sm font-medium",
                                            viewMode === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                        )}
                                        title="List View"
                                    >
                                        <List className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Active Filters Row */}
                            {hasActiveFilters && (
                                <div className="flex flex-wrap items-center gap-2 mb-6">
                                    <span className="text-sm text-muted-foreground mr-2">{t("discover.activeFilters")}:</span>

                                    {filters.searchQuery && (
                                        <Badge variant="secondary" className="flex items-center gap-1 pr-1.5 bg-muted text-foreground hover:bg-muted/80 border border-border/50">
                                            "{filters.searchQuery}"
                                            <button onClick={() => removeFilter('searchQuery')} className="hover:bg-background/50 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                                        </Badge>
                                    )}

                                    {filters.categories.map(cat => (
                                        <Badge key={cat} variant="secondary" className="flex items-center gap-1 pr-1.5 bg-muted text-foreground hover:bg-muted/80 border border-border/50">
                                            {cat}
                                            <button onClick={() => toggleCategory(cat)} className="hover:bg-background/50 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                                        </Badge>
                                    ))}

                                    {(filters.minPrice > 0 || filters.maxPrice < maxPrice) && (
                                        <Badge variant="secondary" className="flex items-center gap-1 pr-1.5 bg-muted text-foreground hover:bg-muted/80 border border-border/50">
                                            ₴{filters.minPrice} - ₴{filters.maxPrice}
                                            <button onClick={() => {
                                                setFilters(prev => ({ ...prev, minPrice: 0, maxPrice: maxPrice }))
                                            }} className="hover:bg-background/50 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                                        </Badge>
                                    )}

                                    {filters.sortBy !== "newest" && (
                                        <Badge variant="secondary" className="flex items-center gap-1 pr-1.5 bg-muted text-foreground hover:bg-muted/80 border border-border/50">
                                            {filters.sortBy === 'price-asc' ? t("discover.priceLow") : t("discover.priceHigh")}
                                            <button onClick={() => removeFilter('sortBy')} className="hover:bg-background/50 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                                        </Badge>
                                    )}

                                    <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-xs h-6 px-2 text-muted-foreground hover:text-foreground">
                                        {t("discover.clearFilters")}
                                    </Button>
                                </div>
                            )}

                            {/* Filters Panel */}
                            <div className={cn(
                                "grid transition-all duration-300 ease-in-out overflow-hidden mb-6",
                                showFilters ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                            )}>
                                <div className="min-h-0">
                                    <div className="glass rounded-2xl p-6 border border-border/50 shadow-sm mt-1">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                                <SlidersHorizontal className="w-5 h-5 text-primary" />
                                                {t("discover.advancedFilters")}
                                            </h3>
                                            <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                                                <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                                            </button>
                                        </div>

                                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                            {/* Price Range */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-sm font-semibold text-foreground uppercase tracking-wider">
                                                        {t("discover.priceRange")}
                                                    </label>
                                                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">
                                                        ₴{filters.minPrice} - ₴{filters.maxPrice}
                                                    </span>
                                                </div>

                                                <div className="pt-4 px-2">
                                                    <Slider
                                                        value={[filters.minPrice, filters.maxPrice]}
                                                        min={0}
                                                        max={maxPrice}
                                                        step={100}
                                                        onValueChange={([min, max]) => setFilters(prev => ({ ...prev, minPrice: min, maxPrice: max }))}
                                                        className="my-4"
                                                    />
                                                </div>

                                                {/* Optional direct inputs for precision */}
                                                <div className="flex items-center gap-3">
                                                    <div className="relative flex-1">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₴</span>
                                                        <Input
                                                            type="number"
                                                            value={filters.minPrice}
                                                            onChange={(e) => setFilters(prev => ({ ...prev, minPrice: Math.max(0, parseInt(e.target.value) || 0) }))}
                                                            className="pl-7 h-9 text-xs bg-muted/50"
                                                        />
                                                    </div>
                                                    <span className="text-muted-foreground">-</span>
                                                    <div className="relative flex-1">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₴</span>
                                                        <Input
                                                            type="number"
                                                            value={filters.maxPrice}
                                                            onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: Math.min(maxPrice, Math.max(prev.minPrice, parseInt(e.target.value) || maxPrice)) }))}
                                                            className="pl-7 h-9 text-xs bg-muted/50"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Sort Options */}
                                            <div className="space-y-4">
                                                <label className="text-sm font-semibold text-foreground uppercase tracking-wider">
                                                    {t("discover.sortBy")}
                                                </label>
                                                <div className="space-y-2">
                                                    {[
                                                        { id: "newest", label: t("discover.newest") },
                                                        { id: "price-asc", label: t("discover.priceLow") },
                                                        { id: "price-desc", label: t("discover.priceHigh") },
                                                    ].map((option) => (
                                                        <div
                                                            key={option.id}
                                                            onClick={() => setFilters(prev => ({ ...prev, sortBy: option.id as any }))}
                                                            className={cn(
                                                                "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                                                                filters.sortBy === option.id
                                                                    ? "border-primary bg-primary/5 shadow-sm"
                                                                    : "border-border/50 bg-background hover:bg-accent"
                                                            )}
                                                        >
                                                            <span className={cn("text-sm", filters.sortBy === option.id ? "font-medium text-primary" : "text-foreground")}>
                                                                {option.label}
                                                            </span>
                                                            {filters.sortBy === option.id && (
                                                                <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-border/50 flex justify-end">
                                            <Button onClick={() => setShowFilters(false)} className="px-8 shadow-md">
                                                {t("discover.showResults")} {filteredItems.length} {t("discover.results")}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Results Info */}
                            <div className="mb-4 text-sm text-muted-foreground">
                                {displayItems.length > 0 ? (
                                    <span>{displayItems.length} {t("discover.itemsFound")}</span>
                                ) : (
                                    <span className="text-amber-600">{t("discover.noItems")}</span>
                                )}
                            </div>

                            {/* Product Grid / List */}
                            <div className={`transition-opacity duration-300 ${showInspiration ? "animate-pulse" : ""}`}>
                                {displayItems.length > 0 ? (
                                    <div className={cn(
                                        "gap-4 sm:gap-6",
                                        viewMode === "grid-lg" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" :
                                            viewMode === "grid-sm" ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" :
                                                "flex flex-col"
                                    )}>
                                        {displayItems.slice(0, visibleCount).map((item) => (
                                            <div key={item.id} className="w-full">
                                                <ProductCard
                                                    item={item}
                                                    viewMode={viewMode === "list" ? "list" : "grid"}
                                                    variant={viewMode === "grid-sm" ? "compact" : "default"}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-16">
                                        <p className="text-muted-foreground mb-4">{t("discover.noItems")}</p>
                                        <Button
                                            onClick={() => setFilters({
                                                categories: [],
                                                minPrice: 0,
                                                maxPrice: maxPrice,
                                                searchQuery: "",
                                                sortBy: "newest"
                                            })}
                                            variant="outline"
                                            className="bg-transparent"
                                        >
                                            {t("discover.clearFilters")}
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Load More Pagination */}
                            {displayItems.length > visibleCount && !showInspiration && (
                                <div className="text-center mt-12 mb-8">
                                    <Button
                                        onClick={() => setVisibleCount(prev => prev + 9)}
                                        variant="outline"
                                        className="border-primary text-primary hover:bg-primary/10 bg-transparent px-8"
                                    >
                                        {/* Translate this if dictionary has it, otherwise fallback to English */}
                                        {t("discover.loadMore") || "Load More (9)"}
                                    </Button>
                                    <p className="text-sm text-muted-foreground mt-3">
                                        {t("discover.showing")} {visibleCount} {t("discover.of")} {displayItems.length} {t("discover.itemsText")}
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <Footer />
        </main>
    )
}