import { soxa } from "../../deps.ts";
import {
  EServiceKindError,
  GithubError,
  QueryDefaultResponse,
  ServiceError,
} from "../Types/index.ts";

export async function requestGithubData<T = unknown>(
  query: string,
  variables: { [key: string]: string },
  token = "",
) {
  let response;
  try {
    response = await soxa.post("", {}, {
      data: { query, variables },
      headers: {
        Authorization: `bearer ${token}`,
      },
    }) as QueryDefaultResponse<{ user: T }>;
  } catch (soxaErr: any) {
    const resData = soxaErr?.response?.data;
    const msg = resData?.message || soxaErr?.message || "Failed to communicate with GitHub API";
    const status = soxaErr?.response?.status;

    if (status === 401 || msg.toLowerCase().includes("bad credentials")) {
      throw new ServiceError(
        "Invalid or missing GitHub API token (401 Bad Credentials). Please check your GITHUB_TOKEN1 environment variable on Vercel.",
        EServiceKindError.UPSTREAM,
      );
    }

    if (status === 403 || msg.toLowerCase().includes("rate limit")) {
      throw new ServiceError(
        `GitHub API rate limit exceeded: ${msg}`,
        EServiceKindError.RATE_LIMIT,
      );
    }

    throw new ServiceError(
      `GitHub API Error (${status || "Network"}): ${msg}`,
      EServiceKindError.UPSTREAM,
    );
  }

  const responseData = response.data;

  if (responseData?.errors?.length) {
    console.error(
      "GitHub GraphQL errors:",
      JSON.stringify(responseData.errors, null, 2),
    );

    throw new ServiceError(
      responseData.errors
        .map((error) => error.message)
        .join("; "),
      getGraphQLErrorKind(responseData.errors),
    );
  }

  if (responseData?.data?.user) {
    return responseData.data.user;
  }

  throw handleError(responseData);
}

function getGraphQLErrorKind(errors: GithubError[]): EServiceKindError {
  const errorTypes = errors.map((error) => error.type);

  if (
    errorTypes.some((type) => type?.includes(EServiceKindError.RATE_LIMIT))
  ) {
    return EServiceKindError.RATE_LIMIT;
  }

  if (errorTypes.every((type) => type === EServiceKindError.NOT_FOUND)) {
    return EServiceKindError.NOT_FOUND;
  }

  return EServiceKindError.UPSTREAM;
}

function handleError(
  responseData: {
    data?: unknown;
    errors?: GithubError[];
    message?: string;
    documentation_url?: string;
  },
): ServiceError {
  let isRateLimitExceeded = false;
  const arrayErrors = responseData?.errors || [];

  if (Array.isArray(arrayErrors) && arrayErrors.length > 0) {
    isRateLimitExceeded = arrayErrors.some((error) =>
      error.type.includes(EServiceKindError.RATE_LIMIT)
    );
  }

  if (responseData?.message) {
    isRateLimitExceeded = responseData.message.toLowerCase().includes(
      "rate limit",
    );
  }

  if (isRateLimitExceeded) {
    throw new ServiceError(
      "Rate limit exceeded",
      EServiceKindError.RATE_LIMIT,
    );
  }

  throw new ServiceError(
    "unknown error",
    EServiceKindError.NOT_FOUND,
  );
}
