import "dotenv/config";
import { REST, Routes } from "discord.js";
import { commands } from "./commands";

const body = commands.map((command) => command.data.toJSON());

const { DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
  throw new Error("Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in environment");
}

const rest = new REST().setToken(DISCORD_TOKEN);

async function deploy() {
  const route = DISCORD_GUILD_ID
    ? Routes.applicationGuildCommands(DISCORD_CLIENT_ID as string, DISCORD_GUILD_ID)
    : Routes.applicationCommands(DISCORD_CLIENT_ID as string);

  const data = (await rest.put(route, { body })) as unknown[];
  console.log(`Successfully deployed ${data.length} application command(s).`);
}

deploy().catch(console.error);
