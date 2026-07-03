import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { finishQueue } from "../voice/player";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("finish")
    .setDescription("Clear the upcoming queue, letting the current track finish before playback stops"),
  async execute(interaction) {
    finishQueue();
    await interaction.reply("Queue cleared. The current track will finish, then playback will stop.");
  },
};
