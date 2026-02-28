import {
  Events,
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  type Interaction,
} from "discord.js";
import fs from "fs";
import path from "path";
import { pathToFileURL, fileURLToPath } from "url";
import type { BotEvent } from "../types";

const dirname = path.dirname(fileURLToPath(import.meta.url));

function errorBox(title: string, message: string) {
  return new ContainerBuilder()
    .setAccentColor(0xe9a630)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${title}\n${message}`));
}

const interactionCreateEvent: BotEvent = {
  name: Events.InteractionCreate,
  async execute(interactionArg: unknown) {
    const interaction = interactionArg as Interaction;

    try {
      if (interaction.isChatInputCommand()) {
        const command = (interaction.client as unknown as { slashCommands?: Map<string, { execute: (i: Interaction) => unknown }> }).slashCommands?.get(
          interaction.commandName
        );

        if (!command) {
          const ui = errorBox("Command Not Found", "That command isn't registered.\n> Tell staff to sync commands.");
          return interaction.reply({ components: [ui], flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
        }

        return command.execute(interaction);
      }

      if (!interaction.isMessageComponent() && !interaction.isModalSubmit()) return;

      const id = interaction.customId.replace(/-\d{5,}$/, "");
      const parts = id.split(":");
      const filePath = path.join(dirname, "..", "Interactions", ...parts, "index.js");

      if (!fs.existsSync(filePath)) {
        const ui = errorBox("Button Broken", `Missing file for: ${interaction.customId}`);
        return interaction.reply({ components: [ui], flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
      }

      const handler = await import(pathToFileURL(filePath).href);
      await handler.default.execute(interaction);
    } catch (err) {
      console.error(err);

      if (interaction.isRepliable() && !interaction.replied) {
        const ui = errorBox("Error", "Something went wrong.\n> Tell staff if this keeps happening.");
        await interaction.reply({ components: [ui], flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] }).catch(() => {});
      }
    }
  },
};

export default interactionCreateEvent;
