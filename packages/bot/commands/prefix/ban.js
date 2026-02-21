import { ContainerBuilder, MessageFlags, PermissionsBitField, TextDisplayBuilder } from 'discord.js'

const command = {
    name: "ban", 
    description: "Ban a user from the server.",
    usage: "<user> [reason]",
    category: "Moderation",

    async execute(message, args) {
        if (!message.guild) return;

        const Target = message.mentions.members?.first() || message.guild.members.cache.get(args[0]);
        const Moderator = message.guild.roles.cache.find(role => role.name.toLowerCase() === 'cozy team');

        if (!Target) {
            return message.reply({
                components: [
                    new ContainerBuilder()
                        .setAccentColor(0xE9A630)
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent('You must either `@mention` or `id` of the user to ban.')
                        )
                ],
                flags: [MessageFlags.IsComponentsV2]
            });
        }

        if (!message.member?.roles.cache.has(Moderator?.id || '') && !message.member?.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return message.reply({
                components: [
                    new ContainerBuilder()
                        .setAccentColor(0xE53935)
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent('You lack permission to ban users.'))
                ],
                flags: [MessageFlags.IsComponentsV2]
            });
        }

        if (Target.id === message.author.id) {
            return message.reply({
                components: [
                    new ContainerBuilder()
                        .setAccentColor(0xE9A630)
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent('You cannot ban yourself.'))
                ],
                flags: [MessageFlags.IsComponentsV2]
            });
        }

        if (!Target.bannable) {
            return message.reply({
                components: [
                    new ContainerBuilder()
                        .setAccentColor(0xE53935)
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent('I cannot ban this user.'))
                ],
                flags: [MessageFlags.IsComponentsV2]
            });
        }

        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {
            // 1. Ban the main target on Discord first
            await Target.ban({ reason });

            // 2. Call API to ban IP, Device, and detect alts
            let altCount = 0;
            try {
                const Response = await fetch(`${process.env.API_URL}/api/ban`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.API_KEY}`
                    },
                    body: JSON.stringify({
                        TargetID: Target.id,
                        TargetType: 'USER',
                        UserID: Target.id,  // Discord ID for user lookup
                        Reason: reason,
                        BannedBy: message.author.id,
                        ExpiresAt: null,  // null = permanent
                        BanAlts: true,    // Enable alt detection
                    })
                });

                if (!Response.ok) {
                    const errorText = await Response.text();
                    console.error('[Ban] API error:', errorText);
                } else {
                    const result = await Response.json();
                    altCount = result.altCount || 0;
                    console.log(`[Ban] API created ${result.banCount} ban records for ${Target.id} (${altCount} alts banned)`);
                }
            } catch (apiError) {
                console.error('[Ban] API call failed:', apiError);
            }

            // 3. Build success message
            const successMessage = altCount > 0 
                ? `Banned **${Target.user.tag}** | ${reason}\n> IP, Device fingerprint, and **${altCount} alt account(s)** blacklisted.`
                : `Banned **${Target.user.tag}** | ${reason}\n> IP & Device fingerprint blacklisted.`;

            return message.reply({
                components: [
                    new ContainerBuilder()
                        .setAccentColor(0x43B581)
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(successMessage)
                        )
                ],
                flags: [MessageFlags.IsComponentsV2]
            });
            
        } catch (err) {
            console.error('[Ban] Error:', err);
            return message.reply({
                components: [
                    new ContainerBuilder()
                        .setAccentColor(0xE53935)
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent('Failed to ban the user.'))
                ],
                flags: [MessageFlags.IsComponentsV2]
            });
        }
    }
};

export default command;