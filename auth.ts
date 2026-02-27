import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import type { NextAuthOptions } from "next-auth";
import { getClient, isDiscordError } from "@/lib/discord/client";

const prisma = new PrismaClient();
const GuildID = process.env.DISCORD_GUILD_ID as string;
const ClientID = process.env.DISCORD_CLIENT_ID as string;
const ClientSecret = process.env.DISCORD_CLIENT_SECRET as string;
const VerifiedRoleID = process.env.VERIFIED_ROLE_ID;
const ModRoleID = process.env.MOD_ROLE_ID;
const AdminRoleID = process.env.ADMIN_ROLE_ID;
const OwnerRoleID = process.env.OWNER_ROLE_ID;

type TrustLevel = "NEW" | "PENDING" | "VERIFIED";

function normalizeTrust(trustLevel?: string): TrustLevel {
  if (trustLevel === "VERIFIED") return "VERIFIED";
  if (trustLevel === "PENDING") return "PENDING";
  return "NEW";
}

function hasRole(roles: string[], roleId?: string) {
  return !!roleId && roles.includes(roleId);
}

function buildAvatarUrl(discordId: string, image?: string | null) {
  if (image) return image;
  return `https://cdn.discordapp.com/embed/avatars/${parseInt(discordId || "0") % 5}.png`;
}

const StaffRoles = ["MOD", "ADMIN", "OWNER"];

export const AuthOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Discord({
      clientId: ClientID,
      clientSecret: ClientSecret,
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
    maxAge: 30 * 24 * 60 * 60,
  },

  pages: {
    signIn: "/",
    error: "/error",
  },

  callbacks: {
    async signIn({ profile }) {
      const ProfileData = profile as {
        id: string;
        username: string;
        discriminator: string;
        avatar: string | null;
        email?: string;
      };

      if (!ProfileData?.id) return false;

      try {
        await getClient().getMember(ProfileData.id);
        
        const Ban = await prisma.ban.findFirst({
          where: {
            TargetType: "USER",
            TargetID: ProfileData.id,
            RevokedAt: null,
            OR: [
              { ExpiresAt: null },
              { ExpiresAt: { gt: new Date() } }
            ]
          }
        });

        if (Ban) {
          return `/error?error=banned&reason=${Ban.Reason || "Banned"}`;
        }

        return true;
        
      } catch (error) {
        console.error("SignIn error:", error);
        
        if (isDiscordError(error)) {
          if (error.status === 404) {
            return "/error?error=not_in_guild";
          }
        }
        
        return false;
      }
    },

    async session({ session, user }) {
      const Data = user as typeof user & {
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
      const Now = new Date().toISOString();
      let DiscordUserId = Data.UserID;
      let Roles = Data.roles || [];
      let Booster = Data.isBooster || false;

      if (!DiscordUserId) {
        const DiscordAccount = await prisma.account.findFirst({
          where: {
            userId: Data.id,
            provider: "discord"
          },
          select: { providerAccountId: true }
        });

        if (DiscordAccount?.providerAccountId) {
          DiscordUserId = DiscordAccount.providerAccountId;
          await prisma.user.update({
            where: { id: Data.id },
            data: { UserID: DiscordUserId }
          });
        }
      }

      const Trust = normalizeTrust(Data.TrustLevel);

      if (DiscordUserId) {
        try {
          const Member = await getClient().getMember(DiscordUserId);
          Roles = Member.roles || Roles;
          Booster = Boolean(Member.premium_since) || Booster;
        } catch {
        }
      }

      const IsVerified = hasRole(Roles, VerifiedRoleID) || Trust === "VERIFIED";
      const IsAdmin = [OwnerRoleID, AdminRoleID, ModRoleID].some((RoleID) => hasRole(Roles, RoleID))
        || StaffRoles.includes(Data.role ?? "USER");

      const DisplayName = Data.Username || Data.name || "Unknown";
      const Discriminator = Data.discriminator || "0";
      const DiscordId = DiscordUserId || Data.id;

      prisma.user.update({
        where: { id: Data.id },
        data: {
          LastActive: new Date(),
          discordRoles: Roles,
          isBooster: Booster,
        }
      }).catch(() => {});

      return {
        ...session,
        user: {
          id: Data.id,
          discordId: DiscordId,
          name: DisplayName,
          handle: `${DisplayName}#${Discriminator}`,
          avatar: buildAvatarUrl(DiscordId, Data.image),
          banner: Data.banner,
          role: Data.role || "USER",
          trust: Trust,
          status: Data.status || "ACTIVE",
          verified: Data.emailVerified !== null,
          verifiedAt: Data.emailVerified?.toISOString(),
          age: Data.age,
          location: Data.location,
          joined: Data.CreatedAt?.toISOString() || Now,
          lastSeen: Data.LastActive?.toISOString() || Now,
          streak: Data.streak || 0,
        },
        discord: {
          id: DiscordId,
          username: DisplayName,
          discriminator: Discriminator,
          avatar: Data.image,
          guild: {
            id: GuildID,
            name: process.env.GUILD_NAME || "Server",
            nickname: DisplayName,
            roles: Roles,
            isBooster: Booster,
            joinedAt: Data.CreatedAt?.toISOString() || Now,
          }
        },
        profile: {
          bio: Data.bio || "",
          tags: Data.tags || [],
          ageRange: Data.ageRange || [18, 99],
          photos: Data.photoCount || 0,
          complete: Data.profileComplete || false,
          boosted: Data.boosted || false,
          boostExpires: Data.boostExpires?.toISOString(),
        },
        stats: {
          views: Data.viewCount || 0,
          matches: Data.matchCount || 0,
          likes: Data.likeCount || 0,
          messages: Data.unreadMessages || 0,
          score: Data.score || 0,
        },
        can: {
          seek: IsVerified,
          like: IsVerified,
          message: IsVerified,
          photo: IsVerified,
          voice: IsVerified,
          admin: IsAdmin,
        },
        preferences: {
          dark: Data.prefDark ?? true,
          notifications: Data.prefNotifs ?? true,
          privacy: Data.prefPrivacy || "PUBLIC",
          language: Data.prefLang || "en",
        },
      };
    }
  },

  events: {
    async signIn({ user, profile }) {
      const ProfileData = profile as {
        id: string;
        username: string;
        discriminator: string;
        avatar: string | null;
      };

      await prisma.user.update({
        where: { id: user.id },
        data: {
          UserID: ProfileData.id,
          Username: ProfileData.username,
          name: ProfileData.username,
          image: ProfileData.avatar 
            ? `https://cdn.discordapp.com/avatars/${ProfileData.id}/${ProfileData.avatar}.png`
            : null,
          LastActive: new Date(),
        }
      });
    }
  }
};

const handler = NextAuth(AuthOptions);
export const GET = handler;
export const POST = handler;
export const auth = () => getServerSession(AuthOptions);

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      discordId: string;
      name: string;
      handle: string;
      avatar: string;
      banner?: string;
      role: "USER" | "MOD" | "ADMIN" | "OWNER";
      trust: TrustLevel;
      status: "ACTIVE" | "INACTIVE" | "BANNED" | "SUSPENDED";
      verified: boolean;
      verifiedAt?: string;
      age?: number;
      location?: string;
      joined: string;
      lastSeen: string;
      streak: number;
    };
    discord: {
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
    profile: {
      bio: string;
      tags: string[];
      ageRange: [number, number];
      photos: number;
      complete: boolean;
      boosted: boolean;
      boostExpires?: string;
    };
    stats: {
      views: number;
      matches: number;
      likes: number;
      messages: number;
      score: number;
    };
    can: {
      seek: boolean;
      like: boolean;
      message: boolean;
      photo: boolean;
      voice: boolean;
      admin: boolean;
    };
    preferences: {
      dark: boolean;
      notifications: boolean;
      privacy: string;
      language: string;
    };
  }
}