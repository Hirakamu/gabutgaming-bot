import type { AutocompleteInteraction, ChatInputCommandInteraction } from "discord.js";

export interface Command {
  data: {
    name: string;
    toJSON: () => unknown;
  };
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
}

declare module "discord.js" {
  interface Client {
    commands: Map<string, Command>;
  }
}
