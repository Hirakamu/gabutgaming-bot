import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { previousTrack } from "../voice/player";

export const command: Command = {
  data: new SlashCommandBuilder().setName("previous").setDescription("Go back and play the previous track"),
  async execute(interaction) {
    const went = previousTrack();
    await interaction.reply(went ? "Playing the previous track." : "No previous track in history.");
  },
};
