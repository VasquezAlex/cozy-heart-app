import fs from 'fs';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

const Directory = path.dirname(fileURLToPath(import.meta.url));

async function registerEvents(client) {
    const EventsDirectory = path.join(Directory, '..', 'events');

    if (!fs.existsSync(EventsDirectory)) {
        console.warn(`Events directory not found at ${EventsDirectory}`);
        return;
    }

    const eventFiles = fs.readdirSync(EventsDirectory).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        try {
            const filePath = path.join(EventsDirectory, file);
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