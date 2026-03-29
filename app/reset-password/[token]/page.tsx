"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Lock, Check, Eye, EyeOff } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import Image from "next/image"
import { useParams } from "next/navigation"

interface ResetStatus {
  state: "loading" | "error" | "form" | "success"
  message?: string
}

function ResetPasswordContent() {
  const params = useParams()
  const token = params.token as string
  const [status, setStatus] = useState<ResetStatus>({ state: "form" })
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const { t } = useLanguage()

  useEffect(() => {
    // Ensure token is available
    if (!token) {
      setStatus({ state: "error", message: t("resetPassword.invalidToken") })
    }
  }, [token, t])

  const validatePasswords = () => {
    if (newPassword.length < 6) {
      setValidationError(t("resetPassword.passwordTooShort"))
      return false
    }
    if (newPassword !== confirmPassword) {
      setValidationError(t("resetPassword.passwordMismatch"))
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    if (!validatePasswords()) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword,
          confirmPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus({
          state: "success",
          message: data.message || t("resetPassword.success"),
        })
      } else {
        setStatus({
          state: "error",
          message: data.error || t("common.error"),
        })
      }
    } catch (err) {
      setStatus({
        state: "error",
        message: t("common.error"),
      })
    } finally {
      setIsSubmitting(false)
    }
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
          {status.state === "loading" && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
              <p className="text-muted-foreground">{t("common.loading")}</p>
            </div>
          )}

          {status.state === "error" && (
            <>
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-7 h-7 text-red-600 dark:text-red-400" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">{t("resetPassword.tokenExpired")}</h1>
                <p className="text-muted-foreground mb-6">{status.message}</p>
              </div>

              <div className="space-y-3">
                <Link href="/forgot_password" className="block">
                  <Button className="w-full h-12 bg-primary hover:bg-primary/90">
                    {t("forgotPassword.sendReset")}
                  </Button>
                </Link>
                <Link href="/login" className="block">
                  <Button variant="outline" className="w-full h-12">
                    {t("auth.backToLogin")}
                  </Button>
                </Link>
              </div>
            </>
          )}

          {status.state === "form" && (
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
                  <Lock className="w-7 h-7 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">{t("resetPassword.title")}</h1>
                <p className="text-muted-foreground text-sm">{t("resetPassword.subtitle")}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {validationError && (
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-3 text-sm text-red-800 dark:text-red-300">
                    {validationError}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">{t("resetPassword.password")}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t("resetPassword.passwordPlaceholder")}
                      className="bg-muted border-border h-12 pr-10"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">{t("resetPassword.confirmPassword")}</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder={t("resetPassword.confirmPasswordPlaceholder")}
                      className="bg-muted border-border h-12 pr-10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-primary hover:bg-primary/90 glow-primary text-base font-medium"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    t("resetPassword.resetBtn")
                  )}
                </Button>
              </form>
            </>
          )}

          {status.state === "success" && (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                <Check className="w-7 h-7 text-secondary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">{t("resetPassword.success")}</h1>
              <p className="text-muted-foreground mb-8">{status.message || t("resetPassword.successMsg")}</p>

              <Button
                onClick={() => (window.location.href = "/login")}
                className="w-full h-12 bg-primary hover:bg-primary/90"
              >
                {t("auth.login")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ResetPasswordContent />
    </Suspense>
  )
}
