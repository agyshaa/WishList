"use client"

import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { RefreshCw, Home, AlertTriangle, Bug } from "lucide-react"
import { useEffect, useState } from "react"
import { useLanguage } from "@/lib/language-context"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    const [showDetails, setShowDetails] = useState(false)
    const [pulseCount, setPulseCount] = useState(0)
    const { t } = useLanguage()

    useEffect(() => {
        console.error(error)
    }, [error])

    useEffect(() => {
        const interval = setInterval(() => {
            setPulseCount((c) => (c + 1) % 3)
        }, 800)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="flex-1 flex items-center justify-center relative px-4">
                {/* Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div
                        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-3xl"
                        style={{ background: "oklch(0.55 0.22 25)" }}
                    />
                </div>

                <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto">
                    {/* Animated error icon */}
                    <div className="relative mb-8">
                        <div className="w-28 h-28 rounded-3xl glass flex items-center justify-center">
                            <AlertTriangle className="w-14 h-14 text-destructive" />
                        </div>
                        {/* Pulsing rings */}
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className="absolute inset-0 rounded-3xl border-2 border-destructive/30 transition-all duration-500"
                                style={{
                                    transform: `scale(${pulseCount === i ? 1.3 : 1})`,
                                    opacity: pulseCount === i ? 0 : 0.3,
                                }}
                            />
                        ))}
                    </div>

                    <h1
                        className="text-3xl sm:text-4xl font-bold text-foreground mb-3"
                        style={{ fontFamily: "var(--font-heading)" }}
                    >
                        {t("errorPage.title")}
                    </h1>
                    <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                        {t("errorPage.description")}
                    </p>

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                        <Button
                            size="lg"
                            onClick={reset}
                            className="bg-primary hover:bg-primary/90 glow-primary gap-2 w-full sm:w-auto"
                        >
                            <RefreshCw className="w-4 h-4" />
                            {t("errorPage.tryAgain")}
                        </Button>
                        <a href="/">
                            <Button size="lg" variant="outline" className="border-border hover:bg-muted bg-transparent gap-2 w-full sm:w-auto">
                                <Home className="w-4 h-4" />
                                {t("errorPage.goHome")}
                            </Button>
                        </a>
                    </div>

                    {/* Error details toggle */}
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="mt-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-smooth"
                    >
                        <Bug className="w-3.5 h-3.5" />
                        {showDetails ? t("errorPage.hideDetails") : t("errorPage.showDetails")}
                    </button>

                    {showDetails && (
                        <div className="mt-4 w-full p-4 rounded-xl glass text-left overflow-auto max-h-48">
                            <p className="text-sm font-mono text-destructive mb-1">{error.name}: {error.message}</p>
                            {error.digest && (
                                <p className="text-xs font-mono text-muted-foreground">Digest: {error.digest}</p>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}