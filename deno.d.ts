// Ambient global declaration for Deno namespace & module imports to satisfy VS Code / TypeScript IDE language server
declare namespace Deno {
  export const args: string[];
  export function exit(code?: number): never;
  export function mkdir(path: string | URL, options?: { recursive?: boolean }): Promise<void>;
  export function writeTextFile(path: string | URL, data: string): Promise<void>;
  export function statSync(path: string | URL): { isFile: boolean; isDirectory: boolean; mtime: Date | null };
  export function stat(path: string | URL): Promise<{ isFile: boolean; isDirectory: boolean; mtime: Date | null }>;
  export function readFileSync(path: string | URL): Uint8Array;
  export function readDirSync(path: string | URL): Iterable<{ name: string }>;
  export function removeSync(path: string | URL): void;
  export function writeFile(path: string | URL, data: Uint8Array, options?: { create?: boolean }): Promise<void>;
  export function serve(options: { port?: number }, handler: (request: Request) => Promise<Response> | Response): any;
  export function serve(handler: (request: Request) => Promise<Response> | Response, options?: { port?: number }): any;
  export const env: {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
  };
  export function test(name: string, fn: (...args: any[]) => any): void;
  export function test(options: { name: string; fn: (...args: any[]) => any }): void;
  export function test(name: string, options: any, fn: (...args: any[]) => any): void;
}

declare module "@std/dotenv" {
  export function load(options?: { export?: boolean; envPath?: string; examplePath?: string }): Promise<Record<string, string>>;
}

declare module "@std/dotenv/load" {}

declare module "@std/http/server" {
  export function serve(handler: any, options?: any): any;
}

declare module "soxa/src/core/Soxa.ts" {
  export const Soxa: any;
}

declare module "soxa/src/defaults.ts" {
  export const defaults: any;
}

declare module "redis" {
  export type Bulk = any;
  export type Redis = any;
  export function connect(options: any): Promise<any>;
}

declare module "@std/assert" {
  export function assertEquals(actual: any, expected: any, msg?: string): void;
  export function assertRejects(fn: () => Promise<any>, ErrorClass?: any, msg?: string): Promise<any>;
}

declare module "@std/testing/mock" {
  export function assertSpyCalls(spy: any, expectedCalls: number): void;
  export function returnsNext(values: any[]): any;
  export function spy(...args: any[]): any;
  export function stub(...args: any[]): any;
}
