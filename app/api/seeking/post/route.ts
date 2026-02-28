import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"
import { getSession } from "@/lib/auth/session"
import { validate, seekingPostSchema } from "@/lib/security/validation"
import { rateLimit } from "@/lib/security/rate-limit"

export async function POST(req: Request) {
  try {
    const session = await getSession()
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
    const tags = parsed.data.tags
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 8)

    const minAge = parsed.data.minAge
    const maxAge = parsed.data.maxAge
    const ageText =
      typeof minAge === "number" && typeof maxAge === "number"
        ? `${Math.min(minAge, maxAge)}-${Math.max(minAge, maxAge)}`
        : undefined

    const bioParts = [
      parsed.data.headline.trim(),
      parsed.data.message.trim(),
      `Looking for: ${parsed.data.lookingFor}`,
      ageText ? `Preferred age range: ${ageText}` : undefined,
      parsed.data.availability?.trim() ? `Availability: ${parsed.data.availability.trim()}` : undefined,
      parsed.data.dealBreakers?.trim() ? `Deal-breakers: ${parsed.data.dealBreakers.trim()}` : undefined,
    ].filter(Boolean)

    const tagsList = Array.from(
      new Set([
        ...tags,
        parsed.data.lookingFor,
      ])
    ).slice(0, 8)

    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        bio: bioParts.join("\n\n"),
        region: parsed.data.region?.trim() || null,
        tags: tagsList,
        isVisible: true,
        lastActive: new Date(),
      },
      create: {
        userId: session.user.id,
        name,
        bio: bioParts.join("\n\n"),
        region: parsed.data.region?.trim() || null,
        tags: tagsList,
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
