import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q");

        if (!query || query.trim() === "") {
            return NextResponse.json({ users: [] });
        }

        const sanitizedQuery = query.trim().replace(/^@/, '');

        const users = await prisma.user.findMany({
            where: {
                isAdmin: false,
                OR: [
                    { username: { contains: sanitizedQuery } },
                    { name: { contains: sanitizedQuery } }
                ]
            },
            select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
            },
            take: 5,
        });

        return NextResponse.json({ users });
    } catch (error) {
        console.error("User search error:", error);
        return NextResponse.json(
            { error: "Failed to search users" },
            { status: 500 }
        );
    }
}
