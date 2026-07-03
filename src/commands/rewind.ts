import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { rewindTrack } from "../voice/player";

export const command: Command = {
  data: new SlashCommandBuilder().setName("rewind").setDescription("Restart the current track from the beginning"),
  async execute(interaction) {
    const rewound = rewindTrack();
    await interaction.reply(rewound ? "Rewound to the start." : "Nothing is playing.");
  },
};
