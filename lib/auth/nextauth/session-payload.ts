import type { TrustLevel } from "@/lib/utils/trust";
import {
  adminRoles,
  defaultAgeRange,
  guildId,
  guild,
  staffRoles,
  verifiedRole,
} from "@/lib/auth/nextauth/constants";
import type {
  AppRole,
  AppStatus,
  DiscordState,
  Privacy,
  SessionDataUser,
  SessionPayload,
} from "@/lib/auth/nextauth/types";

function toIsoStringOrFallback(date: Date | undefined, fallback: string) {
  return date?.toISOString() || fallback;
}

function normalizeTrust(trustLevel?: string): TrustLevel {
  if (trustLevel === "BANNED") return "BANNED";
  if (trustLevel === "SUSPICIOUS") return "SUSPICIOUS";
  if (trustLevel === "VERIFIED") return "VERIFIED";
  if (trustLevel === "PENDING") return "PENDING";
  return "NEW";
}

function getFallbackAvatar(discordId: string, image?: string | null) {
  if (image) return image;
  return `https://cdn.discordapp.com/embed/avatars/${parseInt(discordId || "0") % 5}.png`;
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

function hasVerifiedAccess(roles: string[], trust: TrustLevel) {
  return (verifiedRole ? roles.includes(verifiedRole) : false) || trust === "VERIFIED";
}

function hasAdminAccess(roles: string[], role: AppRole) {
  return adminRoles.some((roleId) => roles.includes(roleId)) || staffRoles.has(role);
}

export function createPayload(
  user: SessionDataUser,
  member: DiscordState,
  now: string
): SessionPayload {
  const displayName = user.Username || user.name || "Unknown";
  const discriminator = user.discriminator || "0";
  const trust = normalizeTrust(user.TrustLevel);
  const role = parseRole(user.role);

  const sessionUser = {
    id: user.id,
    discordId: member.discordId,
    name: displayName,
    handle: `${displayName}#${discriminator}`,
    avatar: getFallbackAvatar(member.discordId, user.image),
    banner: user.banner,
    role,
    trust,
    status: parseStatus(user.status),
    verified: user.emailVerified !== null,
    verifiedAt: user.emailVerified?.toISOString(),
    age: user.age,
    location: user.location,
    joined: toIsoStringOrFallback(user.CreatedAt, now),
    lastSeen: toIsoStringOrFallback(user.LastActive, now),
    streak: user.streak || 0,
  };

  const discord = {
    id: member.discordId,
    username: displayName,
    discriminator,
    avatar: user.image || "",
    guild: {
      id: guildId,
      name: guild,
      nickname: displayName,
      roles: member.roles,
      isBooster: member.isBooster,
      joinedAt: toIsoStringOrFallback(user.CreatedAt, now),
    },
  };

  const profile = {
    bio: user.bio || "",
    tags: user.tags || [],
    ageRange: user.ageRange || defaultAgeRange,
    photos: user.photoCount || 0,
    complete: user.profileComplete || false,
    boosted: user.boosted || false,
    boostExpires: user.boostExpires?.toISOString(),
  };

  const stats = {
    views: user.viewCount || 0,
    matches: user.matchCount || 0,
    likes: user.likeCount || 0,
    messages: user.unreadMessages || 0,
    score: user.score || 0,
  };

  const canAdmin = hasAdminAccess(member.roles, role);
  const canVerify = hasVerifiedAccess(member.roles, trust);

  const can = {
    seek: canVerify,
    like: canVerify,
    message: canVerify,
    photo: canVerify,
    voice: canVerify,
    admin: canAdmin,
  };

  const preferences = {
    dark: user.prefDark ?? true,
    notifications: user.prefNotifs ?? true,
    privacy: parsePrivacy(user.prefPrivacy),
    language: user.prefLang || "en",
  };

  return { user: sessionUser, discord, profile, stats, can, preferences };
}

export function getAvatar(discordId: string, avatar: string | null) {
  if (!avatar) return null;
  return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.png`;
}
