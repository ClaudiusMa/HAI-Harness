#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templateDirs = ["Agents", "Human"];
const templateFiles = ["AGENTS.md"];
const ignoredNames = new Set([".DS_Store"]);

// Scaffold files are the stable, method-level docs that define how the harness
// works. `update` refreshes them in place. Project-specific content
// (project_context.md, planning.md, anything under Human/, tasks/, handoffs/,
// lessons/, _archive/, skills/, patterns.md, graveyard.md) is never touched
// by `update` — use `init --force` for a full reset.
const scaffoldPaths = [
  "AGENTS.md",
  "Agents/onboarding.md",
  "Agents/claudia.md",
  "Agents/augustus.md",
  "Agents/julius.md",
  "Human/onboarding.md"
];

const usage = `HAI-Harness

Usage:
  hai-harness init    [--target <dir>] [--force] [--dry-run]
  hai-harness update  [--target <dir>] [--dry-run]
  hai-harness doctor  [--target <dir>]
  hai-harness help

Commands:
  init     Copy the HAI-Harness files into an existing project.
  update   Refresh only the stable scaffold files (role docs, onboarding, AGENTS.md).
           Leaves project-specific files (brief.md, decisions.md, project_context.md,
           planning.md, tasks/, handoffs/, lessons/, etc.) untouched.
  doctor   Check whether the target project has the expected harness files.

Options:
  --target <dir>  Project directory to operate on. Defaults to the current directory.
  --force         (init only) Overwrite existing harness files.
  --dry-run       Show what would change without writing files.
`;

main().catch((error) => {
  console.error(`hai-harness: ${error.message}`);
  process.exitCode = 1;
});

async function main() {
  const [command = "help", ...args] = process.argv.slice(2);
  const options = parseOptions(args);

  if (command === "help" || command === "--help" || command === "-h") {
    console.log(usage);
    return;
  }

  if (command === "init") {
    await init(options);
    return;
  }

  if (command === "update") {
    await update(options);
    return;
  }

  if (command === "doctor") {
    await doctor(options);
    return;
  }

  throw new Error(`Unknown command "${command}". Run "hai-harness help".`);
}

function parseOptions(args) {
  const options = {
    target: process.cwd(),
    force: false,
    dryRun: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--force") {
      options.force = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--target") {
      const target = args[index + 1];
      if (!target) {
        throw new Error("--target requires a directory.");
      }
      options.target = target;
      index += 1;
    } else {
      throw new Error(`Unknown option "${arg}". Run "hai-harness help".`);
    }
  }

  options.target = path.resolve(options.target);
  return options;
}

async function init(options) {
  const target = options.target;
  await assertDirectory(target);

  const results = {
    created: [],
    overwritten: [],
    skipped: []
  };

  for (const dir of templateDirs) {
    const sourceDir = path.join(packageRoot, dir);
    const targetDir = path.join(target, dir);
    await copyDirectory(sourceDir, targetDir, options, results);
  }

  for (const file of templateFiles) {
    const sourcePath = path.join(packageRoot, file);
    const targetPath = path.join(target, file);
    await copyFile(sourcePath, targetPath, options, results);
  }

  printInitSummary(target, options, results);
}

async function update(options) {
  const target = options.target;
  await assertDirectory(target);

  const results = {
    updated: [],
    created: [],
    missingSource: []
  };

  for (const relativePath of scaffoldPaths) {
    const sourcePath = path.join(packageRoot, relativePath);
    const targetPath = path.join(target, relativePath);

    if (!(await exists(sourcePath))) {
      results.missingSource.push(relativePath);
      continue;
    }

    const targetExists = await exists(targetPath);

    if (!options.dryRun) {
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.copyFile(sourcePath, targetPath);
    }

    if (targetExists) {
      results.updated.push(relativePath);
    } else {
      results.created.push(relativePath);
    }
  }

  printUpdateSummary(target, options, results);
}

async function doctor(options) {
  const target = options.target;
  await assertDirectory(target);

  const requiredPaths = [
    "AGENTS.md",
    "Agents/onboarding.md",
    "Agents/project_context.md",
    "Agents/planning.md",
    "Agents/tasks/augustus.md",
    "Agents/tasks/julius.md",
    "Human/onboarding.md",
    "Human/brief.md",
    "Human/decisions.md"
  ];

  const missing = [];
  for (const relativePath of requiredPaths) {
    if (!(await exists(path.join(target, relativePath)))) {
      missing.push(relativePath);
    }
  }

  if (missing.length === 0) {
    console.log(`HAI-Harness looks installed in ${target}`);
    return;
  }

  console.log(`HAI-Harness is incomplete in ${target}`);
  console.log("");
  console.log("Missing:");
  for (const relativePath of missing) {
    console.log(`  - ${relativePath}`);
  }
  process.exitCode = 1;
}

async function copyFile(sourcePath, targetPath, options, results) {
  if (!(await exists(sourcePath))) {
    return;
  }

  const relativePath = path.relative(options.target, targetPath);
  const targetExists = await exists(targetPath);

  if (targetExists && !options.force) {
    results.skipped.push(relativePath);
    return;
  }

  if (!options.dryRun) {
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.copyFile(sourcePath, targetPath);
  }

  if (targetExists) {
    results.overwritten.push(relativePath);
  } else {
    results.created.push(relativePath);
  }
}

async function copyDirectory(sourceDir, targetDir, options, results) {
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });

  if (!options.dryRun) {
    await fs.mkdir(targetDir, { recursive: true });
  }

  for (const entry of entries) {
    if (ignoredNames.has(entry.name)) {
      continue;
    }

    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, targetPath, options, results);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const relativePath = path.relative(options.target, targetPath);
    const targetExists = await exists(targetPath);

    if (targetExists && !options.force) {
      results.skipped.push(relativePath);
      continue;
    }

    if (!options.dryRun) {
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.copyFile(sourcePath, targetPath);
    }

    if (targetExists) {
      results.overwritten.push(relativePath);
    } else {
      results.created.push(relativePath);
    }
  }
}

async function assertDirectory(target) {
  let stats;
  try {
    stats = await fs.stat(target);
  } catch {
    throw new Error(`Target directory does not exist: ${target}`);
  }

  if (!stats.isDirectory()) {
    throw new Error(`Target is not a directory: ${target}`);
  }
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function printInitSummary(target, options, results) {
  const mode = options.dryRun ? "Dry run complete" : "HAI-Harness installed";
  console.log(`${mode} for ${target}`);
  console.log("");
  printCount("Created", results.created);
  printCount("Overwritten", results.overwritten);
  printCount("Skipped existing", results.skipped);

  if (results.skipped.length > 0 && !options.force) {
    console.log("");
    console.log("Existing files were left unchanged. Re-run with --force to overwrite harness files.");
  }
}

function printUpdateSummary(target, options, results) {
  const mode = options.dryRun ? "Dry run complete" : "HAI-Harness scaffold updated";
  console.log(`${mode} for ${target}`);
  console.log("");
  printCount("Updated", results.updated);
  printCount("Created", results.created);
  if (results.missingSource.length > 0) {
    printCount("Missing in package (skipped)", results.missingSource);
  }
  console.log("");
  console.log("Project-specific files (brief.md, decisions.md, project_context.md, planning.md, tasks/, handoffs/, lessons/, etc.) were left untouched.");
  console.log("Run `hai-harness init --force` if you want to overwrite everything.");
}

function printCount(label, paths) {
  console.log(`${label}: ${paths.length}`);
  for (const relativePath of paths) {
    console.log(`  - ${relativePath}`);
  }
}
