/// <reference path="../../../deno.d.ts" />
import { assertEquals, assertRejects } from "jsr:@std/assert@^1.0.0";
import { stub } from "jsr:@std/testing@^1.0.0/mock";
import { soxa } from "../../../deps.ts";
import { EServiceKindError, ServiceError } from "../../Types/index.ts";
import { requestGithubData } from "../request.ts";

Deno.test("requestGithubData rejects partial GraphQL responses", async () => {
  const post = stub(soxa, "post", () => {
    return Promise.resolve({
      data: {
        data: { user: { login: "test" } },
        errors: [{ message: "Field access failed", type: "FORBIDDEN" }],
      },
    });
  });

  try {
    const error = await assertRejects(
      () => requestGithubData("query { viewer { login } }", {}),
      ServiceError,
      "Field access failed",
    ) as ServiceError;

    assertEquals(error.cause, EServiceKindError.UPSTREAM);
    assertEquals(error.code, 502);
  } finally {
    post.restore();
  }
});
