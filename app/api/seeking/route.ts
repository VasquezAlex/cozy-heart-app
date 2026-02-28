import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth/session"
import { rateLimit } from "@/lib/security/rate-limit"
import { validate, seekingSchema } from "@/lib/security/validation"
import { updateUserActivity } from "@/lib/db/user"
import { prisma } from "@/lib/db/client"
import type { ExtendedSession } from "@/lib/auth/types"

function parseAge(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value || "", 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

function getSeekingFilters(req: Request) {
  const { searchParams } = new URL(req.url)
  const minAge = parseAge(searchParams.get("min"), 18)
  const maxAge = parseAge(searchParams.get("max"), 99)

  return {
    minAge: Math.max(18, Math.min(minAge, maxAge)),
    maxAge: Math.min(99, Math.max(maxAge, minAge)),
    verifiedOnly: searchParams.get("verified") === "true",
    tags: (searchParams.get("tags") || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
  }
}

export async function GET(req: Request) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const filters = getSeekingFilters(req)

    const profiles = await prisma.profile.findMany({
      where: {
        userId: { not: session.user.id },
        isVisible: true,
        age: {
          gte: filters.minAge,
          lte: filters.maxAge,
        },
        ...(filters.verifiedOnly && { verified: true }),
        ...(filters.tags.length > 0 && {
          tags: { hasSome: filters.tags },
        }),
      },
      select: {
        id: true,
        userId: true,
        name: true,
        age: true,
        photos: true,
        bio: true,
        tags: true,
        region: true,
        verified: true,
      },
      take: 24,
      orderBy: { lastActive: "desc" },
    })

    const seekingProfiles = profiles.map((profile) => ({
      ...profile,
      complete: (profile.photos?.length || 0) > 0 && !!profile.bio && profile.tags.length > 0,
    }))

    return NextResponse.json({
      profiles: seekingProfiles,
      count: seekingProfiles.length,
    })
  } catch (error) {
    console.error("Seeking GET error:", error)
    return NextResponse.json({ error: "Failed to load profiles" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const limit = await rateLimit(`seeking:${session.user.id}`, 5, 60)
    if (!limit.success) {
      return NextResponse.json({ error: "Too many requests. Slow down." }, { status: 429 })
    }

    const body = await request.json()
    const validation = validate(seekingSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const extendedSession = session as ExtendedSession
    if (!extendedSession.can?.like) {
      return NextResponse.json({ error: "Account verification required" }, { status: 403 })
    }

    await updateUserActivity(session.user.id)

    return NextResponse.json({
      success: true,
      action: validation.data.action,
      targetId: validation.data.targetId,
    })
  } catch (error) {
    console.error("Seeking error:", error)

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
