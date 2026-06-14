import assert from "node:assert";
import type { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";
import { retry as retryOctokitPlugin } from "@octokit/plugin-retry";
import { throttling as throttlingOctokitPlugin } from "@octokit/plugin-throttling";
import { Octokit as RestOctokit } from "@octokit/rest";
import dedent from "dedent";
import { GITHUB_ISSUE_REPO, GITHUB_TOKEN } from "./env.ts";
import { createLogger, LogLevel } from "./logger.ts";

const Octokit = RestOctokit.plugin(
    octokit => ({
        request: octokit.request.defaults({
            headers: {
                "x-github-api-version": "2026-03-10",
            },
        }),
    }),
    retryOctokitPlugin,
    throttlingOctokitPlugin,
);

export const octokit = new Octokit({
    auth: GITHUB_TOKEN,
    userAgent: "discordeno-api-docs-commits/v1.0.0",
    log: createLogger("@octokit/rest", LogLevel.Warn),
    // @octokit/request options
    request: {
        log: createLogger("@octokit/request", LogLevel.Info),
    },
    // @octokit/throttling options
    throttle: {
        // default config from the octokit package
        onRateLimit: (retryAfter, options, octokit) => {
            octokit.log.warn(`Request quota exhausted for request ${options.method} ${options.url}`);

            if (options.request.retryCount === 0) {
                // only retries once
                octokit.log.info(`Retrying after ${retryAfter} seconds!`);
                return true;
            }
        },
        onSecondaryRateLimit: (retryAfter, options, octokit) => {
            octokit.log.warn(`SecondaryRateLimit detected for request ${options.method} ${options.url}`);

            if (options.request.retryCount === 0) {
                // only retries once
                octokit.log.info(`Retrying after ${retryAfter} seconds!`);
                return true;
            }
        },
    },
});

export async function createCommitIssue(commit: Commit, pr?: AssociatedPr): Promise<Issue> {
    const [commitTitle, ...commitDetails] = commit.commit.message.split("\n");
    const issueName = pr?.title || commitTitle;

    const issueBody = pr
        ? dedent`
            A new pull request has been merged in the discord/discord-api-docs repo: [${pr.title} #${pr.number}](${useRedirectGithub(pr.html_url)})

            ${sanitizeBody(pr.body ?? "")}

            ###### This is a bot generated issue
            `
        : dedent`
            A new commit has been made in the discord/discord-api-docs repo: [${commitTitle} @\`${commit.sha.slice(0, 7)}\`](${commit.html_url})

            ${sanitizeBody(commitDetails.join("\n"))}

            ###### This is a bot generated issue
            `;

    const [owner, repo] = GITHUB_ISSUE_REPO.split("/", 2);
    assert(owner, "The owner of the repo should exist");
    assert(repo, "The repo name should exist");

    const { data: issue } = await octokit.rest.issues.create({
        owner,
        repo,
        title: `[api-docs] ${issueName}`,
        body: issueBody,
        labels: ["api-docs-commits"],
    });

    return issue;
}

function sanitizeBody(body: string): string {
    return (
        body
            // Replace mentions with code formatting, to avoid mentioning users
            .replace(/@([\w]+)/, "[`@$1`](https://github.com/$1)")
            // Use redirect.github.com to avoid spamming the original links with references
            .replace("https://github.com/", "https://redirect.github.com/")
    );
}

function useRedirectGithub(link: string): string {
    const url = new URL(link);

    // We don't want to spam the original link with references, so we use redirect.github.com
    if (url.host === "github.com") url.host = "redirect.github.com";

    return url.href;
}

export type Commit = RestEndpointMethodTypes["repos"]["listCommits"]["response"]["data"][number];
export type AssociatedPr =
    RestEndpointMethodTypes["repos"]["listPullRequestsAssociatedWithCommit"]["response"]["data"][number];
export type Issue = RestEndpointMethodTypes["issues"]["create"]["response"]["data"];
