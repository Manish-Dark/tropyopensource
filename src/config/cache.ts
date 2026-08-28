import { Bulk, connect, Redis } from "../../deps.ts";
import { Logger } from "../Helpers/Logger.ts";
import { CONSTANTS } from "../utils.ts";

const enableCache: boolean = Deno.env.get("ENABLE_REDIS") === "true";

// https://developer.redis.com/develop/deno/
class CacheProvider {
  private static instance: CacheProvider;
  public client: Redis | null = null;

  private constructor() {}

  static getInstance(): CacheProvider {
    if (!CacheProvider.instance) {
      CacheProvider.instance = new CacheProvider();
    }
    return CacheProvider.instance;
  }

  async connect(): Promise<void> {
    const isEnabled = Deno.env.get("ENABLE_REDIS") === "true";
    const host = Deno.env.get("REDIS_HOST");
    if (!isEnabled || !host || host.trim() === "") {
      this.client = null;
      return;
    }
    try {
      const isUpstash = host.includes("upstash.io");
      const useTls = isUpstash || Deno.env.get("REDIS_TLS") === "true";
      this.client = await connect({
        hostname: host,
        port: Number(Deno.env.get("REDIS_PORT")) || 6379,
        username: Deno.env.get("REDIS_USERNAME") || undefined,
        password: Deno.env.get("REDIS_PASSWORD") || undefined,
        tls: useTls,
      });
    } catch (e: any) {
      Logger.error(`Redis connection failed: ${e?.message ?? e}`);
      this.client = null;
    }
  }

  async get(key: string): Promise<Bulk | undefined> {
    if (Deno.env.get("ENABLE_REDIS") !== "true") return undefined;

    try {
      if (!this.client) {
        await this.connect();
      }
      if (!this.client) return undefined;
      return await this.client.get(key);
    } catch (e: any) {
      Logger.error(`Redis get error: ${e?.message ?? e}`);
      this.client = null;
      return undefined;
    }
  }

  async set(key: string, value: string): Promise<void> {
    if (Deno.env.get("ENABLE_REDIS") !== "true") return;

    try {
      if (!this.client) {
        await this.connect();
      }
      if (!this.client) return;
      await this.client.set(key, value, {
        px: CONSTANTS.REDIS_TTL,
      });
    } catch (e: any) {
      Logger.error(`Failed to set cache: ${e?.message ?? e}`);
      this.client = null;
    }
  }

  async del(key: string): Promise<void> {
    if (Deno.env.get("ENABLE_REDIS") !== "true") return;

    try {
      if (!this.client) {
        await this.connect();
      }
      if (!this.client) return;
      await this.client.del(key);
    } catch (e: any) {
      Logger.error(`Failed to delete cache: ${e?.message ?? e}`);
      this.client = null;
    }
  }
}

export const cacheProvider = CacheProvider.getInstance();
