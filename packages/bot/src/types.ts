import type { ChatInputCommandInteraction, Client, Message } from "discord.js";

export interface PrefixCommand {
  name: string;
  description?: string;
  usage?: string;
  category?: string;
  execute: (message: Message, args: string[]) => Promise<unknown> | unknown;
}

export interface SlashCommand {
  data: {
    name: string;
    toJSON: () => unknown;
  };
  execute: (interaction: ChatInputCommandInteraction) => Promise<unknown> | unknown;
}

export interface BotEvent {
  name: string;
  execute: (...args: unknown[]) => Promise<unknown> | unknown;
}

export interface BotClient extends Client {
  prefixCommands: Map<string, PrefixCommand>;
  slashCommands: Map<string, SlashCommand>;
}
