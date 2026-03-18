"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ChevronDown, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface APIEndpoint {
    method: "GET" | "POST" | "PUT" | "DELETE"
    path: string
    description: string
    auth: boolean
    params?: { name: string; type: string; description: string }[]
    body?: { name: string; type: string; description: string; required?: boolean }[]
    response?: string
    example?: {
        request?: string
        response?: string
    }
}

const endpoints: APIEndpoint[] = [
    {
        method: "POST",
        path: "/api/auth/signup",
        description: "Реєстрація нового користувача",
        auth: false,
        body: [
            { name: "name", type: "string", description: "Ім'я користувача", required: true },
            { name: "email", type: "string", description: "Email адреса", required: true },
            { name: "password", type: "string", description: "Пароль", required: true },
        ],
        response: "{ user: User, token: string }",
        example: {
            request: `{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}`,
            response: `{
  "user": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": null
  },
  "token": "eyJhbGc..."
}`,
        },
    },
    {
        method: "POST",
        path: "/api/auth/login",
        description: "Вхід користувача",
        auth: false,
        body: [
            { name: "email", type: "string", description: "Email адреса", required: true },
            { name: "password", type: "string", description: "Пароль", required: true },
        ],
        response: "{ user: User, token: string }",
        example: {
            request: `{
  "email": "john@example.com",
  "password": "securePassword123"
}`,
        },
    },
    {
        method: "GET",
        path: "/api/auth/me",
        description: "Отримати поточного користувача",
        auth: true,
        response: "{ user: User }",
    },
    {
        method: "POST",
        path: "/api/auth/logout",
        description: "Вихід користувача",
        auth: true,
        response: "{ success: boolean }",
    },
    {
        method: "GET",
        path: "/api/wishlists",
        description: "Отримати всі вишлісти поточного користувача",
        auth: true,
        response: "{ wishlists: Wishlist[] }",
    },
    {
        method: "POST",
        path: "/api/wishlists",
        description: "Створити новий вишліст",
        auth: true,
        body: [
            { name: "name", type: "string", description: "Назва вишліста", required: true },
            { name: "description", type: "string", description: "Опис" },
            { name: "emoji", type: "string", description: "Емодзі для вишліста" },
            { name: "isPrivate", type: "boolean", description: "Приватний вишліст?", required: true },
        ],
        response: "{ wishlist: Wishlist }",
    },
    {
        method: "PUT",
        path: "/api/wishlists/[id]",
        description: "Оновити вишліст",
        auth: true,
        params: [{ name: "id", type: "string", description: "ID вишліста" }],
        body: [
            { name: "name", type: "string", description: "Нова назва" },
            { name: "description", type: "string", description: "Новий опис" },
            { name: "isPrivate", type: "boolean", description: "Приватність" },
        ],
        response: "{ wishlist: Wishlist }",
    },
    {
        method: "DELETE",
        path: "/api/wishlists/[id]",
        description: "Видалити вишліст",
        auth: true,
        params: [{ name: "id", type: "string", description: "ID вишліста" }],
        response: "{ success: boolean }",
    },
    {
        method: "GET",
        path: "/api/items/public",
        description: "Отримати всі товари з публічних вишлістів",
        auth: false,
        response: "{ items: WishlistItem[], count: number }",
    },
    {
        method: "PUT",
        path: "/api/user",
        description: "Оновити профіль користувача",
        auth: true,
        body: [
            { name: "name", type: "string", description: "Ім'я" },
            { name: "username", type: "string", description: "Логін" },
            { name: "bio", type: "string", description: "Біографія" },
            { name: "avatar", type: "string", description: "Avatar (base64)" },
        ],
        response: "{ user: User }",
    },
    {
        method: "POST",
        path: "/api/parse",
        description: "Парсити інформацію про товар з URL",
        auth: false,
        body: [{ name: "url", type: "string", description: "URL товару", required: true }],
        response: "{ title: string, price: number, image: string }",
    },
]

function MethodBadge({ method }: { method: string }) {
    const colors: Record<string, string> = {
        GET: "bg-blue-500/20 text-blue-400",
        POST: "bg-green-500/20 text-green-400",
        PUT: "bg-yellow-500/20 text-yellow-400",
        DELETE: "bg-red-500/20 text-red-400",
    }

    return (
        <span className={`px-3 py-1 rounded-full text-sm font-mono ${colors[method] || "bg-gray-500/20"}`}>
            {method}
        </span>
    )
}

function EndpointCard({ endpoint }: { endpoint: APIEndpoint }) {
    const [expanded, setExpanded] = useState(false)
    const [copied, setCopied] = useState(false)

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="glass rounded-2xl p-6 mb-4 hover:border-primary/50 transition-colors">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between"
            >
                <div className="flex items-center gap-4">
                    <MethodBadge method={endpoint.method} />
                    <div className="text-left">
                        <p className="font-mono text-sm text-muted-foreground">{endpoint.path}</p>
                        <p className="text-foreground font-medium">{endpoint.description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {endpoint.auth && (
                        <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-xs font-medium">
                            Auth
                        </span>
                    )}
                    <ChevronDown
                        className={`w-5 h-5 text-muted-foreground transition-transform ${
                            expanded ? "rotate-180" : ""
                        }`}
                    />
                </div>
            </button>

            {expanded && (
                <div className="mt-6 pt-6 border-t border-border space-y-6">
                    {endpoint.params && endpoint.params.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-foreground mb-3">URL Параметри</h4>
                            <div className="space-y-2">
                                {endpoint.params.map((param) => (
                                    <div key={param.name} className="bg-muted/50 rounded p-3">
                                        <p className="font-mono text-sm text-primary">{param.name}</p>
                                        <p className="text-xs text-muted-foreground">{param.type}</p>
                                        <p className="text-sm text-foreground mt-1">{param.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {endpoint.body && endpoint.body.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-foreground mb-3">Body</h4>
                            <div className="space-y-2">
                                {endpoint.body.map((field) => (
                                    <div key={field.name} className="bg-muted/50 rounded p-3">
                                        <p className="font-mono text-sm text-primary">
                                            {field.name} {field.required && <span className="text-red-400">*</span>}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{field.type}</p>
                                        <p className="text-sm text-foreground mt-1">{field.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {endpoint.example && (
                        <div className="space-y-4">
                            {endpoint.example.request && (
                                <div>
                                    <h4 className="text-sm font-semibold text-foreground mb-2">Приклад запиту</h4>
                                    <div className="relative bg-background rounded-lg p-3 border border-border">
                                        <pre className="font-mono text-xs text-muted-foreground overflow-x-auto">
                                            {endpoint.example.request}
                                        </pre>
                                        <button
                                            onClick={() => {
                                                if (endpoint.example?.request) {
                                                    handleCopy(endpoint.example.request)
                                                }
                                            }}
                                            className="absolute top-2 right-2 p-2 hover:bg-muted rounded transition-colors"
                                        >
                                            {copied ? (
                                                <Check className="w-4 h-4 text-green-400" />
                                            ) : (
                                                <Copy className="w-4 h-4 text-muted-foreground" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {endpoint.example.response && (
                                <div>
                                    <h4 className="text-sm font-semibold text-foreground mb-2">Приклад відповіді</h4>
                                    <div className="relative bg-background rounded-lg p-3 border border-border">
                                        <pre className="font-mono text-xs text-muted-foreground overflow-x-auto">
                                            {endpoint.example.response}
                                        </pre>
                                        <button
                                            onClick={() => {
                                                if (endpoint.example?.response) {
                                                    handleCopy(endpoint.example.response)
                                                }
                                            }}
                                            className="absolute top-2 right-2 p-2 hover:bg-muted rounded transition-colors"
                                        >
                                            {copied ? (
                                                <Check className="w-4 h-4 text-green-400" />
                                            ) : (
                                                <Copy className="w-4 h-4 text-muted-foreground" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div>
                        <h4 className="text-sm font-semibold text-foreground mb-2">Відповідь</h4>
                        <div className="bg-muted/50 rounded p-3">
                            <p className="font-mono text-sm text-muted-foreground">{endpoint.response}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function DocsPage() {
    return (
        <main className="min-h-screen bg-background">
            <Navbar />

            <div className="pt-24 pb-12 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-12">
                        <h1 className="text-4xl font-bold text-foreground mb-4">API Документація</h1>
                        <p className="text-lg text-muted-foreground">
                            Повний опис всіх доступних API маршрутів для WishList додатку
                        </p>
                    </div>

                    {/* Base URL */}
                    <div className="glass rounded-2xl p-6 mb-8">
                        <h2 className="text-lg font-semibold text-foreground mb-3">Base URL</h2>
                        <p className="font-mono text-sm text-muted-foreground">http://localhost:3000/api</p>
                    </div>

                    {/* Authentication */}
                    <div className="glass rounded-2xl p-6 mb-8">
                        <h2 className="text-lg font-semibold text-foreground mb-3">Аутентифікація</h2>
                        <p className="text-muted-foreground mb-4">
                            Деякі маршрути вимагають аутентифікації. Токен автоматично зберігається в cookies при логіні.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            <span className="text-primary font-semibold">Auth маршрути:</span> Усі запити до цих
                            маршрутів прилітають з токеном у cookie
                        </p>
                    </div>

                    {/* Endpoints */}
                    <div>
                        <h2 className="text-2xl font-bold text-foreground mb-6">Маршрути</h2>
                        <div className="space-y-4">
                            {endpoints.map((endpoint, idx) => (
                                <EndpointCard key={idx} endpoint={endpoint} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    )
}
