import { Events, type Message } from "discord.js";
import type { BotClient, BotEvent } from "../types";

const messageCreateEvent: BotEvent = {
  name: Events.MessageCreate,
  async execute(messageArg: unknown, clientArg: unknown) {
    const message = messageArg as Message;
    const client = clientArg as BotClient;

    if (message.author.bot || !message.content.startsWith("&")) return;

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
  },
};

export default messageCreateEvent;
