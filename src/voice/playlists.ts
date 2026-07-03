import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const PLAYLISTS_FILE = path.join(DATA_DIR, "playlists.json");

export interface Playlist {
  name: string;
  tracks: string[];
}

type PlaylistStore = Record<string, Playlist>;

const store: PlaylistStore = load();

function load(): PlaylistStore {
  if (!fs.existsSync(PLAYLISTS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(PLAYLISTS_FILE, "utf8"));
  } catch {
    return {};
  }
}

function save(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(PLAYLISTS_FILE, JSON.stringify(store, null, 2));
}

function key(name: string): string {
  return name.trim().toLowerCase();
}

export function listPlaylists(): Playlist[] {
  return Object.values(store);
}

export function getPlaylist(name: string): Playlist | null {
  return store[key(name)] ?? null;
}

export function createPlaylist(name: string): Playlist | null {
  const k = key(name);
  if (!k || store[k]) return null;

  const playlist: Playlist = { name: name.trim(), tracks: [] };
  store[k] = playlist;
  save();
  return playlist;
}

export function deletePlaylist(name: string): boolean {
  const k = key(name);
  if (!store[k]) return false;

  delete store[k];
  save();
  return true;
}

export function addTrackToPlaylist(name: string, trackTitle: string): Playlist | null {
  const playlist = store[key(name)];
  if (!playlist) return null;

  if (!playlist.tracks.includes(trackTitle)) playlist.tracks.push(trackTitle);
  save();
  return playlist;
}

export function removeTrackFromPlaylist(name: string, trackTitle: string): Playlist | null {
  const playlist = store[key(name)];
  if (!playlist) return null;

  playlist.tracks = playlist.tracks.filter((title) => title !== trackTitle);
  save();
  return playlist;
}
