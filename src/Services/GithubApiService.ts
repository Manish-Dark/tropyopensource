import { GithubRepository } from "../Repository/GithubRepository.ts";
import {
  GitHubUserActivity,
  GitHubUserAll,
  GitHubUserIssue,
  GitHubUserPullRequest,
  GitHubUserRepository,
  UserInfo,
} from "../user_info.ts";
import {
  queryUserActivity,
  queryUserAll,
  queryUserIssue,
  queryUserPullRequest,
  queryUserRepository,
} from "../Schemas/index.ts";
import { Retry } from "../Helpers/Retry.ts";
import { CONSTANTS } from "../utils.ts";
import { EServiceKindError, ServiceError } from "../Types/index.ts";
import { Logger } from "../Helpers/Logger.ts";
import { requestGithubData } from "./request.ts";

// Dynamically retrieve available GitHub API tokens from environment variables
export function getTokens(): string[] {
  const envTokens = [
    Deno.env.get("GITHUB_TOKEN1"),
    Deno.env.get("GITHUB_TOKEN2"),
    Deno.env.get("GITHUB_TOKEN"),
    Deno.env.get("GH_TOKEN"),
    Deno.env.get("PAT"),
  ].filter((token): token is string => Boolean(token && token.trim().length > 0));

  if (envTokens.length > 0) {
    return envTokens;
  }

  // Default to 2 token slots if no env tokens are defined (allows retries & test mocks to function)
  return [
    Deno.env.get("GITHUB_TOKEN1") ?? "",
    Deno.env.get("GITHUB_TOKEN2") ?? "",
  ];
}

export const TOKENS = new Proxy([] as string[], {
  get(_target, prop) {
    const currentTokens = getTokens();
    if (prop === "length") return currentTokens.length;
    if (typeof prop === "string" && !isNaN(Number(prop))) {
      return currentTokens[Number(prop)];
    }
    const val = (currentTokens as any)[prop];
    return typeof val === "function" ? val.bind(currentTokens) : val;
  },
});

export class GithubApiService extends GithubRepository {
  async requestUserAll(
    username: string,
  ): Promise<GitHubUserAll | ServiceError> {
    return await this.executeQuery<GitHubUserAll>(queryUserAll, {
      username,
    });
  }
  async requestUserRepository(
    username: string,
  ): Promise<GitHubUserRepository | ServiceError> {
    return await this.executeQuery<GitHubUserRepository>(queryUserRepository, {
      username,
    });
  }
  async requestUserActivity(
    username: string,
  ): Promise<GitHubUserActivity | ServiceError> {
    return await this.executeQuery<GitHubUserActivity>(queryUserActivity, {
      username,
    });
  }
  async requestUserIssue(
    username: string,
  ): Promise<GitHubUserIssue | ServiceError> {
    return await this.executeQuery<GitHubUserIssue>(queryUserIssue, {
      username,
    });
  }
  async requestUserPullRequest(
    username: string,
  ): Promise<GitHubUserPullRequest | ServiceError> {
    return await this.executeQuery<GitHubUserPullRequest>(
      queryUserPullRequest,
      { username },
    );
  }
  async requestUserInfo(username: string): Promise<UserInfo | ServiceError> {
    // Use single combined query instead of 4 separate queries to reduce Function Duration
    try {
      const result = await this.requestUserAll(username);
      if (result instanceof ServiceError) {
        return result;
      }
      return UserInfo.fromCombined(result);
    } catch (error: any) {
      const msg = error?.message || `Error fetching user info for username: ${username}`;
      Logger.error(msg);
      return new ServiceError(msg, EServiceKindError.NOT_FOUND);
    }
  }

  async executeQuery<T = unknown>(
    query: string,
    variables: { [key: string]: string },
  ) {
    try {
      const tokens = getTokens();
      const retry = new Retry(
        tokens.length,
        CONSTANTS.DEFAULT_GITHUB_RETRY_DELAY,
      );
      return await retry.fetch<Promise<T>>(async ({ attempt }) => {
        return await requestGithubData(
          query,
          variables,
          tokens[attempt],
        );
      });
    } catch (error: any) {
      if (error instanceof ServiceError) {
        Logger.error(error.message);
        return error;
      }
      if (error instanceof Error && error.cause instanceof ServiceError) {
        Logger.error(error.cause.message);
        return error.cause;
      }
      const msg = error?.message || "An unexpected error occurred while querying GitHub API.";
      Logger.error(msg);
      return new ServiceError(msg, EServiceKindError.UPSTREAM);
    }
  }
}
