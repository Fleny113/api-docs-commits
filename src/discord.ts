import { ButtonStyles, createBot, MessageComponentTypes, MessageFlags, type ActionRow } from "@discordeno/bot";
import { DISCORD_CHANNEL_ID, DISCORD_TOKEN } from "./env.ts";
import type { AssociatedPr, Commit } from "./github.ts";
import assert from "node:assert";

export const bot = createBot({
  token: DISCORD_TOKEN,
});

export async function sendCommitMessage(commit: Commit, pr?: AssociatedPr) {
    const [commitMessage, ...commitDetails] = commit.commit.message.split('\n');

    const title = pr?.title || commitMessage;
    const details = pr?.body?.trim() || commitDetails.join('\n').trim() || "*No description provided.*";

    assert(title, "PR or commit title should exist");
    const truncatedDetails = details.length > 2000 ? `${details.slice(0, 2000)}...` : details;

    const actionRow: ActionRow = {
        type: MessageComponentTypes.ActionRow,
        components: [
            {
                type: MessageComponentTypes.Button,
                style: ButtonStyles.Link,
                label: "Commit",
                url: commit.html_url
            },
        ]
    };

    if (pr) {
        actionRow.components.push({
            type: MessageComponentTypes.Button,
            style: ButtonStyles.Link,
            label: "Pull Request",
            url: pr?.html_url
        });
    }

    await bot.rest.sendMessage(DISCORD_CHANNEL_ID, {
        components: [
            {
                type: MessageComponentTypes.Container,
                components: [
                    {
                        type: MessageComponentTypes.TextDisplay,
                        content: "## New Discord Api Docs commit"
                    },
                    {
                        type: MessageComponentTypes.TextDisplay,
                        content: `### ${title.trim()}`
                    },
                    {
                        type: MessageComponentTypes.TextDisplay,
                        content: truncatedDetails
                    },
                    actionRow
                ]
            }
        ],
        flags: MessageFlags.IsComponentV2,
    });
}
