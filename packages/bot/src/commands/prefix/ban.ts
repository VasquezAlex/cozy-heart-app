import { ContainerBuilder, MessageFlags, PermissionsBitField, TextDisplayBuilder, type Message } from "discord.js";
import { APICall } from "../../utils/signed-api";
import type { PrefixCommand } from "../../types";

type BanApiResponse = {
  altCount?: number;
  banCount?: number;
  bansCreated?: number;
  details?: {
    altsBanned?: number;
  };
};

const command: PrefixCommand = {
  name: "ban",
  description: "Ban a user from the server.",
  usage: "<user> [reason]",
  category: "Moderation",
  async execute(message: Message, args: string[]) {
    if (!message.guild) return;

    const target = message.mentions.members?.first() || message.guild.members.cache.get(args[0] || "");
    const moderator = message.guild.roles.cache.find((role) => role.name.toLowerCase() === "cozy team");

    if (!target) {
      return message.reply({
        components: [
          new ContainerBuilder()
            .setAccentColor(0xe9a630)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent("You must either `@mention` or `id` of the user to ban.")),
        ],
        flags: [MessageFlags.IsComponentsV2],
      });
    }

    if (!message.member?.roles.cache.has(moderator?.id || "") && !message.member?.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return message.reply({
        components: [
          new ContainerBuilder()
            .setAccentColor(0xe53935)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent("You lack permission to ban users.")),
        ],
        flags: [MessageFlags.IsComponentsV2],
      });
    }

    if (target.id === message.author.id) {
      return message.reply({
        components: [
          new ContainerBuilder().setAccentColor(0xe9a630).addTextDisplayComponents(new TextDisplayBuilder().setContent("You cannot ban yourself.")),
        ],
        flags: [MessageFlags.IsComponentsV2],
      });
    }

    if (!target.bannable) {
      return message.reply({
        components: [
          new ContainerBuilder().setAccentColor(0xe53935).addTextDisplayComponents(new TextDisplayBuilder().setContent("I cannot ban this user.")),
        ],
        flags: [MessageFlags.IsComponentsV2],
      });
    }

    const reason = args.slice(1).join(" ") || "No reason provided";

    try {
      await target.ban({ reason });

      let altCount = 0;
      try {
        const result = await APICall<BanApiResponse>("/api/moderation/bans", {
          UserID: target.id,
          Reason: reason,
          BannedBy: message.author.id,
          ExpiresAt: null,
          Cascade: true,
        });

        altCount = result.altCount || result.details?.altsBanned || 0;
        const totalBans = result.banCount || result.bansCreated || 0;
        console.log(`[Ban] API created ${totalBans} ban records for ${target.id} (${altCount} alts banned)`);
      } catch (apiError) {
        console.error("[Ban] API call failed:", apiError);
      }

      const successMessage =
        altCount > 0
          ? `Banned **${target.user.tag}** | ${reason}\n> IP, Device fingerprint, and **${altCount} alt account(s)** blacklisted.`
          : `Banned **${target.user.tag}** | ${reason}\n> IP & Device fingerprint blacklisted.`;

      return message.reply({
        components: [new ContainerBuilder().setAccentColor(0x43b581).addTextDisplayComponents(new TextDisplayBuilder().setContent(successMessage))],
        flags: [MessageFlags.IsComponentsV2],
      });
    } catch (err) {
      console.error("[Ban] Error:", err);
      return message.reply({
        components: [
          new ContainerBuilder().setAccentColor(0xe53935).addTextDisplayComponents(new TextDisplayBuilder().setContent("Failed to ban the user.")),
        ],
        flags: [MessageFlags.IsComponentsV2],
      });
    }
  },
};

export default command;
