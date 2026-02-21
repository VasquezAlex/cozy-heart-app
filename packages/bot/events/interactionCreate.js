// File: Bot/Events/interactionCreate.js

import {
  Events,
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
} from "discord.js";
import fs from "fs";
import path from "path";
import { pathToFileURL, fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Helper to make error boxes
function errorBox(title, message) {
  return new ContainerBuilder()
    .setAccentColor(0xE9A630)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`## ${title}\n${message}`)
    );
}

const interactionCreateEvent = {
  name: Events.InteractionCreate,

  async execute(interaction) {
    try {
      // 1. IS IT A SLASH COMMAND? (/ping, /ticket)
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        
        if (!command) {
          const ui = errorBox("Command Not Found", "That command isn't registered.\n> Tell staff to sync commands.");
          return interaction.reply({ components: [ui], flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
        }

        return command.execute(interaction);
      }

      // 2. IS IT A BUTTON OR MODAL? If not, stop here.
      if (!interaction.isMessageComponent() && !interaction.isModalSubmit()) return;

      // 3. GET THE BUTTON ID AND CLEAN IT
      // Input: "owner:self-roles:button-123456" → Output: "owner:self-roles:button"
      const id = interaction.customId.replace(/-\d{5,}$/, "");
      
      // 4. FIND THE FILE
      // "owner:self-roles:button" → folder: Interactions/owner/self-roles/button/index.js
      const parts = id.split(":");
      const filePath = path.join(__dirname, "..", "Interactions", ...parts, "index.js");

      // 5. IF FILE DOESN'T EXIST, SHOW ERROR
      if (!fs.existsSync(filePath)) {
        const ui = errorBox("Button Broken", `Missing file for: ${interaction.customId}`);
        return interaction.reply({ components: [ui], flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
      }

      // 6. RUN THE FILE
      const handler = await import(pathToFileURL(filePath).href);
      await handler.default.execute(interaction);

    } catch (err) {
      // 7. IF ANYTHING CRASHES
      console.error(err);
      
      if (interaction.isRepliable() && !interaction.replied) {
        const ui = errorBox("Error", "Something went wrong.\n> Tell staff if this keeps happening.");
        await interaction.reply({ components: [ui], flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] }).catch(() => {});
      }
    }
  }
};

export default interactionCreateEvent;