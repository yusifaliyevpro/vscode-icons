#!/usr/bin/env node
// Extracts changelog notes for a given version from CHANGELOG.md
// Usage: node --no-warnings scripts/extract-changelog.ts [version]
// If no version is given, reads it from package.json

import * as fs from "fs";
import * as path from "path";

const rootDir = path.resolve(import.meta.dirname, "..");
const version = process.argv[2] ?? JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8")).version;
const changelog = fs.readFileSync(path.join(rootDir, "CHANGELOG.md"), "utf8");

const heading = `# v${version}`;
const start = changelog.indexOf(heading);

if (start === -1) {
  console.error(`No changelog entry found for v${version}`);
  process.exit(1);
}

const afterHeading = start + heading.length;
const nextHeading = changelog.indexOf("\n# v", afterHeading);
const notes = (nextHeading === -1 ? changelog.slice(afterHeading) : changelog.slice(afterHeading, nextHeading)).trim();

if (!notes) {
  console.error(`Changelog entry for v${version} is empty`);
  process.exit(1);
}

console.log(notes);
