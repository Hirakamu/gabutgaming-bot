import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import { listUniqueTracks } from "./library";
import { getPlaylist, listPlaylists } from "./playlists";
import { getQueue, getStatus } from "./player";
import type { PanelView } from "./panelState";

const TRACKS_PER_PAGE = 10;
const MAX_QUEUE_PREVIEW = 10;

export function renderPanel(view: PanelView): { embeds: EmbedBuilder[]; components: ActionRowBuilder<any>[] } {
  if (view.mode === "playlistChooser") return renderPlaylistChooser();
  if (view.mode === "playlistEditor") return renderPlaylistEditor(view.playlistName, view.page);
  return renderPlayer();
}

function renderPlayer(): { embeds: EmbedBuilder[]; components: ActionRowBuilder<any>[] } {
  const status = getStatus();
  const queue = getQueue();

  const preview = queue.slice(0, MAX_QUEUE_PREVIEW).map((track, index) => `${index + 1}. ${track.title}`);
  const remaining = queue.length - MAX_QUEUE_PREVIEW;
  const queueLines = preview.length ? preview.join("\n") + (remaining > 0 ? `\n+${remaining} more` : "") : "(empty)";

  const embed = new EmbedBuilder()
    .setTitle("Music Player")
    .addFields(
      { name: "Now Playing", value: status.current ?? "nothing" },
      { name: "State", value: status.current ? (status.paused ? "Paused" : "Playing") : "Idle" },
      { name: "Up Next", value: queueLines },
    );

  const controlsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("panel:previous").setLabel("Previous").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("panel:toggle")
      .setLabel(status.paused ? "Resume" : "Pause")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("panel:skip").setLabel("Skip").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("panel:rewind").setLabel("Rewind").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("panel:refresh").setLabel("Refresh").setStyle(ButtonStyle.Secondary),
  );

  const secondaryRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("panel:stop").setLabel("Stop").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("panel:finish").setLabel("Finish Queue").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("panel:playlists").setLabel("Playlists").setStyle(ButtonStyle.Primary),
  );

  const components: ActionRowBuilder<any>[] = [controlsRow, secondaryRow];

  const playlists = listPlaylists();
  if (playlists.length) {
    const options = playlists.slice(0, 25).map((playlist) => ({
      label: playlist.name,
      value: playlist.name,
    }));
    const select = new StringSelectMenuBuilder()
      .setCustomId("panel:play-playlist")
      .setPlaceholder("Play a playlist...")
      .addOptions(options);
    components.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select));
  }

  return { embeds: [embed], components };
}

function renderPlaylistChooser(): { embeds: EmbedBuilder[]; components: ActionRowBuilder<any>[] } {
  const playlists = listPlaylists();

  const embed = new EmbedBuilder()
    .setTitle("Playlists")
    .setDescription(
      playlists.length
        ? playlists.map((playlist) => `**${playlist.name}** (${playlist.tracks.length} tracks)`).join("\n")
        : "There are no playlists yet, why not create one?",
    );

  const components: ActionRowBuilder<any>[] = [];

  if (playlists.length) {
    const options = playlists.slice(0, 25).map((playlist) => ({
      label: playlist.name,
      value: playlist.name,
    }));
    const select = new StringSelectMenuBuilder()
      .setCustomId("panel:choose-playlist")
      .setPlaceholder("Choose a playlist to edit...")
      .addOptions(options);
    components.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select));
  }

  const buttonsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("panel:new-playlist").setLabel("New Playlist").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("panel:back-to-player").setLabel("Back").setStyle(ButtonStyle.Secondary),
  );
  components.push(buttonsRow);

  return { embeds: [embed], components };
}

function renderPlaylistEditor(
  playlistName: string,
  page: number,
): { embeds: EmbedBuilder[]; components: ActionRowBuilder<any>[] } {
  const playlist = getPlaylist(playlistName);
  const tracks = playlist?.tracks ?? [];

  const totalPages = Math.max(1, Math.ceil(tracks.length / TRACKS_PER_PAGE));
  const clampedPage = Math.min(Math.max(page, 0), totalPages - 1);

  const start = clampedPage * TRACKS_PER_PAGE;
  const pageTracks = tracks.slice(start, start + TRACKS_PER_PAGE);

  const embed = new EmbedBuilder()
    .setTitle(`Editing "${playlistName}"`)
    .setDescription(
      pageTracks.length
        ? pageTracks.map((title, index) => `${start + index + 1}. ${title}`).join("\n")
        : "There are no tracks, why not add some?",
    )
    .setFooter({ text: `Page ${clampedPage + 1}/${totalPages} • ${tracks.length} tracks` });

  const pageRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("panel:editor-prev-page")
      .setLabel("Previous Page")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(clampedPage <= 0),
    new ButtonBuilder()
      .setCustomId("panel:editor-next-page")
      .setLabel("Next Page")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(clampedPage >= totalPages - 1),
  );

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("panel:play-this-playlist")
      .setLabel("Play")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("panel:delete-playlist")
      .setLabel("Delete Playlist")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("panel:editor-back").setLabel("Back").setStyle(ButtonStyle.Secondary),
  );

  const components: ActionRowBuilder<any>[] = [pageRow, actionRow];

  const availableTracks = listUniqueTracks()
    .filter((title) => !tracks.includes(title))
    .slice(0, 25);
  if (availableTracks.length) {
    const addSelect = new StringSelectMenuBuilder()
      .setCustomId("panel:add-track")
      .setPlaceholder("Add a track...")
      .addOptions(availableTracks.map((title) => ({ label: title, value: title })));
    components.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(addSelect));
  }

  if (pageTracks.length) {
    const removeSelect = new StringSelectMenuBuilder()
      .setCustomId("panel:remove-track")
      .setPlaceholder("Remove a track...")
      .addOptions(pageTracks.slice(0, 25).map((title) => ({ label: title, value: title })));
    components.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(removeSelect));
  }

  return { embeds: [embed], components: components.slice(0, 5) };
}
