// Runs one scenario check (or the scenario probe) in its own process and prints a single
// result line. Usage: node check-worker.mjs <input.json>
// input: { checksFile, mode: "check" | "probe", id, dir, baselineDir, transcript }
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { makeContext } from "./check-context.mjs";

export const MARKER = "@@CALIBRATION_RESULT@@";

const input = JSON.parse(await fs.readFile(process.argv[2], "utf8"));
const emit = (value) => process.stdout.write(`\n${MARKER}${JSON.stringify(value)}\n`);

try {
  const mod = await import(pathToFileURL(input.checksFile).href);
  const ctx = makeContext(input);
  if (input.mode === "probe") {
    emit({ ok: true, value: mod.probe ? await mod.probe(ctx) : null });
  } else {
    const check = mod.checks.find((c) => c.id === input.id);
    if (!check) throw new Error(`No check ${input.id}`);
    const outcome = await check.run(ctx);
    const value = typeof outcome === "object" && outcome !== null ? outcome : { pass: Boolean(outcome) };
    emit({ ok: true, value: { pass: Boolean(value.pass), detail: value.detail ?? null } });
  }
} catch (error) {
  emit({ ok: false, error: String(error?.stack ?? error).split("\n").slice(0, 4).join("\n") });
}
// Agent code may leave timers or servers open; the result is out, so stop here.
process.exit(0);
