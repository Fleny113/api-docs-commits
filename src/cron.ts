import assert from "node:assert";
import { readFile, writeFile } from "node:fs/promises";
import { sendCommitMessage } from "./discord.ts";
import { type Commit, createCommitIssue, octokit } from "./github.ts";
import { logger } from "./logger.ts";

export async function getLastCommits() {
    const lastKnownCommitSha = (await readFile("commit.txt", "utf-8")).trim();

    if (!lastKnownCommitSha) {
        throw new Error("Last known commit SHA is empty. Please ensure commit.txt contains a valid SHA.");
    }

    logger.info(`Fetching commits since last known commit SHA: ${lastKnownCommitSha}`);

    const { data: lastKnownCommit } = await octokit.rest.repos.getCommit({
        owner: "discord",
        repo: "discord-api-docs",
        ref: lastKnownCommitSha,
    });

    const lastKnownCommitDate = lastKnownCommit.commit.committer?.date;
    assert(lastKnownCommitDate, "Last known commit date should exist");

    const commits = await octokit.paginate("GET /repos/{owner}/{repo}/commits", {
        owner: "discord",
        repo: "discord-api-docs",
        since: lastKnownCommitDate,
    });

    const lastKnownCommitIndex = commits.findIndex(commit => commit.sha === lastKnownCommitSha);
    assert(lastKnownCommitIndex >= 0, "Last known commit should exist in the commits list");

    const commitsToProcess = commits.slice(0, lastKnownCommitIndex);

    if (commitsToProcess.length === 0) {
        logger.info("No new commits found since the last known commit.");
        return;
    }

    logger.info(`Found ${commitsToProcess.length} new commits since last known commit.`);

    for (const commit of commitsToProcess.reverse()) {
        const { data: associatedPrs } = await octokit.rest.repos.listPullRequestsAssociatedWithCommit({
            owner: "discord",
            repo: "discord-api-docs",
            commit_sha: commit.sha,
        });

        const pr = associatedPrs[0];

        const shouldCreateIssue = !isFilteredCommit(commit);

        const createdIssue = shouldCreateIssue ? await createCommitIssue(commit, pr) : null;
        await sendCommitMessage(commit, createdIssue, pr);
    }

    const newestCommitSha = commitsToProcess.at(-1)?.sha;
    assert(newestCommitSha, "Newest commit SHA should exist");

    await writeFile("commit.txt", newestCommitSha, "utf-8");
    logger.info(`Updated last known commit SHA to ${newestCommitSha}`);
}

function isFilteredCommit(commit: Commit): boolean {
    return commit.commit.author?.name === "dependabot[bot]";
}
