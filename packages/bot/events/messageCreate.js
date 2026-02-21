import { Events } from 'discord.js';

const messageCreateEvent = {
    name: Events.MessageCreate,

    /**
     * @param {import('discord.js').Message} message
     * @param {import('discord.js').Client} client
     */
    async execute(message, client) {
        if (message.author.bot || !message.content.startsWith('&')) return;

        const args = message.content.slice(1).trim().split(/ +/);
        const name = args.shift()?.toLowerCase();

        if (!name) return;
        const command = client.prefixCommands?.get(name);

        if (!command) return;

        try {
            await command.execute(message, args);
        } catch (error) {
            console.error(error);
        }
    }
};

export default messageCreateEvent;