import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import type { NextAuthOptions } from "next-auth";
import { getClient, isDiscordError } from "@/lib/discord/client";
import type { TrustLevel } from "@/lib/utils/trust";
import { prisma } from "@/lib/db/client";

if (!process.env.NEXTAUTH_URL && process.env.NODE_ENV !== "production") {
  process.env.NEXTAUTH_URL = "http://localhost:3000";
}

const guildId = process.env.DISCORD_GUILD_ID ?? "";
const clientId = process.env.DISCORD_CLIENT_ID ?? "";
const clientSecret = process.env.DISCORD_CLIENT_SECRET ?? "";
const verifiedRoleId = process.env.VERIFIED_ROLE_ID;
const modRoleId = process.env.MOD_ROLE_ID;
const adminRoleId = process.env.ADMIN_ROLE_ID;
const ownerRoleId = process.env.OWNER_ROLE_ID;
const guildName = process.env.GUILD_NAME || "Server";
const staffRoles = new Set(["MOD", "ADMIN", "OWNER"]);
const adminRoleIds = [ownerRoleId, adminRoleId, modRoleId].filter(
  (roleId): roleId is string => Boolean(roleId)
);
const defaultAgeRange: [number, number] = [18, 99];
const oneMonthInSeconds = 30 * 24 * 60 * 60;

type AppRole = "USER" | "MOD" | "ADMIN" | "OWNER";
type AppStatus = "ACTIVE" | "INACTIVE" | "BANNED" | "SUSPENDED";
type Privacy = "PUBLIC" | "FRIENDS" | "PRIVATE";

type DiscordProfile = {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
};

type SessionDataUser = {
  id: string;
  name?: string | null;
  image?: string | null;
  emailVerified?: Date | null;
  UserID?: string;
  Username?: string;
  discriminator?: string;
  banner?: string;
  role?: string;
  TrustLevel?: string;
  status?: string;
  age?: number;
  location?: string;
  CreatedAt?: Date;
  LastActive?: Date;
  bio?: string;
  tags?: string[];
  ageRange?: [number, number];
  photoCount?: number;
  profileComplete?: boolean;
  boosted?: boolean;
  boostExpires?: Date;
  viewCount?: number;
  matchCount?: number;
  likeCount?: number;
  unreadMessages?: number;
  score?: number;
  roles?: string[];
  isBooster?: boolean;
  prefDark?: boolean;
  prefNotifs?: boolean;
  prefPrivacy?: string;
  prefLang?: string;
  streak?: number;
};

type DiscordState = {
  discordId: string;
  roles: string[];
  isBooster: boolean;
};

type SessionUser = {
  id: string;
  discordId: string;
  name: string;
  handle: string;
  avatar: string;
  banner?: string;
  role: AppRole;
  trust: TrustLevel;
  status: AppStatus;
  verified: boolean;
  verifiedAt?: string;
  age?: number;
  location?: string;
  joined: string;
  lastSeen: string;
  streak: number;
};

type SessionDiscord = {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  guild: {
    id: string;
    name: string;
    nickname: string;
    roles: string[];
    isBooster: boolean;
    joinedAt: string;
  };
};

type SessionProfile = {
  bio: string;
  tags: string[];
  ageRange: [number, number];
  photos: number;
  complete: boolean;
  boosted: boolean;
  boostExpires?: string;
};

type SessionStats = {
  views: number;
  matches: number;
  likes: number;
  messages: number;
  score: number;
};

type SessionPermissions = {
  seek: boolean;
  like: boolean;
  message: boolean;
  photo: boolean;
  voice: boolean;
  admin: boolean;
};

type SessionPreferences = {
  dark: boolean;
  notifications: boolean;
  privacy: Privacy;
  language: string;
};

function toIso(date: Date | undefined, fallback: string) {
  return date?.toISOString() || fallback;
}

function normalizeTrust(trustLevel?: string): TrustLevel {
  if (trustLevel === "BANNED") return "BANNED";
  if (trustLevel === "SUSPICIOUS") return "SUSPICIOUS";
  if (trustLevel === "VERIFIED") return "VERIFIED";
  if (trustLevel === "PENDING") return "PENDING";
  return "NEW";
}

function buildAvatarUrl(discordId: string, image?: string | null) {
  if (image) return image;
  return `https://cdn.discordapp.com/embed/avatars/${parseInt(discordId || "0") % 5}.png`;
}

function buildDiscordCdnAvatar(discordId: string, avatar: string | null) {
  if (!avatar) return null;
  return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.png`;
}

function parseRole(role?: string): AppRole {
  if (role === "MOD" || role === "ADMIN" || role === "OWNER") {
    return role;
  }
  return "USER";
}

function parseStatus(status?: string): AppStatus {
  if (status === "INACTIVE" || status === "BANNED" || status === "SUSPENDED") {
    return status;
  }
  return "ACTIVE";
}

function parsePrivacy(privacy?: string): Privacy {
  if (privacy === "FRIENDS" || privacy === "PRIVATE") {
    return privacy;
  }
  return "PUBLIC";
}

function isVerified(roles: string[], trust: TrustLevel) {
  return (verifiedRoleId ? roles.includes(verifiedRoleId) : false) || trust === "VERIFIED";
}

function isAdmin(roles: string[], role: AppRole) {
  return adminRoleIds.some((roleId) => roles.includes(roleId)) || staffRoles.has(role);
}

async function setDiscordId(userId: string, discordId: string) {
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

async function resolveDiscordId(data: SessionDataUser) {
  if (data.UserID) return data.UserID;

  const account = await prisma.account.findFirst({
    where: {
      userId: data.id,
      provider: "discord",
    },
    select: { providerAccountId: true },
  });
  const accountId = account?.providerAccountId;

  if (!accountId) return data.id;

  await setDiscordId(data.id, accountId);
  return accountId;
}

async function resolveDiscordState(data: SessionDataUser): Promise<DiscordState> {
  const discordId = await resolveDiscordId(data);
  let roles = data.roles || [];
  let isBooster = data.isBooster || false;
  const client = getClient();

  try {
    const member = await client.getMember(discordId);
    roles = member.roles || roles;
    isBooster = Boolean(member.premium_since) || isBooster;
  } catch (error) {
    if (!isDiscordError(error) || error.status !== 404) {
      console.warn("resolveDiscordState Discord lookup failed:", error);
    }
  }

  return { discordId, roles, isBooster };
}

function createSessionPayload(data: SessionDataUser, discordState: DiscordState, nowIso: string) {
  const displayName = data.Username || data.name || "Unknown";
  const discriminator = data.discriminator || "0";
  const trust = normalizeTrust(data.TrustLevel);
  const role = parseRole(data.role);

  const user: SessionUser = {
    id: data.id,
    discordId: discordState.discordId,
    name: displayName,
    handle: `${displayName}#${discriminator}`,
    avatar: buildAvatarUrl(discordState.discordId, data.image),
    banner: data.banner,
    role,
    trust,
    status: parseStatus(data.status),
    verified: data.emailVerified !== null,
    verifiedAt: data.emailVerified?.toISOString(),
    age: data.age,
    location: data.location,
    joined: toIso(data.CreatedAt, nowIso),
    lastSeen: toIso(data.LastActive, nowIso),
    streak: data.streak || 0,
  };

  const discord: SessionDiscord = {
    id: discordState.discordId,
    username: displayName,
    discriminator,
    avatar: data.image || "",
    guild: {
      id: guildId,
      name: guildName,
      nickname: displayName,
      roles: discordState.roles,
      isBooster: discordState.isBooster,
      joinedAt: toIso(data.CreatedAt, nowIso),
    },
  };

  const profile: SessionProfile = {
    bio: data.bio || "",
    tags: data.tags || [],
    ageRange: data.ageRange || defaultAgeRange,
    photos: data.photoCount || 0,
    complete: data.profileComplete || false,
    boosted: data.boosted || false,
    boostExpires: data.boostExpires?.toISOString(),
  };

  const stats: SessionStats = {
    views: data.viewCount || 0,
    matches: data.matchCount || 0,
    likes: data.likeCount || 0,
    messages: data.unreadMessages || 0,
    score: data.score || 0,
  };

  const canAdmin = isAdmin(discordState.roles, role);
  const canVerify = isVerified(discordState.roles, trust);

  const can: SessionPermissions = {
    seek: canVerify,
    like: canVerify,
    message: canVerify,
    photo: canVerify,
    voice: canVerify,
    admin: canAdmin,
  };

  const preferences: SessionPreferences = {
    dark: data.prefDark ?? true,
    notifications: data.prefNotifs ?? true,
    privacy: parsePrivacy(data.prefPrivacy),
    language: data.prefLang || "en",
  };

  return { user, discord, profile, stats, can, preferences };
}

export const AuthOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Discord({
      clientId,
      clientSecret,
      authorization: {
        params: {
          scope: "identify email",
          prompt: "consent",
        },
      },
    }),
  ],

  session: {
    strategy: "database",
    maxAge: oneMonthInSeconds,
  },

  pages: {
    signIn: "/",
    error: "/error",
  },

  callbacks: {
    async signIn({ profile }) {
      const profileData = profile as DiscordProfile;

      if (!profileData?.id) return false;

      try {
        const client = getClient();
        const inGuild = await client.isMember(profileData.id);
        if (!inGuild) {
          return "/error?error=not_in_guild";
        }
        
        const ban = await prisma.ban.findFirst({
          where: {
            TargetType: "USER",
            TargetID: profileData.id,
            RevokedAt: null,
            OR: [
              { ExpiresAt: null },
              { ExpiresAt: { gt: new Date() } }
            ]
          }
        });

        if (ban) {
          return `/error?error=banned&reason=${ban.Reason || "Banned"}`;
        }

        return true;
        
      } catch (error) {
        console.error("SignIn error:", error);
        return false;
      }
    },

    async session({ session, user }) {
      const data = user as SessionDataUser;
      const nowIso = new Date().toISOString();
      const discordState = await resolveDiscordState(data);
      const payload = createSessionPayload(data, discordState, nowIso);

      void prisma.user.update({
        where: { id: data.id },
        data: {
          LastActive: new Date(),
          discordRoles: discordState.roles,
          isBooster: discordState.isBooster,
        }
      }).catch(() => undefined);

      return {
        ...session,
        ...payload,
      };
    }
  },

  events: {
    async signIn({ user, profile }) {
      const profileData = profile as DiscordProfile;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          Username: profileData.username,
          name: profileData.username,
          image: buildDiscordCdnAvatar(profileData.id, profileData.avatar),
          LastActive: new Date(),
        }
      });

      await setDiscordId(user.id, profileData.id);
    }
  }
};

const handler = NextAuth(AuthOptions);
export const GET = handler;
export const POST = handler;
export const auth = () => getServerSession(AuthOptions);

declare module "next-auth" {
  interface Session {
    user: SessionUser;
    discord: SessionDiscord;
    profile: SessionProfile;
    stats: SessionStats;
    can: SessionPermissions;
    preferences: SessionPreferences;
  }
}