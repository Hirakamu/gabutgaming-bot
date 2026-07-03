import type { Command } from "../types";
import { command as ping } from "./ping";
import { command as play } from "./play";
import { command as playlist } from "./playlist";
import { command as pause } from "./pause";
import { command as resume } from "./resume";
import { command as skip } from "./skip";
import { command as previous } from "./previous";
import { command as rewind } from "./rewind";
import { command as finish } from "./finish";
import { command as nowplaying } from "./nowplaying";
import { command as stop } from "./stop";
import { command as panel } from "./panel";

export const commands: Command[] = [
  ping,
  play,
  playlist,
  pause,
  resume,
  skip,
  previous,
  rewind,
  finish,
  nowplaying,
  stop,
  panel,
];
