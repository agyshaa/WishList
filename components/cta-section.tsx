"use client"

import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"

export function CTASection() {
    const { t } = useLanguage()

    return (
        <section className="py-24 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="relative glass rounded-3xl p-8 sm:p-12 text-center overflow-hidden">
                    {/* Background gradient accent */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/30 rounded-full blur-3xl -z-10" />

                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 mb-6">
                        <Sparkles className="w-8 h-8 text-primary" />
                    </div>

                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
                        {t("cta.title")}
                    </h2>

                    <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8 text-pretty">
                        {t("cta.subtitle")}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" className="bg-primary hover:bg-primary/90 glow-primary text-lg px-8" asChild>
                            <Link href="/profile">{t("cta.createAccount")}</Link>
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="border-border hover:bg-muted text-lg px-8 bg-transparent"
                            asChild
                        >
                            <Link href="/discover">{t("cta.explore")}</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    )
}