import { schedule } from "node-cron"
import { getLastCommits } from "./cron.ts";
import { bot } from "./discord.ts";

// Schedule the task to run every 3 hours
const task = schedule("0 */3 * * *", async () => {
    try {
        await getLastCommits();
    } catch (error) {
        bot.logger.error("Error fetching last commits:", error);
    }
}, {
    timezone: "UTC",
    noOverlap: true
});

// Immediately execute the task once on startup
await task.execute();
