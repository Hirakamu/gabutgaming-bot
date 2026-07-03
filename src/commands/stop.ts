import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { stopPlayback } from "../voice/player";

export const command: Command = {
  data: new SlashCommandBuilder().setName("stop").setDescription("Stop playback and clear the queue"),
  async execute(interaction) {
    stopPlayback();
    await interaction.reply("Stopped playback and cleared the queue.");
  },
};
