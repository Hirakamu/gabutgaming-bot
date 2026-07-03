import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { listTracks, resolveTrack } from "../voice/library";
import { enqueueTrack } from "../voice/player";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a local audio file in the voice channel")
    .addStringOption((option) =>
      option
        .setName("track")
        .setDescription("Track name from the music/ folder")
        .setRequired(true)
        .setAutocomplete(true),
    ),
  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const choices = listTracks()
      .filter((track) => track.toLowerCase().includes(focused))
      .slice(0, 25)
      .map((track) => ({ name: track, value: track }));

    await interaction.respond(choices);
  },
  async execute(interaction) {
    const query = interaction.options.getString("track", true);
    const track = resolveTrack(query);

    if (!track) {
      const available = listTracks().join(", ") || "(no tracks found in music/)";
      await interaction.reply({ content: `Track not found. Available: ${available}`, ephemeral: true });
      return;
    }

    enqueueTrack(track);
    await interaction.reply(`Queued: **${track.title}**`);
  },
};
