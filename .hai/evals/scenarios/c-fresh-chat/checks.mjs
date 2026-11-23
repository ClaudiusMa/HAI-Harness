// Scenario C: scenario A's requests with a session break after request 1. Request-1
// checks carry the `request1` tag, so their failures are the lost requirements.
import { browser, cancelEditBrowser, request1, request2, request3, unrelated } from "../../lib/clay-club-checks.mjs";

export const checks = [...request1, ...request2, ...request3, unrelated, cancelEditBrowser, ...browser];

export function metrics({ record }) {
  const second = record.turns.filter((t) => t.session === 1);
  const firstEdit = second.findIndex((t) => t.changed.length > 0);
  return {
    lostRequirements: record.metrics.failed_request1 ?? 0,
    session2Seconds: Math.round(second.reduce((a, t) => a + (t.ms ?? 0), 0) / 100) / 10,
    // Agent calls in the new session before the first one that changed a file.
    session2CallsBeforeFirstEdit: firstEdit < 0 ? second.length : firstEdit
  };
}
