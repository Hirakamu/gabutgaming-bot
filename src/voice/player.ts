import {
  AudioPlayer,
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  StreamType,
  VoiceConnection,
} from "@discordjs/voice";
import fs from "node:fs";
import type { Track } from "./library";

const MAX_HISTORY = 50;

const player: AudioPlayer = createAudioPlayer();
const queue: Track[] = [];
const history: Track[] = [];

let currentTrack: Track | null = null;
let playing = false;
let skipHistoryOnNextAdvance = false;

player.on(AudioPlayerStatus.Idle, () => {
  advanceQueue();
});

player.on("error", (error) => {
  console.error("Audio player error:", error);
  advanceQueue();
});

export function subscribePlayer(connection: VoiceConnection): void {
  connection.subscribe(player);
}

export function enqueueTrack(track: Track): void {
  queue.push(track);
  if (!playing) advanceQueue();
}

export function enqueueTracks(tracks: Track[]): void {
  queue.push(...tracks);
  if (!playing) advanceQueue();
}

export function stopPlayback(): void {
  queue.length = 0;
  history.length = 0;
  currentTrack = null;
  playing = false;
  player.stop();
}

export function finishQueue(): void {
  queue.length = 0;
}

export function pauseTrack(): boolean {
  if (!playing) return false;
  return player.pause();
}

export function resumeTrack(): boolean {
  if (!currentTrack) return false;
  return player.unpause();
}

export function skipTrack(): boolean {
  if (!currentTrack) return false;
  player.stop();
  return true;
}

export function rewindTrack(): boolean {
  if (!currentTrack) return false;
  startTrack(currentTrack);
  return true;
}

export function previousTrack(): boolean {
  const prev = history.pop();
  if (!prev) return false;

  if (currentTrack) queue.unshift(currentTrack);
  queue.unshift(prev);
  skipHistoryOnNextAdvance = true;
  player.stop();
  return true;
}

export function getQueue(): readonly Track[] {
  return queue;
}

export function getHistory(): readonly Track[] {
  return history;
}

export function getStatus(): { current: string | null; paused: boolean; queue: string[] } {
  return {
    current: currentTrack?.title ?? null,
    paused: player.state.status === AudioPlayerStatus.Paused,
    queue: queue.map((track) => track.title),
  };
}

function advanceQueue(): void {
  if (currentTrack && !skipHistoryOnNextAdvance) {
    history.push(currentTrack);
    if (history.length > MAX_HISTORY) history.shift();
  }
  skipHistoryOnNextAdvance = false;

  const next = queue.shift();
  currentTrack = next ?? null;
  if (!next) {
    playing = false;
    return;
  }
  startTrack(next);
}

function startTrack(track: Track): void {
  currentTrack = track;
  playing = true;
  const stream = fs.createReadStream(track.filePath);
  const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary });
  player.play(resource);
}
