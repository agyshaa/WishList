"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Mail, Check, Copy, ExternalLink } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import Image from "next/image"

interface ResetResponse {
  message: string
  devToken?: string
  devResetLink?: string
}

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [email, setEmail] = useState("")
  const [devToken, setDevToken] = useState<string | null>(null)
  const [devResetLink, setDevResetLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { t } = useLanguage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data: ResetResponse = await response.json()

      if (response.ok) {
        setIsSubmitted(true)
        // Якщо в розробці, показуємо токен
        if (data.devToken) {
          setDevToken(data.devToken)
          setDevResetLink(data.devResetLink || null)
        }
      } else {
        setError(data.message || "Сталася помилка")
      }
    } catch (err) {
      setError("Помилка сполучення")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
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
          {!isSubmitted ? (
            <>
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
                    t("forgotPassword.sendReset")
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                <Check className="w-7 h-7 text-secondary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">{t("forgotPassword.checkEmail")}</h1>
              <p className="text-muted-foreground mb-6">
                {t("forgotPassword.sentTo")}
                <br />
                <span className="text-foreground font-medium">{email}</span>
              </p>

              {/* DEV MODE: Показуємо токен для тестування */}
              {devToken && (
                <div className="bg-muted border border-border rounded-lg p-4 mb-6 text-left">
                  <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 mb-2">🔧 DEV MODE</p>
                  
                  {/* Посилання */}
                  {devResetLink && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Reset Link:</p>
                      <div className="flex items-center gap-2">
                        <a
                          href={devResetLink}
                          className="text-xs text-primary hover:underline flex-1 break-all"
                        >
                          {devResetLink.substring(0, 50)}...
                        </a>
                        <a 
                          href={devResetLink}
                          className="text-muted-foreground hover:text-foreground p-1"
                          title="Open in new tab"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Токен */}
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-1">Reset Token:</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-background p-2 rounded flex-1 break-all">{devToken}</code>
                      <button
                        onClick={() => copyToClipboard(devToken)}
                        className="text-muted-foreground hover:text-foreground p-1"
                        title="Copy token"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={() => (window.location.href = "/login")}
                className="w-full h-12 bg-primary hover:bg-primary/90"
              >
                {t("auth.backToLogin")}
              </Button>

              <p className="mt-4 text-sm text-muted-foreground">
                {t("forgotPassword.notReceived")}{" "}
                <button onClick={() => setIsSubmitted(false)} className="text-primary hover:underline font-medium">
                  {t("forgotPassword.clickResend")}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
