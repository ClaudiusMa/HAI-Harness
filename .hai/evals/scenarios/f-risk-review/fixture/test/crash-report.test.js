import assert from "node:assert/strict";
import test from "node:test";
import { reportFromPage } from "../src/web.js";
import { reportFromWorker } from "../src/worker.js";

test("page reports carry the route", () => {
  const report = reportFromPage(new Error("boom"), { route: "/glazes", user: { accountId: "acct_1" } });
  assert.equal(report.body.route, "/glazes");
  assert.equal(report.body.message, "boom");
});

test("worker reports carry the job", () => {
  const report = reportFromWorker(new Error("sync failed"), { id: "job-1", attempt: 1 });
  assert.equal(report.body.job, "job-1");
  assert.equal(report.method, "POST");
});

test("top-level personal fields are stripped", () => {
  const report = reportFromPage(new Error("boom"), { route: "/", user: {} });
  assert.equal(report.body.email, undefined);
});
