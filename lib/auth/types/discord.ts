export interface DiscordProfile {
    id: string
    username: string
    discriminator: string
    avatar: string | null
    email?: string
}

export interface GuildMember {
    roles: string[]
    isBooster: boolean
    nickname: string | null
    joined_at?: string
}