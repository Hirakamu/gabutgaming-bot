import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { resumeTrack } from "../voice/player";

export const command: Command = {
  data: new SlashCommandBuilder().setName("resume").setDescription("Resume the paused track"),
  async execute(interaction) {
    const resumed = resumeTrack();
    await interaction.reply(resumed ? "Resumed." : "Nothing to resume.");
  },
};
