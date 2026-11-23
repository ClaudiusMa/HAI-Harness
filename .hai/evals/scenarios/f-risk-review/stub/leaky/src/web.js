import { buildCrashReport } from "./crash-report.js";

export function reportFromPage(error, page) {
  return buildCrashReport(error, { route: page.route, user: page.user });
}
