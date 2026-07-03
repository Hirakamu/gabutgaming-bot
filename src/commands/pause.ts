import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { pauseTrack } from "../voice/player";

export const command: Command = {
  data: new SlashCommandBuilder().setName("pause").setDescription("Pause the current track"),
  async execute(interaction) {
    const paused = pauseTrack();
    await interaction.reply(paused ? "Paused." : "Nothing is playing.");
  },
};
