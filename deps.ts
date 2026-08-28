/// <reference path="./deno.d.ts" />
import { Soxa as ServiceProvider } from "https://deno.land/x/soxa@1.4/src/core/Soxa.ts";
import { defaults } from "https://deno.land/x/soxa@1.4/src/defaults.ts";
import { assertEquals, assertRejects } from "jsr:@std/assert@^1.0.0";
import { assertSpyCalls, returnsNext, spy, stub } from "jsr:@std/testing@^1.0.0/mock";

export { type Bulk, connect, type Redis } from "https://deno.land/x/redis@v0.31.0/mod.ts";

import { CONSTANTS } from "./src/utils.ts";

const baseURL = Deno.env.get("GITHUB_API") || CONSTANTS.DEFAULT_GITHUB_API;

const soxa = new ServiceProvider({
  ...defaults,
  baseURL,
});

export {
  assertEquals,
  assertRejects,
  assertSpyCalls,
  returnsNext,
  soxa,
  spy,
  stub,
};
