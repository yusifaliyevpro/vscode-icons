#!/usr/bin/env node
// Sorts all object keys alphabetically in the 4 icon mapping files.
// Parses each file directly — single pass, O(n log n). No ESLint needed.
import * as fs from "fs";
import * as path from "path";

const rootDir = path.resolve(import.meta.dirname, "..");

const mappingFiles = [
  "src/icons/fileExtensions.ts",
  "src/icons/fileNames.ts",
  "src/icons/folderNames.ts",
  "src/icons/folderNamesExpanded.ts",
];

// Extract the bare key string from a line like:  key: "...",  or  "key": "...",
function extractKey(line: string): string {
  const match = line.match(/^\s*"?([^":]+)"?\s*:/);
  return match ? match[1].replace(/^[._@]+/, "").toLowerCase() : "";
}

function sortFile(filePath: string): void {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");

  // Find the opening brace of `export default {`
  const openIdx = lines.findIndex((l) => /^export default \{/.test(l));
  // Find the closing `};`
  const closeIdx = lines.findLastIndex((l) => /^\}/.test(l));

  if (openIdx === -1 || closeIdx === -1) {
    return;
  }

  const header = lines.slice(0, openIdx + 1); // up to and including `export default {`
  const footer = lines.slice(closeIdx); // `};` and anything after
  const body = lines.slice(openIdx + 1, closeIdx);

  // Separate spread lines (...make(...)) from regular key-value lines
  // Blank lines are dropped
  const spreads: string[] = [];
  const entries: string[] = [];

  for (const line of body) {
    if (line.trim() === "") {
      continue;
    }
    if (line.trim().startsWith("...")) {
      spreads.push(line);
    } else {
      entries.push(line);
    }
  }

  // Sort entries alphabetically by key (case-insensitive)
  entries.sort((a, b) => extractKey(a).localeCompare(extractKey(b)));

  const sorted = [...header, ...spreads, ...entries, ...footer].join("\n");

  if (sorted !== content) {
    fs.writeFileSync(filePath, sorted);
  }
}

for (const rel of mappingFiles) {
  const filePath = path.join(rootDir, rel);
  const name = path.basename(filePath);
  sortFile(filePath);
  console.log(`  ✓ ${name}`);
}

console.log("Done! All keys sorted.");
