
import { GITHUB_TOKEN } from "./env.ts";
import { Octokit } from "octokit"
import type { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";

export const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});

export type Commit = RestEndpointMethodTypes["repos"]["listCommits"]["response"]["data"][number];
export type AssociatedPr = RestEndpointMethodTypes["repos"]["listPullRequestsAssociatedWithCommit"]["response"]["data"][number];

