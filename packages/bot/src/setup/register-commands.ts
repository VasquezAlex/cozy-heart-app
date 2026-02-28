import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import type { BotClient, PrefixCommand, SlashCommand } from "../types";

const directory = path.dirname(fileURLToPath(import.meta.url));

function getCommandFiles(dir: string) {
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((file) => file.isFile() && (file.name.endsWith(".ts") || file.name.endsWith(".js")))
    .map((file) => path.join(dir, file.name));
}

export default async function registerCommands(client: BotClient) {
  client.prefixCommands = new Map();
  client.slashCommands = new Map();

  const baseDirectory = path.join(directory, "..", "commands");
  const prefixDirectory = path.join(baseDirectory, "prefix");
  const slashDirectory = path.join(baseDirectory, "slash");

  const prefixCommands = getCommandFiles(prefixDirectory);

  for (const file of prefixCommands) {
    try {
      const { default: command } = (await import(pathToFileURL(file).href)) as { default: PrefixCommand };

      if (!command.name || !command.execute) {
        console.warn(`[Prefix] ${file} missing name or execute`);
        continue;
      }

      client.prefixCommands.set(command.name, command);
      console.log(`[Prefix] Loaded: ${command.name}`);
    } catch (error) {
      console.error(`[Prefix] Error loading ${file}:`, error);
    }
  }

  const slashCommands = getCommandFiles(slashDirectory);
  const slashCommandData: unknown[] = [];

  for (const file of slashCommands) {
    try {
      const { default: command } = (await import(pathToFileURL(file).href)) as { default: SlashCommand };

      if (!command.data || !command.execute) {
        console.warn(`[Slash] ${file} missing data or execute`);
        continue;
      }

      const name = command.data.name;
      client.slashCommands.set(name, command);
      slashCommandData.push(command.data.toJSON());
      console.log(`[Slash] Loaded: ${name}`);
    } catch (error) {
      console.error(`[Slash] Error loading ${file}:`, error);
    }
  }

  if (slashCommandData.length > 0) {
    const token = process.env.BOT_TOKEN;
    const clientId = process.env.CLIENT_ID;

    if (!token || !clientId) {
      console.warn("[Slash] Missing BOT_TOKEN or CLIENT_ID; skipping registration");
      return;
    }

    const rest = new REST({ version: "10" }).setToken(token);

    try {
      if (process.env.DISCORD_GUILD_ID) {
        await rest.put(Routes.applicationGuildCommands(clientId, process.env.DISCORD_GUILD_ID), {
          body: slashCommandData,
        });
        console.log(`[Slash] Registered ${slashCommandData.length} guild commands`);
      } else {
        await rest.put(Routes.applicationCommands(clientId), {
          body: slashCommandData,
        });
        console.log(`[Slash] Registered ${slashCommandData.length} global commands`);
      }
    } catch (error) {
      console.error("[Slash] Registration failed:", error);
    }
  }
}
