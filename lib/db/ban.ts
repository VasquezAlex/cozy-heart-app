import { prisma } from "@/lib/db/client"

export async function getActiveUserBan(targetId: string) {
  const now = new Date()

  return prisma.ban.findFirst({
    where: {
      TargetType: "USER",
      TargetID: targetId,
      RevokedAt: null,
      OR: [{ ExpiresAt: null }, { ExpiresAt: { gt: now } }],
    },
    select: {
      ID: true,
      Reason: true,
      ExpiresAt: true,
      CreatedAt: true,
    },
  })
}
