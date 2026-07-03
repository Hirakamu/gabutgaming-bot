import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { skipTrack } from "../voice/player";

export const command: Command = {
  data: new SlashCommandBuilder().setName("skip").setDescription("Skip to the next track in the queue"),
  async execute(interaction) {
    const skipped = skipTrack();
    await interaction.reply(skipped ? "Skipped." : "Nothing is playing.");
  },
};
