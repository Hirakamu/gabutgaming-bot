import type { ButtonInteraction, ModalSubmitInteraction, StringSelectMenuInteraction } from "discord.js";
import { resolveTrack } from "./library";
import { getPanelView, setPanelView, type PanelView } from "./panelState";
import { renderPanel } from "./panelView";
import {
  enqueueTracks,
  finishQueue,
  getStatus,
  pauseTrack,
  previousTrack,
  resumeTrack,
  rewindTrack,
  skipTrack,
  stopPlayback,
} from "./player";
import { addTrackToPlaylist, createPlaylist, deletePlaylist, getPlaylist, removeTrackFromPlaylist } from "./playlists";

const TRACKS_PER_PAGE = 10;

function lastPage(trackCount: number): number {
  return Math.max(0, Math.ceil(trackCount / TRACKS_PER_PAGE) - 1);
}

export async function handlePanelButton(interaction: ButtonInteraction): Promise<void> {
  const messageId = interaction.message.id;
  const view = getPanelView(messageId);

  switch (interaction.customId) {
    case "panel:previous":
      previousTrack();
      break;

    case "panel:toggle": {
      const status = getStatus();
      if (status.paused) {
        resumeTrack();
      } else {
        pauseTrack();
      }
      break;
    }

    case "panel:skip":
      skipTrack();
      break;

    case "panel:rewind":
      rewindTrack();
      break;

    case "panel:stop":
      stopPlayback();
      break;

    case "panel:finish":
      finishQueue();
      break;

    case "panel:refresh":
      break;

    case "panel:playlists":
      setPanelView(messageId, { mode: "playlistChooser" });
      break;

    case "panel:back-to-player":
      setPanelView(messageId, { mode: "player" });
      break;

    case "panel:new-playlist": {
      await interaction.showModal({
        customId: "panel:create-playlist-modal",
        title: "Create playlist",
        components: [
          {
            type: 1,
            components: [
              {
                type: 4,
                customId: "panel:playlist-name",
                label: "Playlist name",
                style: 1,
                required: true,
              },
            ],
          },
        ],
      });
      return;
    }

    case "panel:editor-prev-page": {
      if (view.mode === "playlistEditor") {
        setPanelView(messageId, { ...view, page: Math.max(0, view.page - 1) });
      }
      break;
    }

    case "panel:editor-next-page": {
      if (view.mode === "playlistEditor") {
        const playlist = getPlaylist(view.playlistName);
        const max = lastPage(playlist?.tracks.length ?? 0);
        setPanelView(messageId, { ...view, page: Math.min(max, view.page + 1) });
      }
      break;
    }

    case "panel:play-this-playlist": {
      if (view.mode === "playlistEditor") {
        const playlist = getPlaylist(view.playlistName);
        if (playlist) {
          const resolved = playlist.tracks
            .map((title) => resolveTrack(title))
            .filter((track): track is NonNullable<typeof track> => track !== null);
          if (resolved.length) enqueueTracks(resolved);
        }
      }
      break;
    }

    case "panel:delete-playlist": {
      if (view.mode === "playlistEditor") {
        deletePlaylist(view.playlistName);
        setPanelView(messageId, { mode: "playlistChooser" });
      }
      break;
    }

    case "panel:editor-back":
      setPanelView(messageId, { mode: "playlistChooser" });
      break;

    default:
      break;
  }

  await interaction.update(renderPanel(getPanelView(messageId)));
}

export async function handlePanelSelectMenu(interaction: StringSelectMenuInteraction): Promise<void> {
  const messageId = interaction.message.id;
  const view = getPanelView(messageId);
  const value = interaction.values[0];

  switch (interaction.customId) {
    case "panel:play-playlist": {
      const playlist = getPlaylist(value);
      if (playlist) {
        const resolved = playlist.tracks
          .map((title) => resolveTrack(title))
          .filter((track): track is NonNullable<typeof track> => track !== null);
        if (resolved.length) enqueueTracks(resolved);
      }
      break;
    }

    case "panel:choose-playlist": {
      setPanelView(messageId, { mode: "playlistEditor", playlistName: value, page: 0 });
      break;
    }

    case "panel:add-track": {
      if (view.mode === "playlistEditor") {
        addTrackToPlaylist(view.playlistName, value);
      }
      break;
    }

    case "panel:remove-track": {
      if (view.mode === "playlistEditor") {
        removeTrackFromPlaylist(view.playlistName, value);
        const playlist = getPlaylist(view.playlistName);
        const max = lastPage(playlist?.tracks.length ?? 0);
        if (view.page > max) setPanelView(messageId, { ...view, page: max });
      }
      break;
    }

    default:
      break;
  }

  await interaction.update(renderPanel(getPanelView(messageId)));
}

export async function handlePanelModalSubmit(interaction: ModalSubmitInteraction): Promise<void> {
  if (interaction.customId !== "panel:create-playlist-modal") return;

  const name = interaction.fields.getTextInputValue("panel:playlist-name").trim();
  const playlist = name ? createPlaylist(name) : null;

  if (!interaction.isFromMessage()) {
    if (playlist) {
      await interaction.reply({
        content: `Created playlist "${playlist.name}". Press Refresh on the panel to see it.`,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: `Could not create playlist "${name}" (empty name or already exists).`,
        ephemeral: true,
      });
    }
    return;
  }

  const messageId = interaction.message.id;
  const view: PanelView = playlist
    ? { mode: "playlistEditor", playlistName: playlist.name, page: 0 }
    : getPanelView(messageId);

  setPanelView(messageId, view);
  await interaction.update(renderPanel(view));
}
