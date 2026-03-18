"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { useLanguage } from "@/lib/language-context"
import {
    Scale,
    FileText,
    UserCheck,
    AlertTriangle,
    Ban,
    RefreshCw,
    Gavel,
    ChevronRight,
    ArrowUp,
} from "lucide-react"

// Використовуємо pCount для кількості абзаців
const sections = [
    { id: "acceptance", icon: FileText, pCount: 2 },
    { id: "account", icon: UserCheck, pCount: 3 },
    { id: "content", icon: Scale, pCount: 3 },
    { id: "prohibited", icon: Ban, pCount: 4 },
    { id: "liability", icon: AlertTriangle, pCount: 3 },
    { id: "changes", icon: RefreshCw, pCount: 3 },
    { id: "governing", icon: Gavel, pCount: 3 },
]

export default function TermsOfServicePage() {
    const [activeSection, setActiveSection] = useState(sections[0].id)
    const [scrollProgress, setScrollProgress] = useState(0)
    const { t } = useLanguage()

    useEffect(() => {
        const handleScroll = () => {
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
            const progress = scrollHeight > 0 ? window.scrollY / scrollHeight : 0
            setScrollProgress(progress)

            for (const section of [...sections].reverse()) {
                const el = document.getElementById(section.id)
                if (el) {
                    const rect = el.getBoundingClientRect()
                    if (rect.top <= 200) {
                        setActiveSection(section.id)
                        break
                    }
                }
            }
        }
        window.addEventListener("scroll", handleScroll, { passive: true })
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    return (
        <main className="min-h-screen bg-background">
            <Navbar />

            {/* Reading progress bar */}
            <div className="fixed top-16 left-0 right-0 z-40 h-0.5 bg-muted/30">
                <div
                    className="h-full bg-gradient-to-r from-secondary to-primary transition-all duration-150 ease-out"
                    style={{ width: `${scrollProgress * 100}%` }}
                />
            </div>

            {/* Background accents */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-48 -right-32 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-48 -left-32 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 pt-28 pb-20">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6">
                        <Scale className="w-4 h-4 text-secondary" />
                        <span className="text-sm text-muted-foreground">{t("termsOfService.tagline")}</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold font-heading text-foreground mb-4 text-balance">
                        {t("termsOfService.title")}
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
                        {t("termsOfService.description")}
                    </p>
                    <p className="text-sm text-muted-foreground/60 mt-4">
                        {t("termsOfService.lastUpdated")}
                    </p>
                </div>

                <div className="flex gap-12">
                    {/* Sticky sidebar nav (desktop) */}
                    <aside className="hidden lg:block w-56 shrink-0">
                        <div className="sticky top-28">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                                {t("termsOfService.onThisPage")}
                            </p>
                            <nav className="flex flex-col gap-1">
                                {sections.map((s) => {
                                    const isActive = activeSection === s.id
                                    return (
                                        <a
                                            key={s.id}
                                            href={`#${s.id}`}
                                            onClick={(e) => {
                                                e.preventDefault()
                                                document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" })
                                            }}
                                            className={`group flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-smooth ${isActive
                                                    ? "bg-secondary/10 text-secondary font-medium"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                                                }`}
                                        >
                                            <s.icon className={`w-4 h-4 shrink-0 transition-smooth ${isActive ? "text-secondary" : "text-muted-foreground group-hover:text-foreground"}`} />
                                            <span className="truncate">{t(`termsOfService.sections.${s.id}.title`)}</span>
                                        </a>
                                    )
                                })}
                            </nav>
                        </div>
                    </aside>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {/* TLDR card */}
                        <div className="glass rounded-2xl p-6 mb-12 border-secondary/20">
                            <h2 className="text-sm font-semibold font-heading uppercase tracking-wider text-secondary mb-3">
                                {t("termsOfService.tldr.title")}
                            </h2>
                            <ul className="flex flex-col gap-2 text-sm text-muted-foreground leading-relaxed">
                                {[1, 2, 3, 4].map((num) => (
                                    <li key={num} className="flex items-start gap-2">
                                        <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                        {t(`termsOfService.tldr.item${num}`)}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Sections */}
                        <div className="flex flex-col gap-16">
                            {sections.map((section, i) => (
                                <section
                                    key={section.id}
                                    id={section.id}
                                    className="scroll-mt-28"
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                                            <section.icon className="w-5 h-5 text-secondary" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground/50 font-mono">
                                                {String(i + 1).padStart(2, "0")}
                                            </p>
                                            <h2 className="text-xl font-bold font-heading text-foreground">
                                                {t(`termsOfService.sections.${section.id}.title`)}
                                            </h2>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-4 pl-[52px]">
                                        {Array.from({ length: section.pCount }).map((_, j) => (
                                            <p
                                                key={j}
                                                className="text-muted-foreground leading-relaxed"
                                            >
                                                {t(`termsOfService.sections.${section.id}.p${j + 1}`)}
                                            </p>
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </div>

                        {/* Bottom nav */}
                        <div className="mt-20 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                            <Link
                                href="/privacy"
                                className="text-sm text-secondary hover:underline font-medium inline-flex items-center gap-1"
                            >
                                {t("termsOfService.readPrivacy")}
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                            <button
                                type="button"
                                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                                className="text-sm text-muted-foreground hover:text-foreground transition-smooth inline-flex items-center gap-1"
                            >
                                <ArrowUp className="w-4 h-4" />
                                {t("termsOfService.backToTop")}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    )
}