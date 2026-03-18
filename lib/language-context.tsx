"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type Language = "uk" | "en" | "fr" | "es" | "de" | "pl" // Extend with more languages as needed

interface LanguageContextType {
    language: Language
    setLanguage: (lang: Language) => void
    t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface Translations {
    [key: string]: any
}

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>("uk")
    const [translations, setTranslations] = useState<Translations>({})
    const [isLoading, setIsLoading] = useState(true)

    // Load translations on mount and language change
    useEffect(() => {
        const loadTranslations = async () => {
            try {
                const response = await fetch(`/locales/${language}.json`)
                const data = await response.json()
                setTranslations(data)
            } catch (error) {
                console.error(`Failed to load translations for ${language}:`, error)
            } finally {
                setIsLoading(false)
            }
        }

        loadTranslations()
    }, [language])

    // Load saved language preference
    useEffect(() => {
        const savedLanguage = localStorage.getItem("language") as Language | null
        if (savedLanguage && ["uk", "en"].includes(savedLanguage)) {
            setLanguage(savedLanguage)
        }
    }, [])

    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang)
        localStorage.setItem("language", lang)
    }

    // Function to get nested translation by dot notation
    // e.g., "auth.login" gets translations.auth.login
    const translate = (key: string): string => {
        const keys = key.split(".")
        let value: any = translations

        for (const k of keys) {
            if (value && typeof value === "object" && k in value) {
                value = value[k]
            } else {
                return key // Return key if not found
            }
        }

        return typeof value === "string" ? value : key
    }

    return (
        <LanguageContext.Provider
            value={{
                language,
                setLanguage: handleSetLanguage,
                t: translate,
            }}
        >
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider")
    }
    return context
}
