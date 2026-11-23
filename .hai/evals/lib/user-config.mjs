// Fingerprints of the operator's user-level instruction and settings files. Runs do not
// isolate them (isolation would also drop the operator's login), so each record notes
// which were present, as path and content hash only, never content. The report warns when
// the records it compares differ on them.
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { sha256 } from "./util.mjs";

// Paths are shown with "~" for the home folder so records carry no user name.
const shown = (file) => {
  const home = os.homedir();
  return file === home || file.startsWith(`${home}${path.sep}`) ? `~${file.slice(home.length)}` : file;
};

export async function fingerprintFiles(files) {
  const out = [];
  for (const file of files) {
    const data = await fs.readFile(file).catch(() => null);
    out.push(data === null ? { path: shown(file), present: false } : { path: shown(file), present: true, sha256: sha256(data) });
  }
  return out;
}

// A stable key for comparing two records' fingerprints.
export function fingerprintKey(list) {
  return JSON.stringify((list ?? []).map((f) => [f.path, f.present ? f.sha256 : null]).sort());
}
