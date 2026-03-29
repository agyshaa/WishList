import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
    CalendarDays,
    Gift,
    Heart,
    ExternalLink,
    Sparkles,
    TrendingUp,
    Eye
} from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ShareProfileButton } from "./share-button"

interface PublicProfileProps {
    params: Promise<{
        username: string
    }>
}

export default async function PublicProfilePage({ params }: PublicProfileProps) {
    const { username } = await params;
    
    const user = await prisma.user.findUnique({
        where: { username },
        include: {
            wishlists: {
                where: { isPrivate: false },
                include: { items: true },
                orderBy: { updatedAt: 'desc' }
            }
        }
    })

    if (!user || user.isAdmin) {
        notFound()
    }

    const publicWishlists = user.wishlists;

    // Calculate stats
    const totalItems = publicWishlists.reduce((sum, list) => sum + list.items.length, 0)
    const totalValue = publicWishlists.reduce(
        (sum, list) => sum + list.items.reduce((s, item) => s + item.price, 0),
        0
    )

    // Format join date
    const joinDate = new Date(user.createdAt || Date.now())
    const formattedDate = joinDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    return (
        <main className="min-h-screen bg-background">
            <Navbar />

            {/* Animated background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-primary/5 rounded-full blur-3xl" />
            </div>

            <div className="relative pt-24 pb-12 px-4">
                <div className="max-w-4xl mx-auto space-y-8">

                    {/* Profile Header Card */}
                    <div className="glass rounded-3xl overflow-hidden relative group">
                        {/* Animated gradient banner */}
                        <div className="h-40 relative overflow-hidden">
                            <div className="absolute inset-0 bg-linear-to-r from-primary/30 via-primary/10 to-secondary/20" />
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />

                            {/* Floating particles */}
                            <div className="absolute inset-0">
                                {[...Array(6)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute w-2 h-2 rounded-full bg-white/20 animate-float"
                                        style={{
                                            left: `${15 + i * 15}%`,
                                            top: `${20 + (i % 3) * 25}%`,
                                            animationDelay: `${i * 0.5}s`,
                                            animationDuration: `${4 + i * 0.5}s`
                                        }}
                                    />
                                ))}
                            </div>

                            {/* Grid pattern overlay */}
                            <div
                                className="absolute inset-0 opacity-10"
                                style={{
                                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                    linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                                    backgroundSize: '40px 40px'
                                }}
                            />

                            {/* Share button */}
                            <ShareProfileButton />
                        </div>

                        {/* Profile info */}
                        <div className="px-8 pb-8 -mt-16 relative z-10">
                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                {/* Avatar */}
                                <div className="relative group/avatar">
                                    <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-background shadow-2xl bg-muted ring-4 ring-primary/20 group-hover/avatar:ring-primary/40 transition-all duration-300">
                                        <Image
                                            src={user.avatar || "/placeholder.svg"}
                                            alt={user.name}
                                            width={128}
                                            height={128}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    {/* Online indicator */}
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-secondary border-4 border-background flex items-center justify-center">
                                        <Sparkles className="w-3 h-3 text-secondary-foreground" />
                                    </div>
                                </div>

                                {/* User info */}
                                <div className="flex-1 pt-4 md:pt-8">
                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                        <h1 className="text-3xl md:text-4xl font-bold font-heading text-foreground">
                                            {user.name}
                                        </h1>
                                    </div>
                                    <p className="text-lg text-primary font-medium mb-3">@{user.username}</p>

                                    {user.bio && (
                                        <p className="text-muted-foreground max-w-2xl leading-relaxed mb-4">
                                            {user.bio}
                                        </p>
                                    )}

                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50">
                                            <CalendarDays className="w-4 h-4" />
                                            <span>Joined {formattedDate}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stats row */}
                            <div className="grid grid-cols-3 gap-4 mt-8">
                                <div className="glass rounded-2xl p-4 text-center group hover:bg-primary/5 transition-colors cursor-default">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                                        <Gift className="w-5 h-5 text-primary" />
                                    </div>
                                    <p className="text-2xl font-bold text-foreground">{publicWishlists.length}</p>
                                    <p className="text-xs text-muted-foreground">Wishlists</p>
                                </div>
                                <div className="glass rounded-2xl p-4 text-center group hover:bg-primary/5 transition-colors cursor-default">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                                        <Heart className="w-5 h-5 text-primary" />
                                    </div>
                                    <p className="text-2xl font-bold text-foreground">{totalItems}</p>
                                    <p className="text-xs text-muted-foreground">Wishes</p>
                                </div>
                                <div className="glass rounded-2xl p-4 text-center group hover:bg-secondary/5 transition-colors cursor-default">
                                    <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                                        <TrendingUp className="w-5 h-5 text-secondary" />
                                    </div>
                                    <p className="text-2xl font-bold text-secondary">₴{totalValue.toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground">Total Value</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Public Wishlists Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Eye className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold font-heading text-foreground">Public Wishlists</h2>
                                    <p className="text-sm text-muted-foreground">Browse and get inspired</p>
                                </div>
                            </div>
                        </div>

                        {publicWishlists.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {publicWishlists.map((wishlist, index) => (
                                    <Link
                                        key={wishlist.id}
                                        href={`/list/${wishlist.id}`}
                                        className="block group"
                                    >
                                        <div
                                            className="glass rounded-2xl p-6 border border-border/50 hover:border-primary/30 hover:bg-primary/5 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 h-full flex flex-col"
                                            style={{ animationDelay: `${index * 100}ms` }}
                                        >
                                            {/* Header */}
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="w-14 h-14 rounded-xl bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-3 transition-transform">
                                                    {wishlist.emoji || '🎁'}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary">
                                                        <Gift className="w-3 h-3" />
                                                        {wishlist.items.length} items
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                                                {wishlist.name}
                                            </h3>
                                            {wishlist.description && (
                                                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                                                    {wishlist.description}
                                                </p>
                                            )}

                                            {/* Preview of items */}
                                            {wishlist.items.length > 0 && (
                                                <div className="flex items-center gap-2 mt-auto pt-4 border-t border-border/50">
                                                    <div className="flex -space-x-2">
                                                        {wishlist.items.slice(0, 3).map((item, i) => (
                                                            <div
                                                                key={item.id}
                                                                className="w-8 h-8 rounded-lg overflow-hidden border-2 border-card bg-muted"
                                                                style={{ zIndex: 3 - i }}
                                                            >
                                                                <Image
                                                                    src={item.image || "/placeholder.svg"}
                                                                    alt={item.title}
                                                                    width={32}
                                                                    height={32}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                        ))}
                                                        {wishlist.items.length > 3 && (
                                                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground border-2 border-card">
                                                                +{wishlist.items.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-muted-foreground ml-2">
                                                        ${wishlist.items.reduce((s, i) => s + i.price, 0).toLocaleString()} total
                                                    </span>
                                                    <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="glass rounded-3xl border border-border/50 p-12 text-center">
                                <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                                    <Gift className="w-10 h-10 text-muted-foreground" />
                                </div>
                                <h3 className="text-xl font-bold font-heading text-foreground mb-2">
                                    No public wishlists yet
                                </h3>
                                <p className="text-muted-foreground max-w-sm mx-auto">
                                    {user.name} hasn't shared any public wishlists yet. Check back later!
                                </p>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            <Footer />
        </main>
    )
}
