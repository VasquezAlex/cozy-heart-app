import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import type { NextAuthOptions } from "next-auth";
import { getClient, isDiscordError } from "@/lib/discord/client"; // Added import

const prisma = new PrismaClient();
const GuildID = process.env.DISCORD_GUILD_ID as string;
const ClientID = process.env.DISCORD_CLIENT_ID as string;
const ClientSecret = process.env.DISCORD_CLIENT_SECRET as string;

export interface Session {
  user: {
    id: string;           
    discordId: string;    
    name: string;       
    handle: string;
    avatar: string;  
    banner?: string; 
    role: "USER" | "MOD" | "ADMIN" | "OWNER";
    trust: "NEW" | "PENDING" | "VERIFIED" | "TRUSTED" | "ELITE";
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
    privacy: "PUBLIC" | "FRIENDS" | "PRIVATE";
    language: string;
  };
}

export const AuthOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Discord({
      clientId: ClientID,
      clientSecret: ClientSecret,
      authorization: {
        params: {
          scope: "identify email", // Removed "guilds" - no longer needed with bot approach
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
      if (!profile?.id) return false;

      const Profile = profile as {
        id: string;
        username: string;
        discriminator: string;
        avatar: string | null;
        email?: string;
      };

      try {
        // UPDATED: Use bot token to check if user is in your guild
        // This tries to fetch their member data - 404 means not in guild
        const discord = getClient();
        await discord.getMember(Profile.id);
        
        // If we get here, user is in the guild. Now check ban status.
        const ban = await prisma.ban.findFirst({
          where: {
            TargetType: "USER",
            TargetID: Profile.id,
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
        
        // Handle Discord API errors specifically
        if (isDiscordError(error)) {
          if (error.status === 404) {
            // 404 = User not found in your Discord server
            return "/error?error=not_in_guild";
          }
          // Log other Discord errors (403 = bot lacks permissions, etc)
          console.error(`Discord API error ${error.status}: ${error.message}`);
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
      const now = new Date().toISOString();

      // Update last seen (fire and forget)
      prisma.user.update({
        where: { id: Data.id },
        data: { LastActive: new Date() }
      }).catch(() => {});

      return {
        ...session,
        user: {
          id: Data.id,
          discordId: Data.UserID,
          name: Data.Username || Data.name || "Unknown",
          handle: `${Data.Username || Data.name}#${Data.discriminator || "0"}`,
          avatar: Data.image || `https://cdn.discordapp.com/embed/avatars/${parseInt(Data.UserID || "0") % 5}.png`,
          banner: Data.banner,
          role: Data.role || "USER",
          trust: Data.TrustLevel || "NEW",
          status: Data.status || "ACTIVE",
          verified: Data.emailVerified !== null,
          verifiedAt: Data.emailVerified?.toISOString(),
          age: Data.age,
          location: Data.location,
          joined: Data.CreatedAt?.toISOString() || now,
          lastSeen: Data.LastActive?.toISOString() || now,
          streak: Data.streak || 0,
        },
        discord: {
          id: Data.UserID,
          username: Data.Username || Data.name,
          discriminator: Data.discriminator || "0",
          avatar: Data.image,
          guild: {
            id: GuildID,
            name: process.env.GUILD_NAME || "Server",
            nickname: Data.Username || Data.name,
            roles: Data.roles || [],
            isBooster: Data.isBooster || false,
            joinedAt: Data.CreatedAt?.toISOString() || now,
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
          seek: ((Data.TrustLevel ?? "NEW") === "VERIFIED" || (Data.TrustLevel ?? "NEW") === "TRUSTED" || (Data.TrustLevel ?? "NEW") === "ELITE"),
          like: (Data.TrustLevel ?? "NEW") !== "NEW" && (Data.TrustLevel ?? "NEW") !== "PENDING",
          message: ["VERIFIED", "TRUSTED", "ELITE"].includes(Data.TrustLevel ?? "NEW"),
          photo: (Data.TrustLevel ?? "NEW") === "TRUSTED" || (Data.TrustLevel ?? "NEW") === "ELITE",
          voice: (Data.TrustLevel ?? "NEW") === "TRUSTED" || (Data.TrustLevel ?? "NEW") === "ELITE",
          admin: ["MOD", "ADMIN", "OWNER"].includes(Data.role ?? "USER"),
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
    async signIn({ user, profile, isNewUser }) {
      const Profile = profile as {
        id: string;
        username: string;
        discriminator: string;
        avatar: string | null;
      };

      if (isNewUser) {
        await prisma.user.create({
          data: {
            UserID: Profile.id,
            Username: Profile.username,
            name: Profile.username,
            image: Profile.avatar 
              ? `https://cdn.discordapp.com/avatars/${Profile.id}/${Profile.avatar}.png`
              : null,
            TrustLevel: "NEW",
            CreatedAt: new Date(),
            LastActive: new Date(),
          }
        });
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            Username: Profile.username,
            name: Profile.username,
            image: Profile.avatar 
              ? `https://cdn.discordapp.com/avatars/${Profile.id}/${Profile.avatar}.png`
              : null,
            LastActive: new Date(),
          }
        });
      }
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
      role: string;
      trust: string;
      status: string;
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