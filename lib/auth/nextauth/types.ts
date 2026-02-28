import type { TrustLevel } from "@/lib/utils/trust";

export type AppRole = "USER" | "MOD" | "ADMIN" | "OWNER";
export type AppStatus = "ACTIVE" | "INACTIVE" | "BANNED" | "SUSPENDED";
export type Privacy = "PUBLIC" | "FRIENDS" | "PRIVATE";

export type DiscordProfile = {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
};

export type SessionDataUser = {
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

export type DiscordState = {
  discordId: string;
  roles: string[];
  isBooster: boolean;
};

export type SessionUser = {
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

export type SessionDiscord = {
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

export type SessionProfile = {
  bio: string;
  tags: string[];
  ageRange: [number, number];
  photos: number;
  complete: boolean;
  boosted: boolean;
  boostExpires?: string;
};

export type SessionStats = {
  views: number;
  matches: number;
  likes: number;
  messages: number;
  score: number;
};

export type SessionPermissions = {
  seek: boolean;
  like: boolean;
  message: boolean;
  photo: boolean;
  voice: boolean;
  admin: boolean;
};

export type SessionPreferences = {
  dark: boolean;
  notifications: boolean;
  privacy: Privacy;
  language: string;
};

export type SessionPayload = {
  user: SessionUser;
  discord: SessionDiscord;
  profile: SessionProfile;
  stats: SessionStats;
  can: SessionPermissions;
  preferences: SessionPreferences;
};
