import type { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";
import dedent from "dedent";
import { Octokit } from "octokit";
import { GITHUB_TOKEN } from "./env.ts";

export const octokit = new Octokit({
    auth: GITHUB_TOKEN,
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

    const { data: issue } = await octokit.rest.issues.create({
        owner: "discordeno",
        repo: "discordeno",
        title: `[api-docs] ${issueName}`,
        body: issueBody,
        labels: ["api-docs-commits"],
    });

    return issue;
}

function sanitizeBody(body: string): string {
    // Replace mentions with code formatting, to avoid mentioning users
    return body.replace(/@([\w]+)/, "[`@$1`](https://github.com/$1)");
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
