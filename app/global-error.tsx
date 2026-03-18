"use client"

import { useEffect, useState } from "react"
import { RefreshCw, Sparkles } from "lucide-react"

// Створюємо міні-словник прямо у файлі, щоб уникнути будь-яких помилок імпорту
// Це найкраща практика для global-error, який має бути максимально незалежним
const translations = {
    uk: {
        title: "Критична помилка",
        description: "Щось пішло серйозно не так. Додаток спробує відновитися автоматично.",
        recoverBtn: "Відновити зараз"
    },
    en: {
        title: "Critical Error",
        description: "Something went seriously wrong. The app will attempt to recover automatically.",
        recoverBtn: "Recover Now"
    },
    pl: {
        title: "Błąd krytyczny",
        description: "Coś poszło nie tak. Aplikacja spróbuje automatycznie odzyskać sprawność.",
        recoverBtn: "Odzyskaj teraz"
    },
    de: {
        title: "Kritischer Fehler",
        description: "Etwas ist ernsthaft schiefgelaufen. Die App wird versuchen, sich automatisch wiederherzustellen.",
        recoverBtn: "Jetzt wiederherstellen"
    },
    es: {
        title: "Error crítico",
        description: "Algo salió gravemente mal. La aplicación intentará recuperarse automáticamente.",
        recoverBtn: "Recuperar ahora"
    },
    fr: {
        title: "Erreur critique",
        description: "Un problème grave est survenu. L'application va tenter de récupérer automatiquement.",
        recoverBtn: "Récupérer maintenant"
    }
}

type Language = keyof typeof translations

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    const [countdown, setCountdown] = useState(10)
    const [lang, setLang] = useState<Language>("en")

    useEffect(() => {
        console.error(error)
    }, [error])

    // Безпечно дістаємо мову з localStorage, оскільки контекст тут недоступний
    useEffect(() => {
        try {
            const savedLang = localStorage.getItem("wishlist_language") as Language
            if (savedLang && translations[savedLang]) {
                setLang(savedLang)
            } else {
                const browserLang = navigator.language.split("-")[0] as Language
                if (translations[browserLang]) setLang(browserLang)
            }
        } catch (e) {
            // Ігноруємо помилки доступу до localStorage
        }
    }, [])

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((c) => {
                if (c <= 1) {
                    clearInterval(timer)
                    reset()
                    return 0
                }
                return c - 1
            })
        }, 1000)
        return () => clearInterval(timer)
    }, [reset])

    const t = translations[lang]

    return (
        <html lang={lang} className="dark">
            <body
                style={{
                    margin: 0,
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "oklch(0.13 0.01 285)",
                    color: "oklch(0.98 0 0)",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                }}
            >
                <div style={{ textAlign: "center", padding: "2rem", maxWidth: "480px" }}>
                    {/* Logo */}
                    <div
                        style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "12px",
                            background: "oklch(0.65 0.25 295)",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: "2rem",
                        }}
                    >
                        <Sparkles style={{ width: "28px", height: "28px", color: "oklch(0.98 0 0)" }} />
                    </div>

                    <h1
                        style={{
                            fontSize: "2rem",
                            fontWeight: 700,
                            marginBottom: "0.75rem",
                            lineHeight: 1.2,
                        }}
                    >
                        {t.title}
                    </h1>
                    <p
                        style={{
                            color: "oklch(0.65 0 0)",
                            fontSize: "1.1rem",
                            lineHeight: 1.6,
                            marginBottom: "2rem",
                        }}
                    >
                        {t.description}
                    </p>

                    {/* Countdown ring */}
                    <div
                        style={{
                            position: "relative",
                            width: "80px",
                            height: "80px",
                            margin: "0 auto 2rem",
                        }}
                    >
                        <svg width="80" height="80" viewBox="0 0 80 80">
                            <circle
                                cx="40"
                                cy="40"
                                r="35"
                                fill="none"
                                stroke="oklch(0.25 0.02 285)"
                                strokeWidth="4"
                            />
                            <circle
                                cx="40"
                                cy="40"
                                r="35"
                                fill="none"
                                stroke="oklch(0.65 0.25 295)"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeDasharray={`${(countdown / 10) * 220} 220`}
                                transform="rotate(-90 40 40)"
                                style={{ transition: "stroke-dasharray 1s linear" }}
                            />
                        </svg>
                        <span
                            style={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "1.5rem",
                                fontWeight: 700,
                                fontVariantNumeric: "tabular-nums",
                            }}
                        >
                            {countdown}
                        </span>
                    </div>

                    <button
                        onClick={reset}
                        type="button"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "12px 24px",
                            borderRadius: "12px",
                            border: "none",
                            background: "oklch(0.65 0.25 295)",
                            color: "oklch(0.98 0 0)",
                            fontSize: "1rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "opacity 0.2s",
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.opacity = "0.9" }}
                        onMouseOut={(e) => { e.currentTarget.style.opacity = "1" }}
                    >
                        <RefreshCw style={{ width: "16px", height: "16px" }} />
                        {t.recoverBtn}
                    </button>
                </div>
            </body>
        </html>
    )
}