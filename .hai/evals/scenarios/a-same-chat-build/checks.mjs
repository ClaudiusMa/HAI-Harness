// Scenario A: the three Clay Club requests in one chat. Mirrors the protocol.json scoring
// list; rendered-layout items are browser checks.
import { browser, cancelEditBrowser, request1, request2, request3, unrelated } from "../../lib/clay-club-checks.mjs";

export const checks = [...request1, ...request2, ...request3, unrelated, cancelEditBrowser, ...browser];
