export default function DiscoverLoading() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header skeleton */}
            <div className="max-w-7xl mx-auto px-4 pt-28 pb-8">
                <div className="h-10 w-48 bg-muted/50 rounded-xl animate-pulse mb-2" />
                <div className="h-5 w-72 bg-muted/30 rounded-lg animate-pulse mb-8" />

                {/* Search bar skeleton */}
                <div className="h-12 w-full max-w-md bg-muted/50 rounded-xl animate-pulse mb-8" />

                {/* Category pills skeleton */}
                <div className="flex gap-3 mb-10">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-9 rounded-full bg-muted/40 animate-pulse"
                            style={{ width: `${60 + Math.random() * 40}px`, animationDelay: `${i * 100}ms` }}
                        />
                    ))}
                </div>

                {/* Masonry grid skeleton */}
                <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div
                            key={i}
                            className="break-inside-avoid mb-4 rounded-2xl bg-card/60 border border-border/50 overflow-hidden animate-pulse"
                            style={{ animationDelay: `${i * 80}ms` }}
                        >
                            <div
                                className="w-full bg-muted/40"
                                style={{ height: `${180 + (i % 3) * 60}px` }}
                            />
                            <div className="p-4 flex flex-col gap-2">
                                <div className="h-4 w-3/4 bg-muted/40 rounded" />
                                <div className="h-3 w-1/2 bg-muted/30 rounded" />
                                <div className="h-5 w-20 bg-muted/50 rounded mt-1" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}