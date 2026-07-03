import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { listTracks, resolveTrack } from "../voice/library";
import { enqueueTracks } from "../voice/player";
import {
  addTrackToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylist,
  listPlaylists,
  removeTrackFromPlaylist,
} from "../voice/playlists";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("playlist")
    .setDescription("Manage and play global playlists")
    .addSubcommand((sub) =>
      sub
        .setName("create")
        .setDescription("Create a new playlist")
        .addStringOption((option) => option.setName("name").setDescription("Playlist name").setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("delete")
        .setDescription("Delete a playlist")
        .addStringOption((option) =>
          option.setName("name").setDescription("Playlist name").setRequired(true).setAutocomplete(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add a track to a playlist")
        .addStringOption((option) =>
          option.setName("playlist").setDescription("Playlist name").setRequired(true).setAutocomplete(true),
        )
        .addStringOption((option) =>
          option.setName("track").setDescription("Track name").setRequired(true).setAutocomplete(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove a track from a playlist")
        .addStringOption((option) =>
          option.setName("playlist").setDescription("Playlist name").setRequired(true).setAutocomplete(true),
        )
        .addStringOption((option) =>
          option.setName("track").setDescription("Track name").setRequired(true).setAutocomplete(true),
        ),
    )
    .addSubcommand((sub) => sub.setName("list").setDescription("List all playlists"))
    .addSubcommand((sub) =>
      sub
        .setName("show")
        .setDescription("Show the tracks in a playlist")
        .addStringOption((option) =>
          option.setName("name").setDescription("Playlist name").setRequired(true).setAutocomplete(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("play")
        .setDescription("Queue every track in a playlist")
        .addStringOption((option) =>
          option.setName("name").setDescription("Playlist name").setRequired(true).setAutocomplete(true),
        ),
    ),
  async autocomplete(interaction) {
    const focused = interaction.options.getFocused(true);

    if (focused.name === "track") {
      const value = focused.value.toLowerCase();
      const choices = listTracks()
        .filter((track) => track.toLowerCase().includes(value))
        .slice(0, 25)
        .map((track) => ({ name: track, value: track }));
      await interaction.respond(choices);
      return;
    }

    const value = focused.value.toLowerCase();
    const choices = listPlaylists()
      .filter((playlist) => playlist.name.toLowerCase().includes(value))
      .slice(0, 25)
      .map((playlist) => ({ name: playlist.name, value: playlist.name }));
    await interaction.respond(choices);
  },
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "create") {
      const name = interaction.options.getString("name", true);
      const playlist = createPlaylist(name);
      if (!playlist) {
        await interaction.reply({ content: `A playlist named **${name}** already exists.`, ephemeral: true });
        return;
      }
      await interaction.reply(`Created playlist **${playlist.name}**.`);
      return;
    }

    if (sub === "delete") {
      const name = interaction.options.getString("name", true);
      const deleted = deletePlaylist(name);
      await interaction.reply(deleted ? `Deleted playlist **${name}**.` : `No playlist named **${name}** found.`);
      return;
    }

    if (sub === "add") {
      const playlistName = interaction.options.getString("playlist", true);
      const trackQuery = interaction.options.getString("track", true);
      const track = resolveTrack(trackQuery);
      if (!track) {
        await interaction.reply({ content: `Track not found: ${trackQuery}`, ephemeral: true });
        return;
      }
      const playlist = addTrackToPlaylist(playlistName, track.title);
      if (!playlist) {
        await interaction.reply({ content: `No playlist named **${playlistName}** found.`, ephemeral: true });
        return;
      }
      await interaction.reply(`Added **${track.title}** to **${playlist.name}** (${playlist.tracks.length} tracks).`);
      return;
    }

    if (sub === "remove") {
      const playlistName = interaction.options.getString("playlist", true);
      const trackQuery = interaction.options.getString("track", true);
      const playlist = removeTrackFromPlaylist(playlistName, trackQuery);
      if (!playlist) {
        await interaction.reply({ content: `No playlist named **${playlistName}** found.`, ephemeral: true });
        return;
      }
      await interaction.reply(
        `Removed **${trackQuery}** from **${playlist.name}** (${playlist.tracks.length} tracks).`,
      );
      return;
    }

    if (sub === "list") {
      const playlists = listPlaylists();
      if (!playlists.length) {
        await interaction.reply("No playlists yet. Create one with `/playlist create`.");
        return;
      }
      const lines = playlists.map((playlist) => `**${playlist.name}** (${playlist.tracks.length} tracks)`);
      await interaction.reply(lines.join("\n"));
      return;
    }

    if (sub === "show") {
      const name = interaction.options.getString("name", true);
      const playlist = getPlaylist(name);
      if (!playlist) {
        await interaction.reply({ content: `No playlist named **${name}** found.`, ephemeral: true });
        return;
      }
      const tracks = playlist.tracks.length
        ? playlist.tracks.map((title, index) => `${index + 1}. ${title}`).join("\n")
        : "(empty)";
      await interaction.reply(`**${playlist.name}**\n${tracks}`);
      return;
    }

    if (sub === "play") {
      const name = interaction.options.getString("name", true);
      const playlist = getPlaylist(name);
      if (!playlist || !playlist.tracks.length) {
        await interaction.reply({ content: `Playlist **${name}** is empty or missing.`, ephemeral: true });
        return;
      }

      const resolved = playlist.tracks
        .map((title) => resolveTrack(title))
        .filter((track): track is NonNullable<typeof track> => track !== null);

      if (!resolved.length) {
        await interaction.reply({
          content: `None of the tracks in **${playlist.name}** could be found in music/.`,
          ephemeral: true,
        });
        return;
      }

      enqueueTracks(resolved);
      await interaction.reply(`Queued **${resolved.length}** track(s) from **${playlist.name}**.`);
      return;
    }
  },
};
