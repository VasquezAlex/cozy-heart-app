import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/database/index"

export async function GET(req: NextRequest) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)

  const filters = {
    age: {
      min: parseInt(searchParams.get("min") || "18"),
      max: parseInt(searchParams.get("max") || "99")
    },
    verified: searchParams.get("verified") === "true",
    tags: searchParams.get("tags")?.split(",").filter(Boolean) || []
  }

  try {
    const profiles = await prisma.profile.findMany({
      where: {
        userId: { not: session.user.id },
        isVisible: true,
        age: {
          gte: filters.age.min,
          lte: filters.age.max
        },
        ...(filters.verified && { verified: true }),
        ...(filters.tags.length > 0 && {
          tags: { hasSome: filters.tags }
        })
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
        verified: true
      },
      take: 24,
      orderBy: { lastActive: 'desc' }
    })

    // Add computed fields to match SeekingProfile interface
    const seekingProfiles = profiles.map(p => ({
      ...p,
      complete: (p.photos?.length || 0) > 0 && !!p.bio && p.tags.length > 0
    }))

    return NextResponse.json({ 
      profiles: seekingProfiles,
      count: seekingProfiles.length 
    })
    
  } catch (error) {
    console.error("Seeking GET error:", error)
    return NextResponse.json(
      { error: "Failed to load profiles" }, 
      { status: 500 }
    )
  }
}