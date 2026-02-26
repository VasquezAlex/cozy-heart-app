import { REST } from '@discordjs/rest';
import { 
  APIGuildMember,
  Routes 
} from 'discord-api-types/v10';

const Version = '10';
const Token = process.env.DISCORD_BOT_TOKEN;
const GuildID = process.env.DISCORD_GUILD_ID;

export class DiscordClient {
  private rest: REST;

  /**
   * Create a new Discord connection with Bot token
   * @param token - Your Discord bot token
   */
  constructor(token: string) {
    this.rest = new REST({ version: Version }).setToken(token);
  }

  /**
   * Get detailed info about a specific member in YOUR server
   * When to use: Checking user's roles/nickname, verifying membership
   * @param userId - Discord user ID 
   * Returns: { nickname, roles, joined_at, avatar, etc }
   * Throws: 404 if user not in server, 403 if bot lacks permissions
   */
  async getMember(userId: string): Promise<APIGuildMember> {
    return this.rest.get(
      Routes.guildMember(GuildID!, userId)
    ) as Promise<APIGuildMember>;
  }

  /**
   * Get ALL members of your server (up to 1000)
   * When to use: Admin dashboards, role syncing
   * Warning: Large servers may need pagination
   */
  async getAllMembers(): Promise<APIGuildMember[]> {
    return this.rest.get(
      `${Routes.guildMembers(GuildID!)}?limit=1000`
    ) as Promise<APIGuildMember[]>;
  }

  /**
   * Update a member's nickname or roles
   * When to use: Give "Verified" role after app verification
   * @param changes - { nick: "new name" } or { roles: ["id1", "id2"] }
   * Note: Requires "Manage Nicknames" or "Manage Roles" permission
   */
  async updateMember(userId: string, changes: { nick?: string; roles?: string[] }) {
    return this.rest.patch(
      Routes.guildMember(GuildID!, userId),
      { body: changes }
    );
  }

  /**
   * Kick a member from your server
   * When to use: Moderation
   * Note: Kick = they can rejoin. For permanent ban use banMember()
   */
  async removeMember(userId: string, reason?: string) {
    return this.rest.delete(Routes.guildMember(GuildID!, userId), {
      body: reason ? { reason } : undefined
    });
  }

  /**
   * Ban a user from your server permanently
   * When to use: Serious rule violations
   */
  async banMember(userId: string, reason?: string) {
    return this.rest.put(Routes.guildBan(GuildID!, userId), {
      body: reason ? { reason } : undefined
    });
  }
}

/** Create client with your Bot token */
export function getClient() {
  if (!Token) throw new Error('Missing DISCORD_BOT_TOKEN in .env.local');
  return new DiscordClient(Token);
}

/** Type guard for Discord API errors */
export function isDiscordError(error: unknown): error is { status: number; message: string } {
  return typeof error === 'object' && error !== null && 'status' in error && 'message' in error;
}