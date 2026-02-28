import { Prisma } from "@prisma/client";
import { getClient, isDiscordError } from "@/lib/discord/client";
import { getUserBan } from "@/lib/db/ban";
import { prisma } from "@/lib/db/client";
import type { DiscordProfile, DiscordState, SessionDataUser } from "@/lib/auth/nextauth/types";

async function discordLinkIdToUser(userId: string, discordId: string) {
  const owner = await prisma.user.findUnique({
    where: { UserID: discordId },
    select: { id: true },
  });

  if (owner && owner.id !== userId) {
    return false;
  }

  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { UserID: true },
  });

  if (!current) {
    return false;
  }

  if (current.UserID === discordId) {
    return true;
  }

  if (current.UserID && current.UserID !== discordId) {
    return false;
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { UserID: discordId },
    });
    return true;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return false;
    }
    throw error;
  }
}

async function getIdForUser(user: SessionDataUser) {
  if (user.UserID) return user.UserID;

  const account = await prisma.account.findFirst({
    where: {
      userId: user.id,
      provider: "discord",
    },
    select: { providerAccountId: true },
  });
  const providerId = account?.providerAccountId;

  if (!providerId) return user.id;

  await discordLinkIdToUser(user.id, providerId);
  return providerId;
}

export async function getMember(user: SessionDataUser): Promise<DiscordState> {
  const discordId = await getIdForUser(user);
  let roles = user.roles || [];
  let isBooster = user.isBooster || false;
  const client = getClient();

  try {
    const member = await client.getMember(discordId);
    roles = member.roles || roles;
    isBooster = Boolean(member.premium_since) || isBooster;
  } catch (error) {
    if (!isDiscordError(error) || error.status !== 404) {
      console.warn("getMember Discord lookup failed:", error);
    }
  }

  return { discordId, roles, isBooster };
}

export async function validateSignIn(profile?: DiscordProfile) {
  if (!profile?.id) return false;

  try {
    const client = getClient();
    const isMember = await client.isMember(profile.id);
    if (!isMember) {
      return "/error?error=not_in_guild";
    }

    const ban = await getUserBan(profile.id);
    if (ban) {
      return `/error?error=banned&reason=${ban.Reason || "Banned"}`;
    }

    return true;
  } catch (error) {
    console.error("SignIn error:", error);
    return false;
  }
}

export async function syncUser(
  userId: string,
  profile: DiscordProfile,
  avatar: string | null
) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      Username: profile.username,
      name: profile.username,
      image: avatar,
      LastActive: new Date(),
    },
  });

  await discordLinkIdToUser(userId, profile.id);
}

export async function updatePresence(
  userId: string,
  roles: string[],
  isBooster: boolean
) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      LastActive: new Date(),
      discordRoles: roles,
      isBooster,
    },
  });
}
