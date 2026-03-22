#!/usr/bin/env node
// Pre-check script
// Run this before opening a PR:
//   pnpm pre-check
//
// Checks: Icon files exist · TypeScript · ESLint · Prettier · Build
import { execSync } from "child_process";
import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";

interface Check {
  name: string;
  cmd?: string;
  fn?: () => string | null;
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

// ── Icon existence check ──────────────────────────────────────────
function checkIconsExist(): string | null {
  const rootDir = path.resolve(import.meta.dirname, "..");
  const iconsTs = fs.readFileSync(path.join(rootDir, "src", "icons.ts"), "utf8");
  const iconsDir = path.join(rootDir, "icons");

  const regex = /\.\.\.(?:icon|folderIcon|iconGeneric)\("([^"]+)"\)/g;
  const missing: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(iconsTs)) !== null) {
    const svgPath = path.join(iconsDir, `${match[1]}.svg`);
    if (!fs.existsSync(svgPath)) {
      missing.push(`${match[1]}.svg`);
    }
  }

  if (missing.length > 0) {
    return `Missing ${missing.length} SVG file(s) referenced in src/icons.ts:\n${missing.map((f) => `  • ${f}`).join("\n")}`;
  }
  return null;
}

// ── Checks (same order as CI) ─────────────────────────────────────
const checks: Check[] = [
  {
    name: "Icons — verify all referenced SVGs exist",
    fn: checkIconsExist,
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

// ── Runner ────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const failures: string[] = [];

console.log(`\n${BOLD}${CYAN}══════════════════════════════════════════════════${RESET}`);
console.log(`${BOLD}${CYAN}   Pre-Check — Icons (Maintained)${RESET}`);
console.log(`${BOLD}${CYAN}══════════════════════════════════════════════════${RESET}\n`);

for (const check of checks) {
  console.log(`${BOLD}${YELLOW}▶ ${check.name}${RESET}`);

  if (check.fn) {
    const error = check.fn();
    if (error) {
      console.log(`\n${RED}${error}${RESET}`);
      console.log(`\n${RED}✖ FAILED: ${check.name}${RESET}\n`);
      failed++;
      failures.push(check.name);
    } else {
      console.log(`\n${GREEN}✔ PASSED: ${check.name}${RESET}\n`);
      passed++;
    }
    console.log(`${CYAN}──────────────────────────────────────────────────${RESET}\n`);
    continue;
  }

  console.log(`  ${CYAN}$ ${check.cmd}${RESET}\n`);

  let errorOutput = "";
  try {
    const result = execSync(check.cmd!, {
      encoding: "utf8",
      stdio: ["inherit", "inherit", "pipe"],
    });
    if (result) {process.stdout.write(result);}
    console.log(`\n${GREEN}✔ PASSED: ${check.name}${RESET}\n`);
    passed++;
  } catch (err: unknown) {
    if (err && typeof err === "object" && "stderr" in err) {
      errorOutput = String((err as { stderr: string }).stderr ?? "");
    }
    if (errorOutput) {process.stderr.write(errorOutput);}
    console.log(`\n${RED}✖ FAILED: ${check.name}${RESET}`);

    if (check.onFail) {
      console.log(`\n${YELLOW}  Some files are not formatted correctly.${RESET}`);
      const confirm = await ask(
        `${YELLOW}${BOLD}  Run "${check.onFail}" to auto-fix? [Enter = yes / n = skip]: ${RESET}`,
      );
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
console.log(
  `${BOLD}   Results: ${GREEN}${passed} passed${RESET}${BOLD}, ${failed > 0 ? RED : GREEN}${failed} failed${RESET}`,
);

if (failures.length > 0) {
  console.log(`\n${RED}${BOLD}Failed checks:${RESET}`);
  failures.forEach((name) => console.log(`  ${RED}• ${name}${RESET}`));
  console.log(`\n${RED}${BOLD}⚠  Fix the issues above before opening a PR.${RESET}\n`);
  process.exit(1);
} else {
  console.log(`\n${GREEN}${BOLD}✔  All checks passed. Ready to open a PR!${RESET}\n`);
  process.exit(0);
}
