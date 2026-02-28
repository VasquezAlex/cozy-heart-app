import { prisma } from "@/lib/db/client"

export async function getSeekingProfiles(userId: string, minAge = 18, maxAge = 99) {
  return prisma.profile.findMany({
    where: {
      userId: { not: userId },
      isVisible: true,
      age: { gte: minAge, lte: maxAge },
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
}
