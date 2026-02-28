import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"
import { getAuthSession } from "@/lib/auth/session"
import { validate, seekingPostSchema } from "@/lib/security/validation"
import { rateLimit } from "@/lib/security/rate-limit"

export async function POST(req: Request) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const limit = await rateLimit(`seeking-post:${session.user.id}`, 5, 60)
    if (!limit.success) {
      return NextResponse.json({ error: "Too many requests. Slow down." }, { status: 429 })
    }

    const body = await req.json()
    const parsed = validate(seekingPostSchema, body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const name = session.user.name?.trim() || "Unknown"
    const cleanTags = parsed.data.tags
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 8)

    const minAge = parsed.data.minAge
    const maxAge = parsed.data.maxAge
    const ageRangeText =
      typeof minAge === "number" && typeof maxAge === "number"
        ? `${Math.min(minAge, maxAge)}-${Math.max(minAge, maxAge)}`
        : undefined

    const profileBioParts = [
      parsed.data.headline.trim(),
      parsed.data.message.trim(),
      `Looking for: ${parsed.data.lookingFor}`,
      ageRangeText ? `Preferred age range: ${ageRangeText}` : undefined,
      parsed.data.availability?.trim() ? `Availability: ${parsed.data.availability.trim()}` : undefined,
      parsed.data.dealBreakers?.trim() ? `Deal-breakers: ${parsed.data.dealBreakers.trim()}` : undefined,
    ].filter(Boolean)

    const mergedTags = Array.from(
      new Set([
        ...cleanTags,
        parsed.data.lookingFor,
      ])
    ).slice(0, 8)

    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        bio: profileBioParts.join("\n\n"),
        region: parsed.data.region?.trim() || null,
        tags: mergedTags,
        isVisible: true,
        lastActive: new Date(),
      },
      create: {
        userId: session.user.id,
        name,
        bio: profileBioParts.join("\n\n"),
        region: parsed.data.region?.trim() || null,
        tags: mergedTags,
        photos: [],
        isVisible: true,
      },
      select: {
        id: true,
        bio: true,
        region: true,
        tags: true,
      },
    })

    return NextResponse.json({ success: true, profile })
  } catch (error) {
    console.error("Seeking post error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
