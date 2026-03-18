"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Home, Search, ArrowLeft, Sparkles } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { useLanguage } from "@/lib/language-context"

function FloatingParticle({ delay, duration, x }: { delay: number; duration: number; x: number }) {
    return (
        <div
            className="absolute bottom-0 w-1 h-1 rounded-full bg-primary/40"
            style={{
                left: `${x}%`,
                animation: `rise ${duration}s ease-in ${delay}s infinite`,
            }}
        />
    )
}

function GlitchText() {
    const [offset, setOffset] = useState({ x: 0, y: 0 })
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setOffset({
                x: (Math.random() - 0.5) * 8,
                y: (Math.random() - 0.5) * 4,
            })
            setTimeout(() => setOffset({ x: 0, y: 0 }), 100)
        }, 3000)
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [])

    return (
        <div className="relative select-none">
            {/* Shadow layers for glitch */}
            <span
                className="absolute inset-0 text-[10rem] sm:text-[14rem] lg:text-[18rem] font-bold leading-none tracking-tighter opacity-20"
                style={{
                    fontFamily: "var(--font-heading)",
                    color: "oklch(0.65 0.25 295)",
                    transform: `translate(${offset.x}px, ${offset.y}px)`,
                    transition: "transform 0.05s",
                    clipPath: "inset(20% 0 30% 0)",
                }}
            >
                404
            </span>
            <span
                className="absolute inset-0 text-[10rem] sm:text-[14rem] lg:text-[18rem] font-bold leading-none tracking-tighter opacity-20"
                style={{
                    fontFamily: "var(--font-heading)",
                    color: "oklch(0.75 0.2 130)",
                    transform: `translate(${-offset.x}px, ${-offset.y}px)`,
                    transition: "transform 0.05s",
                    clipPath: "inset(50% 0 0 0)",
                }}
            >
                404
            </span>
            {/* Main text */}
            <span
                className="relative text-[10rem] sm:text-[14rem] lg:text-[18rem] font-bold leading-none tracking-tighter"
                style={{
                    fontFamily: "var(--font-heading)",
                    background: "linear-gradient(135deg, oklch(0.65 0.25 295), oklch(0.75 0.2 130))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                }}
            >
                404
            </span>
        </div>
    )
}

export default function NotFound() {
    const { t } = useLanguage()
    const particles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        delay: Math.random() * 5,
        duration: 4 + Math.random() * 6,
        x: Math.random() * 100,
    }))

    return (
        <div className="min-h-screen bg-background flex flex-col overflow-hidden">
            <Navbar />

            <main className="flex-1 flex items-center justify-center relative px-4">
                {/* Background effects */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div
                        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
                        style={{ background: "oklch(0.65 0.25 295)" }}
                    />
                    <div
                        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-8 blur-3xl"
                        style={{ background: "oklch(0.75 0.2 130)" }}
                    />
                    {/* Rising particles */}
                    {particles.map((p) => (
                        <FloatingParticle key={p.id} delay={p.delay} duration={p.duration} x={p.x} />
                    ))}
                </div>

                <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto">
                    {/* Animated 404 */}
                    <GlitchText />

                    {/* Broken gift icon */}
                    <div className="relative mt-2 mb-6">
                        <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center animate-float">
                            <Sparkles className="w-8 h-8 text-primary" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive flex items-center justify-center">
                            <span className="text-destructive-foreground text-xs font-bold">?</span>
                        </div>
                    </div>

                    <h1
                        className="text-2xl sm:text-3xl font-bold text-foreground mb-3"
                        style={{ fontFamily: "var(--font-heading)" }}
                    >
                        {t("notFound.title")}
                    </h1>
                    <p className="text-muted-foreground text-lg mb-10 max-w-md leading-relaxed">
                        {t("notFound.description")}
                    </p>

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                        <Link href="/">
                            <Button size="lg" className="bg-primary hover:bg-primary/90 glow-primary gap-2 w-full sm:w-auto">
                                <Home className="w-4 h-4" />
                                {t("notFound.backHome")}
                            </Button>
                        </Link>
                        <Link href="/discover">
                            <Button size="lg" variant="outline" className="border-primary/50 hover:bg-primary/10 bg-transparent gap-2 w-full sm:w-auto">
                                <Search className="w-4 h-4" />
                                {t("notFound.discover")}
                            </Button>
                        </Link>
                    </div>

                    {/* Browser back */}
                    <button
                        onClick={() => window.history.back()}
                        className="mt-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-smooth"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        {t("notFound.goBack")}
                    </button>
                </div>
            </main>

            {/* Particle animation keyframes */}
            <style>{`
        @keyframes rise {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          90% {
            opacity: 0;
          }
          100% {
            transform: translateY(-100vh) scale(0);
            opacity: 0;
          }
        }
      `}</style>
        </div>
    )
}