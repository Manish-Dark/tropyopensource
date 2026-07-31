/// <reference path="./deno.d.ts" />
import { load } from "@std/dotenv";

try {
  await load({ export: true });
} catch {
  // Ignore missing .env file
}

import requestHandler from "./api/index.ts";

Deno.serve({ port: Number(Deno.env.get("PORT")) || 8080 }, requestHandler);


