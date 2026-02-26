import type { Session } from "next-auth"

export interface ExtendedSession extends Session {
  user: {
    id: string
    discordId: string
    name: string
    handle: string
    avatar: string
    banner?: string
    role: "USER" | "MOD" | "ADMIN" | "OWNER"
    status: "ACTIVE" | "INACTIVE" | "BANNED" | "SUSPENDED"
    verified: boolean
    trust: string
    age?: number
    location?: string
    joined: string
    lastSeen: string
    streak: number
  }
  discord: {
    id: string
    username: string
    discriminator: string
    avatar: string
    guild: { 
      id: string
      name: string
      nickname: string
      roles: string[]
      isBooster: boolean
      joinedAt: string
    }
  }
  profile: {
    bio: string
    tags: string[]
    ageRange: [number, number]
    photos: number
    complete: boolean
    boosted: boolean
    boostExpires?: string
  }
  stats: {
    views: number
    matches: number
    likes: number
    messages: number
    score: number
  }
  can: {
    seek: boolean
    like: boolean
    message: boolean
    photo: boolean
    voice: boolean
    admin: boolean
  }
  preferences: {
    privacy: "PUBLIC" | "FRIENDS" | "PRIVATE"
    notifications: boolean
    dark: boolean
    language: string
  }
  notifications?: Array<{
    id: string
    type: string
    title: string
    message: string
    timestamp: string
    read: boolean
    actionUrl?: string
  }>
  recentActivities?: Array<{
    id: string
    type: "match" | "like" | "view" | "message" | "system"
    title: string
    description: string
    timestamp: string
    read: boolean
  }>
  suggestedMatches?: Array<{
    id: string
    name: string
    avatar: string
    age: number
    location: string
    matchPercentage: number
  }>
}