import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { getServerSession } from "next-auth";
import type { NextAuthOptions } from "next-auth";
import { prisma } from "@/lib/db/client";
import { clientId, clientSecret, maxAge } from "@/lib/auth/nextauth/constants";
import type {
  DiscordProfile,
  SessionDiscord,
  SessionPermissions,
  SessionPreferences,
  SessionProfile,
  SessionStats,
  SessionUser,
  SessionDataUser,
} from "@/lib/auth/nextauth/types";
import { createPayload, getAvatar } from "@/lib/auth/nextauth/session-payload";
import {
  getMember,
  syncUser,
  updatePresence,
  validateSignIn,
} from "@/lib/auth/nextauth/discord-auth";

export const config: NextAuthOptions = {
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
    maxAge,
  },

  pages: {
    signIn: "/",
    error: "/error",
  },

  callbacks: {
    async signIn({ profile }) {
      return validateSignIn(profile as DiscordProfile);
    },

    async session({ session, user }) {
      const record = user as SessionDataUser;
      const now = new Date().toISOString();
      const member = await getMember(record);
      const data = createPayload(record, member, now);

      void updatePresence(record.id, member.roles, member.isBooster).catch(() => undefined);

      return {
        ...session,
        ...data,
      };
    }
  },

  events: {
    async signIn({ user, profile }) {
      const p = profile as DiscordProfile;
      const avatar = getAvatar(p.id, p.avatar);
      await syncUser(user.id, p, avatar);
    }
  }
};

const handler = NextAuth(config);
export const GET = handler;
export const POST = handler;
export const auth = () => getServerSession(config);

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