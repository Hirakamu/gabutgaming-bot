import fs from "node:fs";
import path from "node:path";

const MUSIC_DIR = path.join(__dirname, "..", "..", "music");
const SUPPORTED_EXTENSIONS = new Set([".mp3", ".wav", ".ogg", ".flac", ".m4a", ".opus"]);

export interface Track {
  title: string;
  filePath: string;
}

export function listTracks(): string[] {
  if (!fs.existsSync(MUSIC_DIR)) return [];
  return fs
    .readdirSync(MUSIC_DIR)
    .filter((file) => SUPPORTED_EXTENSIONS.has(path.extname(file).toLowerCase()))
    .map((file) => path.parse(file).name);
}

export function listUniqueTracks(): string[] {
  return Array.from(new Set(listTracks()));
}

export function resolveTrack(query: string): Track | null {
  if (!fs.existsSync(MUSIC_DIR)) return null;

  const files = fs
    .readdirSync(MUSIC_DIR)
    .filter((file) => SUPPORTED_EXTENSIONS.has(path.extname(file).toLowerCase()));

  const match =
    files.find((file) => path.parse(file).name.toLowerCase() === query.toLowerCase()) ??
    files.find((file) => path.parse(file).name.toLowerCase().includes(query.toLowerCase()));

  if (!match) return null;

  return {
    title: path.parse(match).name,
    filePath: path.join(MUSIC_DIR, match),
  };
}
