#!/usr/bin/env node
// Pre-check script
// Run this before opening a PR:
//   pnpm pre-check
//
// Checks: Icon files exist · TypeScript · ESLint · Prettier · Build
import { execSync } from "child_process";
import { readFileSync } from "fs";
import * as readline from "readline";
interface Check {
  name: string;
  cmd: string;
  onFail?: string;
}

// ── Colors ────────────────────────────────────────────────────────
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";

// ── Prompt helper ─────────────────────────────────────────────────
function ask(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() !== "n");
    });
  });
}

// ── Checks (same order as CI) ─────────────────────────────────────
const checks: Check[] = [
  {
    name: "Icons — verify icon integrity",
    cmd: "node --no-warnings scripts/check-icons.ts",
  },
  {
    name: "Prettier — format check",
    cmd: 'pnpm prettier --check "src/**/*.ts"',
    onFail: 'pnpm prettier --write "src/**/*.ts"',
  },
  {
    name: "TypeScript — type check",
    cmd: "pnpm tsc --noEmit --incremental false",
  },
  {
    name: "ESLint — lint",
    cmd: "pnpm lint",
  },
  {
    name: "Build — generate icons.json",
    cmd: "pnpm build",
  },
];

// ── Changelog check ───────────────────────────────────────────────
function checkChangelog(): boolean {
  const name = "Changelog — format check";
  console.log(`${BOLD}${YELLOW}▶ ${name}${RESET}`);

  let statusOutput = "";
  try {
    statusOutput = execSync("git status --short CHANGELOG.md", { encoding: "utf8" }).trim();
  } catch {
    console.log(`${YELLOW}  Skipping: git not available${RESET}`);
    console.log(`\n${GREEN}✔ PASSED: ${name}${RESET}\n`);
    console.log(`${CYAN}──────────────────────────────────────────────────${RESET}\n`);
    return true;
  }

  if (!statusOutput) {
    console.log(`  ${CYAN}CHANGELOG.md not changed, skipping.${RESET}`);
    console.log(`\n${GREEN}✔ PASSED: ${name}${RESET}\n`);
    console.log(`${CYAN}──────────────────────────────────────────────────${RESET}\n`);
    return true;
  }

  console.log(`  ${CYAN}CHANGELOG.md changed, validating...${RESET}\n`);

  const content = readFileSync("CHANGELOG.md", "utf8");
  const lines = content.split("\n");

  const entries = lines.filter((l) => /^# v/.test(l));
  if (entries.length === 0) {
    console.log(`\n${RED}✖ FAILED: ${name}${RESET}`);
    console.log(`${RED}  CHANGELOG.md has no entries. At least one entry is required.${RESET}`);
    console.log(`${CYAN}──────────────────────────────────────────────────${RESET}\n`);
    return false;
  }

  const invalidLines = lines
    .map((l, i) => ({ line: l, num: i + 1 }))
    .filter(({ line }) => /^# [0-9]/.test(line));

  if (invalidLines.length > 0) {
    console.log(`\n${RED}✖ FAILED: ${name}${RESET}`);
    console.log(`${RED}  Version headings must use 'v' prefix (e.g. '# v1.0.8'):${RESET}`);
    invalidLines.forEach(({ line, num }) =>
      console.log(`  ${RED}Line ${num}: ${line}${RESET}`)
    );
    console.log(`${CYAN}──────────────────────────────────────────────────${RESET}\n`);
    return false;
  }

  const firstEntry = entries[0];
  const changelogVersion = firstEntry.replace(/^# v/, "").trim();
  const pkgVersion = JSON.parse(readFileSync("package.json", "utf8")).version;

  if (changelogVersion !== pkgVersion) {
    console.log(`\n${RED}✖ FAILED: ${name}${RESET}`);
    console.log(
      `${RED}  Top CHANGELOG.md entry (v${changelogVersion}) does not match package.json version (${pkgVersion}).${RESET}`
    );
    console.log(`${CYAN}──────────────────────────────────────────────────${RESET}\n`);
    return false;
  }

  console.log(`\n${GREEN}✔ PASSED: ${name}${RESET}\n`);
  console.log(`${CYAN}──────────────────────────────────────────────────${RESET}\n`);
  return true;
}

// ── Runner ────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const failures: string[] = [];

console.log(`\n${BOLD}${CYAN}══════════════════════════════════════════════════${RESET}`);
console.log(`${BOLD}${CYAN}══════════════════════════════════════════════════${RESET}\n`);
console.log(`${BOLD}${CYAN}   Pre-Check — Icons Maintained${RESET}`);

if (checkChangelog()) {
  passed++;
} else {
  failed++;
  failures.push("Changelog — format check");
}

for (const check of checks) {
  console.log(`${BOLD}${YELLOW}▶ ${check.name}${RESET}`);
  console.log(`  ${CYAN}$ ${check.cmd}${RESET}\n`);

  let errorOutput = "";
  try {
    const result = execSync(check.cmd, {
      encoding: "utf8",
      stdio: ["inherit", "inherit", "pipe"],
    });
    if (result) {
      process.stdout.write(result);
    }
    console.log(`\n${GREEN}✔ PASSED: ${check.name}${RESET}\n`);
    passed++;
  } catch (err: unknown) {
    if (err && typeof err === "object" && "stderr" in err) {
      errorOutput = String((err as { stderr: string }).stderr ?? "");
    }
    if (errorOutput) {
      process.stderr.write(errorOutput);
    }
    console.log(`\n${RED}✖ FAILED: ${check.name}${RESET}`);

    if (check.onFail) {
      console.log(`\n${YELLOW}  Some files are not formatted correctly.${RESET}`);
      const confirm = await ask(`${YELLOW}${BOLD}  Run "${check.onFail}" to auto-fix? [Enter = yes / n = skip]: ${RESET}`);
      if (confirm) {
        try {
          console.log(`\n  ${CYAN}$ ${check.onFail}${RESET}\n`);
          execSync(check.onFail, { stdio: "inherit" });
          console.log(`\n${GREEN}✔ Auto-fixed: ${check.name}${RESET}\n`);
          passed++;
          console.log(`${CYAN}──────────────────────────────────────────────────${RESET}\n`);
          continue;
        } catch {
          console.log(`\n${RED}  Auto-fix failed. Please fix manually.${RESET}`);
        }
      } else {
        console.log(`${YELLOW}  Skipped auto-fix.${RESET}`);
      }
    }

    console.log();
    failed++;
    failures.push(check.name);
  }

  console.log(`${CYAN}──────────────────────────────────────────────────${RESET}\n`);
}

// ── Summary ───────────────────────────────────────────────────────
console.log(`${BOLD}${CYAN}══════════════════════════════════════════════════${RESET}`);
console.log(`${BOLD}   Results: ${GREEN}${passed} passed${RESET}${BOLD}, ${failed > 0 ? RED : GREEN}${failed} failed${RESET}`);

if (failures.length > 0) {
  console.log(`\n${RED}${BOLD}Failed checks:${RESET}`);
  failures.forEach((name) => console.log(`  ${RED}• ${name}${RESET}`));
  console.log(`\n${RED}${BOLD}⚠  Fix the issues above before opening a PR.${RESET}\n`);
  process.exit(1);
} else {
  console.log(`\n${GREEN}${BOLD}✔  All checks passed. Ready to open a PR!${RESET}\n`);
  process.exit(0);
}
