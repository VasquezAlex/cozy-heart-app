if (!process.env.NEXTAUTH_URL && process.env.NODE_ENV !== "production") {
  process.env.NEXTAUTH_URL = "http://localhost:3000";
}

export const guildId = process.env.DISCORD_GUILD_ID ?? "";
export const clientId = process.env.DISCORD_CLIENT_ID ?? "";
export const clientSecret = process.env.DISCORD_CLIENT_SECRET ?? "";
export const verifiedRole = process.env.VERIFIED_ROLE_ID;
export const modRoleId = process.env.MOD_ROLE_ID;
export const adminRoleId = process.env.ADMIN_ROLE_ID;
export const ownerRoleId = process.env.OWNER_ROLE_ID;
export const guild = process.env.GUILD_NAME || "Server";

export const staffRoles = new Set(["MOD", "ADMIN", "OWNER"]);
export const adminRoles = [ownerRoleId, adminRoleId, modRoleId].filter(
  (roleId): roleId is string => Boolean(roleId)
);

export const defaultAgeRange: [number, number] = [18, 99];
export const maxAge = 30 * 24 * 60 * 60;
