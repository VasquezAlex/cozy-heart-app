import { prisma } from "@/lib/db/client"

export async function getUser(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      UserID: true,
      Username: true,
      TrustLevel: true,
      LastActive: true,
    },
  })
}

export async function touchUser(id: string) {
  return prisma.user.update({
    where: { id },
    data: { LastActive: new Date() },
    select: { id: true, LastActive: true },
  })
}
