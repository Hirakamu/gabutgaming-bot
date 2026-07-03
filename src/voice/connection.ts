import {
  entersState,
  getVoiceConnection,
  joinVoiceChannel,
  VoiceConnection,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import type { Client } from "discord.js";
import { subscribePlayer } from "./player";

const RECONNECT_DELAY_MS = 0;

export async function connectToVoiceChannel(
  client: Client,
  guildId: string,
  channelId: string,
): Promise<VoiceConnection> {
  const existing = getVoiceConnection(guildId);
  if (existing) return existing;

  const guild = client.guilds.cache.get(guildId) ?? (await client.guilds.fetch(guildId));

  const connection = joinVoiceChannel({
    channelId,
    guildId,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: true,
  });

  subscribePlayer(connection);

  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    try {
      // A disconnect can mean we're being moved between channels (which
      // re-signals) rather than a real drop, so give it a chance to recover.
      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, 0),
        entersState(connection, VoiceConnectionStatus.Connecting, 0),
      ]);
    } catch {
      connection.destroy();
    }
  });

  connection.on(VoiceConnectionStatus.Destroyed, () => {
    setTimeout(() => {
      console.log("Reconnecting to voice channel...");
      connectToVoiceChannel(client, guildId, channelId).catch((error) => {
        console.error("Failed to reconnect to voice channel:", error);
      });
    }, RECONNECT_DELAY_MS);
  });

  connection.on("error", (error) => {
    console.error("Voice connection error:", error);
  });

  return connection;
}
