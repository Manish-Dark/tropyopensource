/// <reference path="../../../deno.d.ts" />
import { Retry } from "../Retry.ts";
import { assertEquals, assertRejects } from "jsr:@std/assert@^1.0.0";
import { assertSpyCalls, spy } from "jsr:@std/testing@^1.0.0/mock";

type MockResponse = {
  value: number;
};

Deno.test("Retry.fetch", () => {
  const retryInstance = new Retry();
  const callback = spy(retryInstance, "fetch");

  retryInstance.fetch<MockResponse>(() => {
    return { value: 1 };
  });

  assertSpyCalls(callback, 1);
});

Deno.test("Should retry", async () => {
  let countErrors = 0;

  const callbackError = () => {
    countErrors++;
    throw new Error("Panic! Threw Error");
  };
  const retries = 3;
  const retryInstance = new Retry(retries);

  await assertRejects(
    () => {
      return retryInstance.fetch<MockResponse>(callbackError);
    },
    Error,
    `Max retries (${retries}) exceeded.`,
  );

  assertEquals(countErrors, 3);
});

Deno.test("Should retry the asyncronous callback", async () => {
  let countErrors = 0;
  const callbackError = async () => {
    countErrors++;
    // Mock request in callback
    await new Promise((_, reject) => setTimeout(reject, 100));
  };

  const retries = 3;
  const retryInstance = new Retry(retries);

  await assertRejects(
    () => {
      return retryInstance.fetch(callbackError);
    },
    Error,
    `Max retries (${retries}) exceeded.`,
  );

  assertEquals(countErrors, 3);
});
