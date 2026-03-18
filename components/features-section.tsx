"use client"

import { Zap, Eye, Key, Palette } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

// Зберігаємо масив зовні, але замість тексту вказуємо ключі з JSON
const features = [
    {
        icon: Zap,
        titleKey: "home.features.smartParsing",
        descriptionKey: "home.features.smartParsingDesc",
        color: "text-secondary",
    },
    {
        icon: Eye,
        titleKey: "home.features.beautyDisplay",
        descriptionKey: "home.features.beautyDisplayDesc",
        color: "text-primary",
    },
    {
        icon: Key,
        titleKey: "home.features.privateKeys",
        descriptionKey: "home.features.privateKeysDesc",
        color: "text-secondary",
    },
    {
        icon: Palette,
        titleKey: "home.features.personalize",
        descriptionKey: "home.features.personalizeDesc",
        color: "text-primary",
    },
]

export function FeaturesSection() {
    const { t } = useLanguage()

    return (
        <section className="py-24 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    {/* Зверни увагу: я вивів заголовок єдиним рядком, оскільки в JSON це один рядок */}
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                        {t("home.features.title")}
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        {t("home.features.subtitle")}
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {features.map((feature, index) => {
                        const Icon = feature.icon // Для зручності рендеру іконки як компонента
                        return (
                            <div key={index} className="glass rounded-2xl p-6 transition-smooth hover:scale-[1.02] group">
                                <div
                                    className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4 transition-smooth group-hover:scale-110`}
                                >
                                    <Icon className={`w-6 h-6 ${feature.color}`} />
                                </div>
                                {/* Динамічно перекладаємо ключі */}
                                <h3 className="text-xl font-semibold text-foreground mb-2">
                                    {t(feature.titleKey)}
                                </h3>
                                <p className="text-muted-foreground">
                                    {t(feature.descriptionKey)}
                                </p>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}