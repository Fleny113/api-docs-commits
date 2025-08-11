export const DISCORD_TOKEN = process.env.DISCORD_TOKEN ?? "";
if (!DISCORD_TOKEN) throw new Error("DISCORD_TOKEN is not set");

export const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID ? BigInt(process.env.DISCORD_CHANNEL_ID) : 0n;
if (!DISCORD_CHANNEL_ID) throw new Error("DISCORD_CHANNEL_ID is not set");

export const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? "";
if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN is not set");

export const GITHUB_ISSUE_REPO = process.env.GITHUB_ISSUE_REPO ?? "discordeno/discordeno";
