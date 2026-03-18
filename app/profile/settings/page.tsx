"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, User, Bell, Shield, Check, AlertTriangle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useApp } from "@/lib/store"
import { useLanguage } from "@/lib/language-context"

// Використовуємо ключі для перекладу назв секцій
const settingsSections = [
    { id: "profile", labelKey: "settings.tabs.profile", icon: User },
    { id: "privacy", labelKey: "settings.tabs.privacy", icon: Shield },
]

export default function SettingsPage() {
    const [activeSection, setActiveSection] = useState("profile")
    const [publicProfile, setPublicProfile] = useState(true)
    const [name, setName] = useState("")
    const [username, setUsername] = useState("")
    const [bio, setBio] = useState("")
    const [saved, setSaved] = useState(false)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

    const { user, isLoading, updateUser } = useApp()
    const router = useRouter()
    const { t } = useLanguage()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleAvatarClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith("image/")) {
            alert("Please select an image file")
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert("File size must be less than 5MB")
            return
        }

        try {
            // Convert to base64
            const reader = new FileReader()
            reader.onload = async (event) => {
                const base64 = event.target?.result as string
                setAvatarPreview(base64)
                await updateUser({ avatar: base64 })
                setSaved(true)
                setTimeout(() => setSaved(false), 2000)
            }
            reader.readAsDataURL(file)
        } catch (error) {
            console.error("Error uploading avatar:", error)
            alert("Failed to update avatar")
        }
    }

    useEffect(() => {
        if (!isLoading && !user) {
            router.push("/login")
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user) {
            setName(user.name)
            setUsername(user.username)
            setBio(user.bio || "")
        }
    }, [user])

    if (isLoading) {
        return (
            <main className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </main>
        )
    }

    if (!user) {
        return null
    }

    const handleSaveProfile = () => {
        updateUser({ name, username, bio })
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    return (
        <main className="min-h-screen bg-background">
            <Navbar />

            <div className="pt-24 pb-12 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Back link */}
                    <Link
                        href="/profile"
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-smooth"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t("settings.backToProfile")}
                    </Link>

                    <h1 className="text-2xl font-bold text-foreground mb-6">{t("settings.title")}</h1>

                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Sidebar */}
                        <div className="w-full md:w-56 space-y-1">
                            {settingsSections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-smooth ${activeSection === section.id
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                        }`}
                                >
                                    <section.icon className="w-5 h-5" />
                                    {t(section.labelKey)}
                                </button>
                            ))}
                        </div>

                        {/* Content */}
                        <div className="flex-1 glass rounded-2xl p-6">
                            {activeSection === "profile" && (
                                <div className="space-y-6">
                                    <h2 className="text-lg font-semibold text-foreground">{t("settings.profile.title")}</h2>

                                    {/* Avatar */}
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity">
                                            <Image
                                                src={avatarPreview || user.avatar || "/placeholder.svg"}
                                                alt={user.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div>
                                            <Button
                                                onClick={handleAvatarClick}
                                                variant="outline"
                                                size="sm"
                                                className="bg-transparent"
                                            >
                                                {t("settings.profile.changePhoto")}
                                            </Button>
                                            <p className="text-xs text-muted-foreground mt-1">{t("settings.profile.photoHint")}</p>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="hidden"
                                                aria-label="Upload avatar"
                                            />
                                        </div>
                                    </div>

                                    {/* Form */}
                                    <div className="space-y-4">
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">{t("settings.profile.displayName")}</Label>
                                                <Input
                                                    id="name"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="bg-muted border-border"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="username">{t("settings.profile.username")}</Label>
                                                <Input
                                                    id="username"
                                                    value={username}
                                                    onChange={(e) => setUsername(e.target.value)}
                                                    className="bg-muted border-border"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="bio">{t("settings.profile.bio")}</Label>
                                            <Textarea
                                                id="bio"
                                                value={bio}
                                                onChange={(e) => setBio(e.target.value)}
                                                className="bg-muted border-border resize-none"
                                                rows={3}
                                            />
                                        </div>
                                    </div>

                                    <Button onClick={handleSaveProfile} className="bg-primary hover:bg-primary/90 gap-2">
                                        {saved ? (
                                            <>
                                                <Check className="w-4 h-4" />
                                                {t("settings.profile.saved")}
                                            </>
                                        ) : (
                                            t("settings.profile.saveChanges")
                                        )}
                                    </Button>
                                </div>
                            )}

                            {activeSection === "privacy" && (
                                <div className="space-y-6">
                                    <h2 className="text-lg font-semibold text-foreground">{t("settings.privacy.title")}</h2>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                                            <div>
                                                <p className="font-medium">{t("settings.privacy.publicProfile")}</p>
                                                <p className="text-sm text-muted-foreground">{t("settings.privacy.publicProfileDesc")}</p>
                                            </div>
                                            <Switch checked={publicProfile} onCheckedChange={setPublicProfile} />
                                        </div>

                                        <div className="p-5 rounded-xl border border-destructive/20 bg-destructive/5">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 bg-destructive/10 rounded-lg shrink-0">
                                                        <AlertTriangle className="w-5 h-5 text-destructive" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-destructive">
                                                            {t("settings.privacy.deleteAccount")}
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            {t("settings.privacy.deleteAccountDesc")}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    className="shrink-0 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-smooth"
                                                >
                                                    {t("settings.privacy.deleteBtn")}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    )
}