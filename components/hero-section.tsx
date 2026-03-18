"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Link2, Share2, Lock } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"

export function HeroSection() {
    const { t } = useLanguage()

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/10" />

            {/* Subtle animated shapes */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            {/* Hero content */}
            <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-muted-foreground mb-6">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                    {t("home.hero.tagline")}
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight text-balance">
                    {t("home.hero.title")}
                </h1>

                <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 text-pretty">
                    {t("home.hero.subtitle")}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                    <Button size="lg" className="bg-primary hover:bg-primary/90 glow-primary text-lg px-8" asChild>
                        <Link href="/signup">
                            {t("home.hero.cta")}
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Link>
                    </Button>
                    <Button
                        size="lg"
                        variant="outline"
                        className="border-border hover:bg-muted text-lg px-8 bg-transparent"
                        asChild
                    >
                        <Link href="/how_it_works">{t("home.hero.learn")}</Link>
                    </Button>
                </div>

                {/* Feature pills */}
                <div className="flex flex-wrap justify-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-sm">
                        <Link2 className="w-4 h-4 text-primary" />
                        <span>{t("home.features.smartParsing")}</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-sm">
                        <Share2 className="w-4 h-4 text-secondary" />
                        <span>{t("home.features.share")}</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-sm">
                        <Lock className="w-4 h-4 text-primary" />
                        <span>{t("home.features.privateKeys")}</span>
                    </div>
                </div>
            </div>
        </section>
    )
}