import NextAuth from "next-auth"
import Discord from "next-auth/providers/discord"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/database/index"

interface Profile {
  id: string
  username: string
  avatar?: string
  email?: string
}

interface NextAuthUser {
  ID?: string
  id: string
  UserID?: string
  TrustLevel?: string
  Username?: string
  name?: string
}

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { scope: "identify" } },
    }),
  ],
  session: {
    strategy: "database",
    maxAge: 5 * 60,
  },
  pages: {
    signIn: "/verify",
    error: "/verify",
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "discord") return true
      
      const discordId = (profile as Profile).id
      if (!discordId) return false

      // Check ban
      const ban = await prisma.ban.findFirst({
        where: {
          TargetType: "USER",
          TargetID: discordId,
          RevokedAt: null,
          OR: [{ ExpiresAt: null }, { ExpiresAt: { gt: new Date() } }],
        },
      })

      if (ban) {
        return `/verify?error=banned&reason=${encodeURIComponent(ban.Reason || "No reason")}`
      }

      return true
    },

    async session({ session, user }) {
      if (session.user) {
        const u = user as NextAuthUser
        session.user.userId = u.UserID || u.id
        session.user.trustLevel = u.TrustLevel
        session.user.username = u.Username || u.name
      }
      return session
    },
  },
  events: {
    // Use createUser event instead - runs AFTER user is created
    async createUser() {
      // The user object here has the ID assigned by Prisma
      // But we need the Discord ID from the account, which isn't directly available here
      
      // Alternative: Update the user to set UserID = ID temporarily, 
      // then fix it in a separate call or accept that ID is the UUID and UserID should be fetched from account
    },
    
    async signIn({ user, account, profile, isNewUser }) {
      // For existing users, update LastActive
      if (!isNewUser && (user as NextAuthUser)?.id) {
        await prisma.user.update({
          where: { id: (user as NextAuthUser).id! },
          data: { LastActive: new Date() },
        })
      }
      
      // For new users, we need to update UserID after creation
      if (isNewUser && account?.provider === "discord") {
        // Small delay to ensure user is committed to DB
        await new Promise(resolve => setTimeout(resolve, 100))
        
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            UserID: (profile as Profile).id,
            name: (profile as Profile).username
          }
        }).catch(err => console.error("Failed to update new user:", err))
      }
    },
  },
})

export { handler as GET, handler as POST }

declare module "next-auth" {
  interface Session {
    user: {
      userId: string
      trustLevel?: string
      username?: string
    }
  }
}