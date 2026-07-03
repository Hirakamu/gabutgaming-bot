import "dotenv/config";
import ffmpegPath from "ffmpeg-static";
if (ffmpegPath) process.env.FFMPEG_PATH = ffmpegPath;

import { Client, Events, GatewayIntentBits } from "discord.js";
import { commands } from "./commands";
import type { Command } from "./types";
import { connectToVoiceChannel } from "./voice/connection";
import { handlePanelButton, handlePanelSelectMenu, handlePanelModalSubmit } from "./voice/panelController";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

client.commands = new Map<string, Command>();
for (const command of commands) {
  client.commands.set(command.data.name, command);
}

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);

  const { DISCORD_GUILD_ID, VOICE_CHANNEL_ID } = process.env;
  if (DISCORD_GUILD_ID && VOICE_CHANNEL_ID) {
    try {
      await connectToVoiceChannel(readyClient, DISCORD_GUILD_ID, VOICE_CHANNEL_ID);
      console.log("Joined voice channel and will auto-reconnect if disconnected.");
    } catch (error) {
      console.error("Failed to join voice channel:", error);
    }
  } else {
    console.warn("DISCORD_GUILD_ID or VOICE_CHANNEL_ID not set - skipping auto voice join.");
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName);
    if (!command?.autocomplete) return;

    try {
      await command.autocomplete(interaction);
    } catch (error) {
      console.error(`Error in autocomplete for ${interaction.commandName}:`, error);
    }
    return;
  }

  if (interaction.isButton() && interaction.customId.startsWith("panel:")) {
    try {
      await handlePanelButton(interaction);
    } catch (error) {
      console.error(`Error handling panel button ${interaction.customId}:`, error);
    }
    return;
  }

  if (interaction.isStringSelectMenu() && interaction.customId.startsWith("panel:")) {
    try {
      await handlePanelSelectMenu(interaction);
    } catch (error) {
      console.error(`Error handling panel select menu ${interaction.customId}:`, error);
    }
    return;
  }

  if (interaction.isModalSubmit() && interaction.customId.startsWith("panel:")) {
    try {
      await handlePanelModalSubmit(interaction);
    } catch (error) {
      console.error(`Error handling panel modal submit ${interaction.customId}:`, error);
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing command ${interaction.commandName}:`, error);
    const errorMessage = { content: "There was an error executing this command.", ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
