"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { useLanguage } from "@/lib/language-context"
import {
    Shield,
    Eye,
    Database,
    Share2,
    Cookie,
    Baby,
    Mail,
    ChevronRight,
    ArrowUp,
} from "lucide-react"

// Використовуємо ключі замість тексту. pCount - це кількість абзаців.
const sections = [
    { id: "collect", icon: Database, pCount: 3 },
    { id: "use", icon: Eye, pCount: 3 },
    { id: "sharing", icon: Share2, pCount: 3 },
    { id: "cookies", icon: Cookie, pCount: 3 },
    { id: "children", icon: Baby, pCount: 2 },
    { id: "contact", icon: Mail, pCount: 3 },
]

export default function PrivacyPolicyPage() {
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
                    className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-150 ease-out"
                    style={{ width: `${scrollProgress * 100}%` }}
                />
            </div>

            {/* Background accents */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-32 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-32 -right-32 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 pt-28 pb-20">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6">
                        <Shield className="w-4 h-4 text-primary" />
                        <span className="text-sm text-muted-foreground">{t("privacyPolicy.tagline")}</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold font-heading text-foreground mb-4 text-balance">
                        {t("privacyPolicy.title")}
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
                        {t("privacyPolicy.description")}
                    </p>
                    <p className="text-sm text-muted-foreground/60 mt-4">
                        {t("privacyPolicy.lastUpdated")}
                    </p>
                </div>

                <div className="flex gap-12">
                    {/* Sticky sidebar nav (desktop) */}
                    <aside className="hidden lg:block w-56 shrink-0">
                        <div className="sticky top-28">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                                {t("privacyPolicy.onThisPage")}
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
                                                    ? "bg-primary/10 text-primary font-medium"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                                                }`}
                                        >
                                            <s.icon className={`w-4 h-4 shrink-0 transition-smooth ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                                            <span className="truncate">{t(`privacyPolicy.sections.${s.id}.title`)}</span>
                                        </a>
                                    )
                                })}
                            </nav>
                        </div>
                    </aside>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {/* TLDR card */}
                        <div className="glass rounded-2xl p-6 mb-12 border-primary/20">
                            <h2 className="text-sm font-semibold font-heading uppercase tracking-wider text-primary mb-3">
                                {t("privacyPolicy.tldr.title")}
                            </h2>
                            <ul className="flex flex-col gap-2 text-sm text-muted-foreground leading-relaxed">
                                {[1, 2, 3, 4].map((num) => (
                                    <li key={num} className="flex items-start gap-2">
                                        <ChevronRight className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                                        {t(`privacyPolicy.tldr.item${num}`)}
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
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                            <section.icon className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground/50 font-mono">
                                                {String(i + 1).padStart(2, "0")}
                                            </p>
                                            <h2 className="text-xl font-bold font-heading text-foreground">
                                                {t(`privacyPolicy.sections.${section.id}.title`)}
                                            </h2>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-4 pl-[52px]">
                                        {Array.from({ length: section.pCount }).map((_, j) => (
                                            <p
                                                key={j}
                                                className="text-muted-foreground leading-relaxed"
                                            >
                                                {t(`privacyPolicy.sections.${section.id}.p${j + 1}`)}
                                            </p>
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </div>

                        {/* Bottom nav */}
                        <div className="mt-20 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                            <Link
                                href="/terms"
                                className="text-sm text-primary hover:underline font-medium inline-flex items-center gap-1"
                            >
                                {t("privacyPolicy.readTerms")}
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                            <button
                                type="button"
                                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                                className="text-sm text-muted-foreground hover:text-foreground transition-smooth inline-flex items-center gap-1"
                            >
                                <ArrowUp className="w-4 h-4" />
                                {t("privacyPolicy.backToTop")}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    )
}