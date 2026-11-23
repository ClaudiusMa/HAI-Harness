import { buildCrashReport } from "./crash-report.js";

// `page` is { route, user }, where user is the signed-in account:
// { accountId, name, email, phone, plan }. Only the opaque account id leaves the device.
export function reportFromPage(error, page) {
  return buildCrashReport(error, { route: page.route, accountId: page.user?.accountId ?? null });
}
