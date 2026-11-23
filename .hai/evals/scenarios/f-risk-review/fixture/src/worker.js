import { buildCrashReport } from "./crash-report.js";

// `job` is { id, attempt } for the background recipe sync.
export function reportFromWorker(error, job) {
  return buildCrashReport(error, { job: job.id, attempt: job.attempt });
}
