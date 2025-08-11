import { schedule } from "node-cron";
import { getLastCommits } from "./cron.ts";
import { logger } from "./logger.ts";

// Schedule the task to run every 6 hours
const task = schedule(
    "0 */6 * * *",
    async () => {
        try {
            await getLastCommits();
        } catch (error) {
            logger.error("Error fetching last commits:", error);
        }
    },
    {
        timezone: "UTC",
        noOverlap: true,
    },
);

// Immediately execute the task once on startup
await task.execute();
