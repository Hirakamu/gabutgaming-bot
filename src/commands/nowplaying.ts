import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { getStatus } from "../voice/player";

export const command: Command = {
  data: new SlashCommandBuilder().setName("nowplaying").setDescription("Show what's playing and what's queued"),
  async execute(interaction) {
    const { current, paused, queue } = getStatus();
    const state = current ? (paused ? "Paused" : "Playing") : "Idle";
    const queueText = queue.length ? queue.map((title, index) => `${index + 1}. ${title}`).join("\n") : "(empty)";

    await interaction.reply(
      `**${state}:** ${current ?? "nothing"}\n**Queue (${queue.length}):**\n${queueText}`,
    );
  },
};
