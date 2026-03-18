"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Menu, X, User, Settings, LogOut, Globe, Search, Loader2 } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useApp } from "@/lib/store"
import { useLanguage } from "@/lib/language-context"
import Image from "next/image"

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false)
    const { user, logout, isLoading } = useApp()
    const { language, setLanguage, t } = useLanguage()

    // Status for Search
    const [searchQuery, setSearchQuery] = useState("")
    const [isSearching, setIsSearching] = useState(false)
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [showResults, setShowResults] = useState(false)
    const searchRef = useRef<HTMLDivElement>(null)

    // Click Outside listener
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleLogout = () => {
        logout()
        window.location.href = "/"
    }

    // Допоміжна функція для відображення поточної мови в мобільному меню
    const getCurrentLanguageLabel = () => {
        switch (language) {
            case "uk": return "Українська";
            case "en": return "English";
            case "pl": return "Polski";
            case "de": return "Deutsch";
            case "es": return "Español";
            case "fr": return "Français";
            default: return "Language";
        }
    }

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-smooth group-hover:glow-primary">
                            <Image src="/icon.svg" alt="WishList Logo" width={32} height={32} className="w-8 h-8 rounded-lg" />
                        </div>
                        <span className="text-2xl font-bold font-heading text-foreground">
                            Wish<span className="text-primary">List</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link href="/discover" className="text-muted-foreground hover:text-foreground transition-smooth">
                            {t("navbar.discover")}
                        </Link>
                        {user && (
                            <Link href="/profile" className="text-muted-foreground hover:text-foreground transition-smooth">
                                {t("navbar.profile")}
                            </Link>
                        )}

                        {/* Language Switcher */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="p-2 hover:bg-muted rounded-lg transition-smooth">
                                    <Globe className="w-5 h-5 text-muted-foreground" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass w-40">
                                <DropdownMenuItem onClick={() => setLanguage("uk")} className={language === "uk" ? "bg-primary/20" : ""}>
                                    Українська
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setLanguage("en")} className={language === "en" ? "bg-primary/20" : ""}>
                                    English
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setLanguage("pl")} className={language === "pl" ? "bg-primary/20" : ""}>
                                    Polski
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setLanguage("de")} className={language === "de" ? "bg-primary/20" : ""}>
                                    Deutsch
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setLanguage("es")} className={language === "es" ? "bg-primary/20" : ""}>
                                    Español
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setLanguage("fr")} className={language === "fr" ? "bg-primary/20" : ""}>
                                    Français
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {isLoading ? (
                            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                        ) : user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-2 rounded-full border-2 border-transparent hover:border-primary/50 transition-smooth p-0.5">
                                        <Image
                                            src={user.avatar || "/placeholder.svg"}
                                            alt={user.name}
                                            width={32}
                                            height={32}
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 glass">
                                    <div className="px-3 py-2">
                                        <p className="font-medium text-foreground">{user.name}</p>
                                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                                    </div>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                                            <User className="w-4 h-4" />
                                            {t("profile.title")}
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/profile/settings" className="flex items-center gap-2 cursor-pointer">
                                            <Settings className="w-4 h-4" />
                                            {t("common.settings")}
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                                        <LogOut className="w-4 h-4 mr-2" />
                                        {t("navbar.logout")}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <>
                                <Link href="/login">
                                    <Button variant="outline" className="border-primary/50 hover:bg-primary/10 bg-transparent">
                                        {t("auth.login")}
                                    </Button>
                                </Link>
                                <Link href="/signup">
                                    <Button className="bg-primary hover:bg-primary/90 glow-primary">{t("auth.signup")}</Button>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button className="md:hidden p-2 text-foreground" onClick={() => setIsOpen(!isOpen)}>
                        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Navigation */}
                {isOpen && (
                    <div className="md:hidden py-4 border-t border-border">
                        <div className="flex flex-col gap-4">
                            <Link
                                href="/discover"
                                className="text-muted-foreground hover:text-foreground transition-smooth px-2"
                                onClick={() => setIsOpen(false)}
                            >
                                {t("navbar.discover")}
                            </Link>
                            {user && (
                                <Link
                                    href="/profile"
                                    className="text-muted-foreground hover:text-foreground transition-smooth px-2"
                                    onClick={() => setIsOpen(false)}
                                >
                                    {t("navbar.profile")}
                                </Link>
                            )}

                            {/* Mobile User Search */}
                            <div className="px-2 pb-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder={t("navbar.searchUsers") || "Search users..."}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground text-foreground"
                                    />
                                </div>

                                {/* Mobile Search Results */}
                                {searchQuery.trim() !== "" && (
                                    <div className="mt-2 glass rounded-xl border border-border/50 overflow-hidden flex flex-col">
                                        {isSearching ? (
                                            <div className="flex items-center justify-center p-4">
                                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                            </div>
                                        ) : searchResults.length > 0 ? (
                                            <div className="w-full max-h-60 overflow-y-auto">
                                                {searchResults.map(u => (
                                                    <Link
                                                        key={u.id}
                                                        href={`/u/${u.username}`}
                                                        onClick={() => { setShowResults(false); setIsOpen(false); setSearchQuery(""); }}
                                                        className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors w-full border-b border-border/50 last:border-0"
                                                    >
                                                        <Image src={u.avatar || "/placeholder.svg"} alt={u.name} width={32} height={32} className="w-8 h-8 rounded-full object-cover shrink-0 bg-muted" />
                                                        <div className="flex flex-col text-left overflow-hidden">
                                                            <span className="text-sm font-medium text-foreground truncate">{u.name}</span>
                                                            <span className="text-xs text-muted-foreground truncate">@{u.username}</span>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-4 text-sm text-muted-foreground text-center">
                                                {t("navbar.noUsersFound") || "No users found"}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Mobile Language Switcher */}
                            <div className="px-2 pb-2 border-b border-border">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start gap-2 bg-transparent border-primary/20">
                                            <Globe className="w-4 h-4 text-muted-foreground" />
                                            {getCurrentLanguageLabel()}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="center" className="glass w-[calc(100vw-2rem)] mx-4">
                                        <DropdownMenuItem onClick={() => { setLanguage("uk"); setIsOpen(false); }} className={language === "uk" ? "bg-primary/20" : ""}>Українська</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { setLanguage("en"); setIsOpen(false); }} className={language === "en" ? "bg-primary/20" : ""}>English</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { setLanguage("pl"); setIsOpen(false); }} className={language === "pl" ? "bg-primary/20" : ""}>Polski</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { setLanguage("de"); setIsOpen(false); }} className={language === "de" ? "bg-primary/20" : ""}>Deutsch</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { setLanguage("es"); setIsOpen(false); }} className={language === "es" ? "bg-primary/20" : ""}>Español</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { setLanguage("fr"); setIsOpen(false); }} className={language === "fr" ? "bg-primary/20" : ""}>Français</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {user ? (
                                <div className="flex flex-col gap-2 pt-2">
                                    <div className="flex items-center gap-3 px-2 py-2">
                                        <Image
                                            src={user.avatar || "/placeholder.svg"}
                                            alt={user.name}
                                            width={40}
                                            height={40}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                        <div>
                                            <p className="font-medium text-foreground">{user.name}</p>
                                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                                        </div>
                                    </div>
                                    <Link href="/profile/settings" onClick={() => setIsOpen(false)}>
                                        <Button variant="outline" className="w-full bg-transparent">
                                            <Settings className="w-4 h-4 mr-2" />
                                            {t("common.settings")}
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="outline"
                                        className="w-full text-destructive border-destructive/50 hover:bg-destructive/10 bg-transparent"
                                        onClick={handleLogout}
                                    >
                                        <LogOut className="w-4 h-4 mr-2" />
                                        {t("navbar.logout")}
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex gap-2 pt-2 px-2">
                                    <Link href="/login" className="flex-1" onClick={() => setIsOpen(false)}>
                                        <Button variant="outline" className="w-full border-primary/50 bg-transparent">
                                            {t("auth.login")}
                                        </Button>
                                    </Link>
                                    <Link href="/signup" className="flex-1" onClick={() => setIsOpen(false)}>
                                        <Button className="w-full bg-primary">{t("auth.signup")}</Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    )
}