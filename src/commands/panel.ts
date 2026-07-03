import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { setPanelView } from "../voice/panelState";
import { renderPanel } from "../voice/panelView";

export const command: Command = {
  data: new SlashCommandBuilder().setName("panel").setDescription("Open the music control panel"),
  async execute(interaction) {
    const { embeds, components } = renderPanel({ mode: "player" });
    const message = await interaction.reply({ embeds, components, fetchReply: true });
    setPanelView(message.id, { mode: "player" });
  },
};
