"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Mail, ArrowRight, Loader2 } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import Image from "next/image"

interface ResetResponse {
  message: string
  devToken?: string
  devResetLink?: string
}

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [email, setEmail] = useState("")
  const [info, setInfo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { t } = useLanguage()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setInfo(null)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data: ResetResponse = await response.json()

      if (response.ok) {
        if (data.devResetLink) {
          // Є посилання для скидання — редіректимо
          setIsRedirecting(true)
          router.push(data.devResetLink)
        } else {
          // Email не знайдено — показуємо нейтральне повідомлення
          setInfo(t("forgotPassword.emailNotFound"))
        }
      } else {
        setError(data.message || t("common.error"))
      }
    } catch (err) {
      setError(t("common.error"))
    } finally {
      if (!isRedirecting) {
        setIsLoading(false)
      }
    }
  }

  // Стан перенаправлення
  if (isRedirecting) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        </div>
        <div className="w-full max-w-md relative z-10">
          <div className="glass rounded-3xl p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-7 h-7 text-primary animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">{t("forgotPassword.redirecting")}</h1>
            <p className="text-muted-foreground">{t("forgotPassword.redirectingSubtitle")}</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 justify-center mb-8 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-smooth group-hover:glow-primary">
                <Image src="/icon.svg" alt="WishList Logo" width={32} height={32} className="w-8 h-8 rounded-lg" />
            </div>
          <span className="text-2xl font-bold text-foreground">WishList</span>
        </Link>

        {/* Card */}
        <div className="glass rounded-3xl p-8">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-smooth"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("auth.backToLogin")}
          </Link>

          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">{t("forgotPassword.title")}</h1>
            <p className="text-muted-foreground">{t("forgotPassword.subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-3 text-sm text-red-800 dark:text-red-300">
                {error}
              </div>
            )}
            {info && (
              <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-3 text-sm text-yellow-800 dark:text-yellow-300">
                {info}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("auth.emailPlaceholder")}
                className="bg-muted border-border h-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary/90 glow-primary text-base font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  {t("forgotPassword.sendReset")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </main>
  )
}
