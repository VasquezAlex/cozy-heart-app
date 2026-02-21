import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';  // Add pathToFileURL
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';

const Directory = path.dirname(fileURLToPath(import.meta.url));

function getCommandFiles(dir) {
    if (!fs.existsSync(dir)) return [];

    return fs.readdirSync(dir, { recursive: true, withFileTypes: true })
        .filter(file => file.isFile() && file.name.endsWith('.js'))
        .map(file => path.join(dir, file.name));
}

export default async function registerCommands(client) {
    client.prefixCommands = new Map();
    client.slashCommands = new Map();

    const BaseDirectory = path.join(Directory, '..', 'commands');
    const PrefixDirectory = path.join(BaseDirectory, 'prefix');
    const SlashDirectory = path.join(BaseDirectory, 'slash');

    // Load prefix commands
    const PrefixCommands = getCommandFiles(PrefixDirectory);

    for (const file of PrefixCommands) {
        try {
            // FIX HERE: Use pathToFileURL
            const { default: command } = await import(pathToFileURL(file).href);

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

    // Load slash commands
    const SlashCommands = getCommandFiles(SlashDirectory);
    const SlashCommandData = [];

    for (const file of SlashCommands) {
        try {
            // FIX HERE: Use pathToFileURL
            const { default: command } = await import(pathToFileURL(file).href);

            if (!command.data || !command.execute) {
                console.warn(`[Slash] ${file} missing data or execute`);
                continue;
            }

            const name = command.data.name;
            client.slashCommands.set(name, command);
            SlashCommandData.push(command.data.toJSON());
            console.log(`[Slash] Loaded: ${name}`);
        } catch (error) {
            console.error(`[Slash] Error loading ${file}:`, error);
        }
    }

    // Register slash commands to Discord
    if (SlashCommandData.length > 0) {
        const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
        
        try {
            if (process.env.GUILD_ID) {
                await rest.put(
                    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                    { body: SlashCommandData }
                );
                console.log(`[Slash] Registered ${SlashCommandData.length} guild commands`);
            } else {
                await rest.put(
                    Routes.applicationCommands(process.env.CLIENT_ID),
                    { body: SlashCommandData }
                );
                console.log(`[Slash] Registered ${SlashCommandData.length} global commands`);
            }
        } catch (error) {
            console.error('[Slash] Registration failed:', error);
        }
    }
}