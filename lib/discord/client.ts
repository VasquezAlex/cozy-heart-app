import { REST } from '@discordjs/rest';
import { 
  APIGuild,
  APIGuildMember,
  APIRole,
  Routes 
} from 'discord-api-types/v10';

const apiVersion = '10';
const token = process.env.DISCORD_TOKEN;
const guildId = process.env.DISCORD_GUILD_ID;

function getGuildId() {
  if (!guildId) throw new Error('Missing DISCORD_GUILD_ID in .env.local');
  return guildId;
}

export class DiscordClient {
  private rest: REST;

  /**
   * Creates a Discord REST client bound to your bot token.
   *
   * This class is a thin wrapper around Discord REST endpoints scoped to a
   * single guild (from `DISCORD_GUILD_ID`). Methods are intentionally small and
   * can be safely composed in auth callbacks, admin routes, and cron jobs.
   *
   * Authentication model:
   * - Uses bot token auth only.
   * - Uses API v10 routes from `discord-api-types`.
   *
   * @param token Bot token used to authenticate all requests.
   */
  constructor(token: string) {
    this.rest = new REST({ version: apiVersion }).setToken(token);
  }

  /**
   * Fetches full guild-member data for a single user.
   *
   * Primary use-cases:
   * - Role checks during verification
   * - Nickname sync and booster checks
   * - Membership validation in sign-in/session flows
   *
   * Endpoint shape:
   * - GET `/guilds/{guild.id}/members/{user.id}`
   *
   * Common failures:
   * - `404`: user is not in the guild
   * - `403`: bot lacks permissions or cannot access member
   * - `429`: rate-limited by Discord
   *
   * @param userId Discord user ID.
   * @returns Guild member payload (roles, nick, joined_at, premium_since, etc).
   * @throws Discord API error (for example 404 when not in guild, 403 on missing permissions).
   *
   * @example
   * const member = await client.getMember('123');
  * const isVerified = member.roles.includes(verifiedRole);
   */
  async getMember(userId: string): Promise<APIGuildMember> {
    return this.rest.get(
      Routes.guildMember(getGuildId(), userId)
    ) as Promise<APIGuildMember>;
  }

  /**
   * Fetches up to 1000 guild members.
   *
    * Useful for:
    * - Admin dashboards
    * - One-pass sync tasks
    * - Light analytics snapshots
    *
    * Notes:
    * - Current implementation requests `limit=1000`.
    * - For large guilds, implement paginated scanning with `after`.
    * - This call can be expensive on repeated polling.
   *
   * @returns Array of guild members (max 1000 by current query).
   */
  async getAllMembers(): Promise<APIGuildMember[]> {
    return this.rest.get(
      `${Routes.guildMembers(getGuildId())}?limit=1000`
    ) as Promise<APIGuildMember[]>;
  }

  /**
   * Fetches guild metadata (name, features, settings snapshots).
    *
    * Use this for server configuration views or sanity checks that the bot is
    * pointed to the expected guild.
   *
   * @returns Guild object for the configured server.
   */
  async getGuild(): Promise<APIGuild> {
    return this.rest.get(Routes.guild(getGuildId())) as Promise<APIGuild>;
  }

  /**
   * Fetches all roles configured in the guild.
    *
    * Useful for mapping role IDs to labels and building role-pickers in admin UI.
   *
   * @returns Array of role definitions.
   */
  async getRoles(): Promise<APIRole[]> {
    return this.rest.get(Routes.guildRoles(getGuildId())) as Promise<APIRole[]>;
  }

  /**
   * Checks whether a user is currently in the guild.
   *
    * Behavior:
    * - Returns `true` if member record exists.
    * - Returns `false` only for `404` (not in guild).
    * - Rethrows all non-404 errors so callers can surface real failures.
   *
   * @param userId Discord user ID.
   * @returns `true` if member exists, otherwise `false` for not-found.
    *
    * @example
    * if (!(await client.isMember(userId))) {
    *   return '/error?error=not_in_guild';
    * }
   */
  async isMember(userId: string): Promise<boolean> {
    try {
      await this.getMember(userId);
      return true;
    } catch (error) {
      if (isDiscordError(error) && error.status === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
    * Partially updates a guild member.
    *
    * Supports:
    * - `nick`: nickname update
    * - `roles`: full role replacement list
    *
    * Endpoint shape:
    * - PATCH `/guilds/{guild.id}/members/{user.id}`
    *
    * Permission notes:
    * - Nickname edits require proper nickname permissions and hierarchy.
    * - Role edits require `Manage Roles` and valid role position hierarchy.
    *
    * @param userId Discord user ID.
    * @param changes Patch payload, e.g. `{ nick }` or `{ roles }`.
    * @returns Discord API response for the PATCH call.
    * @throws Discord API error on missing permissions or invalid payload.
    *
    * @example
    * await client.updateMember(userId, { roles: [verifiedRole] });
   */
  async updateMember(userId: string, changes: { nick?: string; roles?: string[] }) {
    return this.rest.patch(
      Routes.guildMember(getGuildId(), userId),
      { body: changes }
    );
  }

  /**
   * Updates only the member nickname.
    *
    * Thin wrapper over `updateMember` for a clearer call-site intent.
   *
   * @param userId Discord user ID.
   * @param nick New nickname value.
   */
  async setNickname(userId: string, nick: string) {
    return this.updateMember(userId, { nick });
  }

  /**
   * Adds one role to a member.
    *
    * Endpoint shape:
    * - PUT `/guilds/{guild.id}/members/{user.id}/roles/{role.id}`
    *
    * This is additive (does not replace existing roles).
   *
   * @param userId Discord user ID.
   * @param roleId Role ID to attach.
   * @param reason Optional audit-log reason.
   */
  async addRole(userId: string, roleId: string, reason?: string) {
    return this.rest.put(Routes.guildMemberRole(getGuildId(), userId, roleId), {
      body: reason ? { reason } : undefined,
    });
  }

  /**
   * Removes one role from a member.
    *
    * Endpoint shape:
    * - DELETE `/guilds/{guild.id}/members/{user.id}/roles/{role.id}`
    *
    * This is non-destructive to other roles.
   *
   * @param userId Discord user ID.
   * @param roleId Role ID to remove.
   * @param reason Optional audit-log reason.
   */
  async removeRole(userId: string, roleId: string, reason?: string) {
    return this.rest.delete(Routes.guildMemberRole(getGuildId(), userId, roleId), {
      body: reason ? { reason } : undefined,
    });
  }

  /**
    * Kicks a member from the guild.
    *
    * User can rejoin later unless separately banned.
    * Use this for temporary enforcement where permanent exclusion is not needed.
    *
    * @param userId Discord user ID.
    * @param reason Optional audit-log reason.
   */
  async removeMember(userId: string, reason?: string) {
    return this.rest.delete(Routes.guildMember(getGuildId(), userId), {
      body: reason ? { reason } : undefined
    });
  }

  /**
    * Bans a user from the guild.
    *
    * Intended for severe policy violations. For temporary removal, prefer kick.
    *
    * @param userId Discord user ID.
    * @param reason Optional audit-log reason.
   */
  async banMember(userId: string, reason?: string) {
    return this.rest.put(Routes.guildBan(getGuildId(), userId), {
      body: reason ? { reason } : undefined
    });
  }

  /**
   * Lifts a user ban so they can rejoin.
    *
    * Typically used in appeals, timed punishments, or manual moderation reversal.
   *
   * @param userId Discord user ID.
   * @param reason Optional audit-log reason.
   */
  async unbanMember(userId: string, reason?: string) {
    return this.rest.delete(Routes.guildBan(getGuildId(), userId), {
      body: reason ? { reason } : undefined,
    });
  }
}

/**
 * Builds a configured `DiscordClient` singleton-style instance.
 *
 * Startup safety:
 * - Throws early if `DISCORD_TOKEN` is missing.
 * - Guild validation occurs per call via `getGuildId()`.
 *
 * @returns Ready-to-use Discord client wrapper.
 */
export function getClient() {
  if (!token) throw new Error('Missing DISCORD_TOKEN in .env.local');
  return new DiscordClient(token);
}

/**
 * Narrows unknown errors to common Discord REST error shape.
 *
 * This makes status-aware handling ergonomic without unsafe casting.
 * Useful for specific branches like 404-not-found member checks.
 *
 * @param error Unknown thrown value from REST calls.
 * @returns `true` when error has `status` and `message` fields.
 */
export function isDiscordError(error: unknown): error is { status: number; message: string } {
  return typeof error === 'object' && error !== null && 'status' in error && 'message' in error;
}