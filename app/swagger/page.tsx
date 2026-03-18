"use client"

import { useEffect, useState } from "react"
// @ts-ignore
import SwaggerUI from "swagger-ui-react"
import "swagger-ui-react/swagger-ui.css"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlertTriangle, LogIn } from "lucide-react"

export default function SwaggerPage() {
    const [mounted, setMounted] = useState(false)
    const [authorized, setAuthorized] = useState<boolean | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // Check authorization
        const checkAdmin = async () => {
            try {
                const res = await fetch("/api/swagger", {
                    credentials: "include", // Include cookies in request
                })
                if (res.status === 401) {
                    setError("Вы должны быть авторизованы")
                    setAuthorized(false)
                } else if (res.status === 403) {
                    setError("Требуется роль администратора")
                    setAuthorized(false)
                } else if (res.ok) {
                    setAuthorized(true)
                } else {
                    setError("Ошибка при загрузке документации")
                    setAuthorized(false)
                }
            } catch (err) {
                setError("Ошибка при проверке авторизации")
                setAuthorized(false)
            }
        }

        checkAdmin()
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <main className="min-h-screen bg-background">
                <Navbar />
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
            </main>
        )
    }

    if (authorized === false) {
        return (
            <main className="min-h-screen bg-background">
                <Navbar />
                <div className="pt-24 pb-12 px-4">
                    <div className="max-w-2xl mx-auto">
                        <div className="glass rounded-2xl p-8 flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mb-6">
                                <AlertTriangle className="w-8 h-8 text-destructive" />
                            </div>
                            <h1 className="text-3xl font-bold text-foreground mb-3">{error}</h1>
                            <p className="text-muted-foreground mb-8">
                                Доступ к документации API ограничен для администраторов
                            </p>
                            <Link href="/">
                                <Button className="gap-2">
                                    <LogIn className="w-4 h-4" />
                                    Вернуться на главную
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
                <Footer />
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-background">
            <Navbar />
            <div className="pt-20">
                <SwaggerUI
                    url="/api/swagger"
                    persistAuthorization={true}
                />
            </div>
            <Footer />
        </main>
    )
}
