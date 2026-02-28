import fs from "fs";
import path from "path";
import { pathToFileURL, fileURLToPath } from "url";
import type { BotClient, BotEvent } from "../types";

const directory = path.dirname(fileURLToPath(import.meta.url));

export default async function registerEvents(client: BotClient) {
  const eventsDirectory = path.join(directory, "..", "events");

  if (!fs.existsSync(eventsDirectory)) {
    console.warn(`Events directory not found at ${eventsDirectory}`);
    return;
  }

  const eventFiles = fs
    .readdirSync(eventsDirectory)
    .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

  for (const file of eventFiles) {
    try {
      const filePath = path.join(eventsDirectory, file);
      const { default: event } = (await import(pathToFileURL(filePath).href)) as { default: BotEvent };

      if (!event.name || !event.execute) {
        console.warn(`Event at ${filePath} is missing a name or execute function.`);
        continue;
      }

      client.on(event.name, (...args) => event.execute(...args, client));
      console.log(`Loaded event: ${event.name}`);
    } catch (error) {
      console.error(`Error loading event at ${file}:`, error);
    }
  }
}
