"use client"

import { useEffect, useRef, useState } from "react"
import { useLanguage } from "@/lib/language-context"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
    Sparkles,
    Link2,
    Share2,
    Gift,
    Lock,
    Eye,
    Bell,
    CheckCircle2,
    ArrowRight,
    Play,
    Zap,
    Heart,
    Users,
    ShieldCheck,
} from "lucide-react"

interface Step {
    id: number
    icon: React.ComponentType<{ className?: string }>
    color: "primary" | "secondary"
}

const steps: Step[] = [
    { id: 1, icon: Sparkles, color: "primary" },
    { id: 2, icon: Link2, color: "secondary" },
    { id: 3, icon: Share2, color: "primary" },
    { id: 4, icon: Gift, color: "secondary" },
]

const featureIcons = [Lock, Eye, Bell, ShieldCheck]

function StepIllustration({ step, isVisible, t }: { step: Step; isVisible: boolean; t: (key: string) => string }) {
    const colorClass = step.color === "primary" ? "from-primary/20 to-primary/5" : "from-secondary/20 to-secondary/5"
    const glowClass = step.color === "primary" ? "bg-primary/30" : "bg-secondary/30"
    const iconBg = step.color === "primary" ? "bg-primary" : "bg-secondary"
    const iconColor = step.color === "primary" ? "text-primary-foreground" : "text-secondary-foreground"
    const Icon = step.icon

    return (
        <div className={`relative w-full max-w-md mx-auto transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            {/* Glow effect */}
            <div className={`absolute inset-0 ${glowClass} blur-3xl rounded-full opacity-40`} />

            {/* Card */}
            <div className={`relative bg-linear-to-br ${colorClass} rounded-3xl p-8 border border-border/50 backdrop-blur-sm`}>
                {/* Step number badge */}
                <div className="absolute -top-4 -left-4 w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center">
                    <span className="text-xl font-bold font-heading text-foreground">{step.id}</span>
                </div>

                {/* Main illustration area */}
                <div className="relative h-48 flex items-center justify-center mb-6">
                    {/* Animated background circles */}
                    <div className={`absolute w-32 h-32 rounded-full ${glowClass} opacity-20 animate-pulse`} />
                    <div className={`absolute w-24 h-24 rounded-full ${glowClass} opacity-30`} style={{ animationDelay: "0.5s" }} />

                    {/* Main icon */}
                    <div className={`relative w-20 h-20 rounded-2xl ${iconBg} flex items-center justify-center shadow-lg`}>
                        <Icon className={`w-10 h-10 ${iconColor}`} />
                    </div>

                    {/* Floating elements based on step */}
                    {step.id === 1 && (
                        <>
                            <div className="absolute top-4 right-8 w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center animate-float">
                                <Heart className="w-4 h-4 text-primary" />
                            </div>
                            <div className="absolute bottom-8 left-4 w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center animate-float" style={{ animationDelay: "1s" }}>
                                <Gift className="w-5 h-5 text-secondary" />
                            </div>
                        </>
                    )}
                    {step.id === 2 && (
                        <>
                            <div className="absolute top-2 left-8 px-3 py-1.5 rounded-lg bg-card border border-border text-xs text-muted-foreground animate-float">
                                amazon.com/...
                            </div>
                            <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-lg bg-card border border-border animate-float" style={{ animationDelay: "0.7s" }}>
                                <span className="text-xs text-secondary font-medium">$99.99</span>
                            </div>
                        </>
                    )}
                    {step.id === 3 && (
                        <>
                            <div className="absolute top-4 left-4 px-3 py-2 rounded-xl bg-card border border-border animate-float">
                                <span className="text-xs font-mono text-primary">WISH-A7X-K9M</span>
                            </div>
                            <div className="absolute bottom-6 right-6 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center animate-float" style={{ animationDelay: "0.5s" }}>
                                <Users className="w-4 h-4 text-muted-foreground" />
                            </div>
                        </>
                    )}
                    {step.id === 4 && (
                        <>
                            <div className="absolute top-6 right-4 w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center animate-float">
                                <CheckCircle2 className="w-5 h-5 text-secondary" />
                            </div>
                            <div className="absolute bottom-4 left-8 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-card border border-border animate-float" style={{ animationDelay: "0.8s" }}>
                                <span className="text-xs text-muted-foreground">Purchased</span>
                                <Eye className="w-3 h-3 text-muted-foreground line-through" />
                            </div>
                        </>
                    )}
                </div>

                {/* Features list */}
                <div className="space-y-2">
                    {[1, 2, 3].map((featureIdx) => (
                        <div
                            key={featureIdx}
                            className="flex items-center gap-2 text-sm text-muted-foreground"
                            style={{
                                transitionDelay: `${(featureIdx - 1) * 100 + 200}ms`,
                                opacity: isVisible ? 1 : 0,
                                transform: isVisible ? "translateX(0)" : "translateX(-10px)",
                                transition: "all 0.4s ease-out"
                            }}
                        >
                            <div className={`w-1.5 h-1.5 rounded-full ${step.color === "primary" ? "bg-primary" : "bg-secondary"}`} />
                            {t(`howItWorks.steps.step${step.id}Feature${featureIdx}`)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function TimelineConnector({ isVisible }: { isVisible: boolean }) {
    return (
        <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px">
            <div
                className="w-full bg-linear-to-b from-primary via-secondary to-primary transition-all duration-1000"
                style={{
                    height: isVisible ? "100%" : "0%",
                    opacity: isVisible ? 0.3 : 0
                }}
            />
        </div>
    )
}

export default function HowItWorksPage() {
    const { t } = useLanguage()
    const [visibleSteps, setVisibleSteps] = useState<number[]>([])
    const [activeStep, setActiveStep] = useState(0)
    const stepRefs = useRef<(HTMLDivElement | null)[]>([])

    useEffect(() => {
        const observers: IntersectionObserver[] = []

        stepRefs.current.forEach((ref, index) => {
            if (!ref) return

            const observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        setVisibleSteps((prev) => [...new Set([...prev, index])])
                        setActiveStep(index)
                    }
                },
                { threshold: 0.3 }
            )

            observer.observe(ref)
            observers.push(observer)
        })

        return () => observers.forEach((obs) => obs.disconnect())
    }, [])

    return (
        <main className="min-h-screen bg-background">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-4 overflow-hidden">
                {/* Background effects */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
                </div>

                <div className="relative max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-heading text-foreground mb-6 text-balance">
                        {t("howItWorks.hero.title")}{" "}
                        <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-secondary">
                            {t("howItWorks.hero.titleHighlight")}
                        </span>
                    </h1>

                    <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-balance leading-relaxed">
                        {t("howItWorks.hero.subtitle")}
                    </p>

                    {/* Quick stats */}
                    <div className="flex flex-wrap items-center justify-center gap-8 mb-12">
                        {[
                            { label: "steps", value: "4" },
                            { label: "setupTime", value: "2" },
                        ].map((stat) => (
                            <div key={stat.label} className="text-center">
                                <p className="text-3xl font-bold font-heading text-foreground">{stat.value}</p>
                                <p className="text-sm text-muted-foreground">{t(`howItWorks.hero.stats.${stat.label}`)}</p>
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/signup">
                            <Button size="lg" className="bg-primary hover:bg-primary/90 glow-primary px-8">
                                {t("howItWorks.hero.cta1")}
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                        <Link href="/discover">
                            <Button size="lg" variant="outline" className="bg-transparent border-border hover:bg-muted/50 px-8">
                                {t("howItWorks.hero.cta2")}
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Steps Section */}
            <section className="relative py-20 px-4">
                <div className="max-w-6xl mx-auto">
                    {/* Section header */}
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold font-heading text-foreground mb-4">
                            {t("howItWorks.steps.title")}
                        </h2>
                        <p className="text-muted-foreground max-w-xl mx-auto">
                            {t("howItWorks.steps.subtitle")}
                        </p>
                    </div>

                    {/* Steps with timeline */}
                    <div className="relative">
                        <TimelineConnector isVisible={visibleSteps.length > 0} />

                        <div className="space-y-24 lg:space-y-32">
                            {steps.map((step, index) => (
                                <div
                                    key={step.id}
                                    ref={(el) => { if (el) stepRefs.current[index] = el }}
                                    className={`relative grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${index % 2 === 1 ? "lg:flex-row-reverse" : ""}`}
                                >
                                    {/* Text content */}
                                    <div className={`${index % 2 === 1 ? "lg:order-2" : ""}`}>
                                        <div
                                            className={`transition-all duration-700 ${visibleSteps.includes(index) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                                        >
                                            {/* Step indicator */}
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className={`w-10 h-10 rounded-xl ${step.color === "primary" ? "bg-primary/10" : "bg-secondary/10"} flex items-center justify-center`}>
                                                    <span className={`text-lg font-bold font-heading ${step.color === "primary" ? "text-primary" : "text-secondary"}`}>
                                                        {step.id}
                                                    </span>
                                                </div>
                                                <div className={`h-px flex-1 max-w-25 ${step.color === "primary" ? "bg-primary/30" : "bg-secondary/30"}`} />
                                            </div>

                                            <h3 className="text-2xl sm:text-3xl font-bold font-heading text-foreground mb-4">
                                                {t(`howItWorks.steps.step${index + 1}Title`)}
                                            </h3>
                                            <p className="text-muted-foreground leading-relaxed text-lg">
                                                {t(`howItWorks.steps.step${index + 1}Desc`)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Illustration */}
                                    <div className={`${index % 2 === 1 ? "lg:order-1" : ""}`}>
                                        <StepIllustration step={step} isVisible={visibleSteps.includes(index)} t={t} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-20 px-4 bg-card/30">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl font-bold font-heading text-foreground mb-4">
                            {t("howItWorks.features.title")}
                        </h2>
                        <p className="text-muted-foreground max-w-xl mx-auto">
                            {t("howItWorks.features.subtitle")}
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((idx) => {
                            const FeatureIcon = featureIcons[idx - 1]
                            return (
                                <div
                                    key={idx}
                                    className="group glass rounded-2xl p-6 hover:glow-primary transition-smooth cursor-default"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-smooth">
                                        <FeatureIcon className="w-6 h-6 text-primary group-hover:scale-110 transition-smooth" />
                                    </div>
                                    <h3 className="text-lg font-semibold font-heading text-foreground mb-2">
                                        {t(`howItWorks.features.feature${idx}Title`)}
                                    </h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {t(`howItWorks.features.feature${idx}Desc`)}
                                    </p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-24 px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="relative">
                        {/* Background glow */}
                        <div className="absolute inset-0 bg-linear-to-r from-primary/20 via-secondary/20 to-primary/20 blur-3xl rounded-full" />

                        <div className="relative glass rounded-3xl p-10 sm:p-14">
                            <Zap className="w-12 h-12 text-secondary mx-auto mb-6" />
                            <h2 className="text-3xl sm:text-4xl font-bold font-heading text-foreground mb-4">
                                {t("howItWorks.finalCta.title")}
                            </h2>
                            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                                {t("howItWorks.finalCta.subtitle")}
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link href="/signup">
                                    <Button size="lg" className="bg-primary hover:bg-primary/90 glow-primary px-10">
                                        {t("howItWorks.finalCta.button")}
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    )
}
