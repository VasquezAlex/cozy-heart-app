import "dotenv/config";
import { Client, Events, GatewayIntentBits, } from 'discord.js';
import registerCommands from './setup/registerCommands.js';
import registerEvents   from './setup/registerEvents.js';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages
    ]
});

client.prefixCommands = new Map();
client.slashCommands = new Map();

registerCommands(client);
registerEvents(client);

client.once(Events.ClientReady, () => {
    console.log('Bot is online!');
});

client.login(process.env.DISCORD_TOKEN);