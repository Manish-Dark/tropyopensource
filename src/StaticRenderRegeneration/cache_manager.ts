import { Logger } from "../Helpers/Logger.ts";
import { existsSync } from "./utils.ts";

export class CacheManager {
  constructor(private revalidateTime: number, private cacheFile: string) {}

  get cacheFilePath(): string {
    return `/tmp/${this.cacheFile}`;
  }

  get cacheFileExists(): boolean {
    return existsSync(this.cacheFilePath);
  }

  get cacheFileLastModified(): Date | null {
    try {
      if (!this.cacheFileExists) {
        return null;
      }
      const fileInfo = Deno.statSync(this.cacheFilePath);
      return fileInfo.mtime ?? null;
    } catch {
      return null;
    }
  }

  get cacheFileLastModifiedGetTime(): number | null {
    try {
      const lastModified = this.cacheFileLastModified;
      if (lastModified === null) {
        return null;
      }
      return lastModified.getTime();
    } catch {
      return null;
    }
  }

  get isCacheValid(): boolean {
    try {
      if (this.cacheFileLastModifiedGetTime === null) {
        return false;
      }
      const currentTime = new Date().getTime();
      return currentTime - this.cacheFileLastModifiedGetTime <
        this.revalidateTime;
    } catch {
      return false;
    }
  }

  async save(response: Response): Promise<void> {
    if (response === null) return;
    try {
      const text = await response.clone().text();
      const data = new TextEncoder().encode(text);
      await Deno.writeFile(this.cacheFilePath, data, { create: true });
    } catch {
      Logger.warn("Failed to save cache file");
    }
  }
}
