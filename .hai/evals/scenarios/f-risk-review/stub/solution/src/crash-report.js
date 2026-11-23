import { readFileSync } from "node:fs";
import { sanitize } from "./sanitize.js";

export const ENDPOINT = "https://crash.glazelog.invalid/v1/reports";
const { version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

// Shared by the page (src/web.js) and the background worker (src/worker.js).
// Returns the request that send() would post; nothing is sent from here.
export function buildCrashReport(error, extra = {}) {
  return {
    url: ENDPOINT,
    method: "POST",
    body: sanitize({ message: String(error?.message ?? error), stack: error?.stack ?? null, version, ...extra })
  };
}
