import "dotenv/config";
import { Client, Events, GatewayIntentBits } from "discord.js";
import registerCommands from "./setup/register-commands";
import registerEvents from "./setup/register-events";
import type { BotClient } from "./types";

const client =
  new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.DirectMessages,
    ],
  }) as BotClient;

client.prefixCommands = new Map();
client.slashCommands = new Map();

void registerCommands(client);
void registerEvents(client);

client.once(Events.ClientReady, () => {
  console.log("Bot is online!");
});

void client.login(process.env.DISCORD_TOKEN);
