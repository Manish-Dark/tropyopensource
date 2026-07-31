import { EServiceKindError, ServiceError } from "../Types/index.ts";
import { Error400, Error404, Error419, Error502 } from "../error_page.ts";

interface ErrorPageProps {
  error: ServiceError;
}

export function ErrorPage({ error }: ErrorPageProps) {
  let cause: Error400 | Error404 | Error419 | Error502;

  if (error.cause === EServiceKindError.RATE_LIMIT) {
    cause = new Error419(
      error.message || "GitHub API rate limit exceeded.",
    );
  } else if (error.cause === EServiceKindError.NOT_FOUND) {
    cause = new Error404(
      error.message || "Sorry, the user you are looking for was not found.",
    );
  } else if (error.cause === EServiceKindError.UPSTREAM) {
    cause = new Error502(
      error.message || "GitHub returned an unexpected response.",
    );
  } else {
    cause = new Error400(
      error.message || "Bad Request.",
    );
  }

  return cause;
}
