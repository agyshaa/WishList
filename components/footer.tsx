"use client"

import { useEffect, useRef, useState } from "react"
import { Sparkles, Mail, Github, Twitter, Heart, ArrowUp } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import Image from "next/image"


export function Footer() {
    const currentYear = new Date().getFullYear()
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
    const footerRef = useRef<HTMLElement>(null)
    const [showScrollTop, setShowScrollTop] = useState(false)
    const { t } = useLanguage()

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 400)
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!footerRef.current) return
        const rect = footerRef.current.getBoundingClientRect()
        setMousePos({
            x: ((e.clientX - rect.left) / rect.width) * 100,
            y: ((e.clientY - rect.top) / rect.height) * 100,
        })
    }

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    // Використовуємо ключі для перекладу замість хардкоду
    const footerLinks = [
        {
            titleKey: "footer.categoryProduct",
            links: [
                { labelKey: "footer.discover", href: "/discover" },
                { labelKey: "footer.myLists", href: "/profile" },
                { labelKey: "footer.sharedWithMe", href: "/profile" },
            ],
        },
        {
            titleKey: "footer.categoryLegal",
            links: [
                { labelKey: "footer.privacyPolicy", href: "/privacy" },
                { labelKey: "footer.termsOfService", href: "/terms" },
            ],
        },
    ]

    return (
        <footer
            ref={footerRef}
            onMouseMove={handleMouseMove}
            className="relative border-t border-border overflow-hidden"
        >

            <div className="relative z-10 max-w-6xl mx-auto px-4 pt-20 pb-8">
                {/* Main footer grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
                    {/* Brand column */}
                    <div className="md:col-span-5">
                        <Link href="/" className="group inline-flex items-center gap-3 mb-5">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-smooth group-hover:glow-primary">
                                <Image src="/icon.svg" alt="WishList Logo" width={32} height={32} className="w-8 h-8 rounded-lg" />
                            </div>
                            <span className="text-2xl font-bold font-heading text-foreground">
                                Wish<span className="text-primary">List</span>
                            </span>
                        </Link>
                        <p className="text-muted-foreground leading-relaxed max-w-sm text-balance mb-6">
                            {t("footer.description")}
                        </p>
                    </div>

                    {/* Links columns */}
                    <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
                        {footerLinks.map((group) => (
                            <div key={group.titleKey}>
                                <h3 className="text-sm font-semibold font-heading text-foreground mb-4 uppercase tracking-wider">
                                    {t(group.titleKey)}
                                </h3>
                                <ul className="flex flex-col gap-3">
                                    {group.links.map((link) => (
                                        <li key={link.labelKey}>
                                            <Link
                                                href={link.href}
                                                className="group/link relative text-sm text-muted-foreground hover:text-foreground transition-smooth inline-flex items-center gap-1"
                                            >
                                                <span className="absolute -left-3 w-1.5 h-1.5 rounded-full bg-primary opacity-0 scale-0 group-hover/link:opacity-100 group-hover/link:scale-100 transition-smooth" />
                                                {t(link.labelKey)}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Divider with gradient */}
                <div className="relative h-px mb-8">
                    <div className="absolute inset-0 bg-border" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                </div>

                {/* Bottom bar */}
                <div className="flex flex-center sm:flex-row items-center justify-center gap-4">
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        {"© "}{currentYear}{" WishList. "}{t("footer.madeWithforDreamers")}
                    </p>
                </div>
            </div>

            {/* Scroll to top button */}
            <button
                type="button"
                onClick={scrollToTop}
                className={`fixed bottom-6 right-6 z-50 w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg transition-all duration-300 hover:opacity-90 active:scale-90 ${showScrollTop ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0 pointer-events-none"
                    }`}
                aria-label="Scroll to top"
            >
                <ArrowUp className="w-5 h-5" />
            </button>

            <style jsx>{`
        @keyframes orb-rise {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.15;
          }
          50% {
            transform: translateY(-120px) scale(1.2);
            opacity: 0.25;
          }
        }
      `}</style>
        </footer>
    )
}