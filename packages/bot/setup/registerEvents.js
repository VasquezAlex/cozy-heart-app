import fs from 'fs';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

const directory = path.dirname(fileURLToPath(import.meta.url));

async function registerEvents(client) {
    const eventsDirectory = path.join(directory, '..', 'events');

    if (!fs.existsSync(eventsDirectory)) {
        console.warn(`Events directory not found at ${eventsDirectory}`);
        return;
    }

    const eventFiles = fs.readdirSync(eventsDirectory).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        try {
            const filePath = path.join(eventsDirectory, file);
            const { default: event } = await import(pathToFileURL(filePath).href);

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

export default registerEvents;