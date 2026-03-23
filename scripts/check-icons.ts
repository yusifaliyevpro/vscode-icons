#!/usr/bin/env node
// Verify icon integrity:
// 1. Every icon referenced in src/icons.ts has an SVG in icons/
// 2. Every SVG in icons/ is declared in src/icons.ts
// 3. Every icon ID used in mapping files is defined in src/icons.ts
import * as fs from "fs";
import * as path from "path";

const rootDir = path.resolve(import.meta.dirname, "..");
const iconsTs = fs.readFileSync(path.join(rootDir, "src", "icons.ts"), "utf8");
const iconsDir = path.join(rootDir, "icons");

// Build set of declared SVG filenames and icon IDs from icons.ts
const declareRegex = /\.\.\.(?:icon|folderIcon|iconGeneric)\("([^"]+)"\)/g;
const declaredSvgs = new Set<string>();
const definedIds = new Set<string>();
let match: RegExpExecArray | null;
while ((match = declareRegex.exec(iconsTs)) !== null) {
  declaredSvgs.add(match[1] + ".svg");
}

// Reconstruct the icon IDs that icons.ts produces
const idRegex =
  /\.\.\.(icon|folderIcon|iconGeneric)\("([^"]+)"\)/g;
while ((match = idRegex.exec(iconsTs)) !== null) {
  const [, fn, name] = match;
  if (fn === "icon") {definedIds.add(`_f_${name}`);}
  else if (fn === "folderIcon") {definedIds.add(`_fd_${name}`);}
  else if (fn === "iconGeneric") {definedIds.add(`_${name}`);}
}

// Check 1: referenced SVGs must exist on disk
const missing = [...declaredSvgs].filter(
  (f) => !fs.existsSync(path.join(iconsDir, f)),
);

// Check 2: SVG files must be declared in icons.ts
const svgFiles = fs.readdirSync(iconsDir).filter((f) => f.endsWith(".svg"));
const unused = svgFiles.filter((f) => !declaredSvgs.has(f));

// Helper: find line number for a character offset in content
function lineNumberAt(content: string, offset: number): number {
  let line = 1;
  for (let i = 0; i < offset && i < content.length; i++) {
    if (content[i] === "\n") {line++;}
  }
  return line;
}

// Check 3: icon IDs used in mapping files must be defined in icons.ts
const mappingFiles = [
  "src/icons/fileExtensions.ts",
  "src/icons/fileNames.ts",
  "src/icons/folderNames.ts",
  "src/icons/folderNamesExpanded.ts",
];
const undefinedRefs: { file: string; line: number; id: string }[] = [];

for (const file of mappingFiles) {
  const content = fs.readFileSync(path.join(rootDir, file), "utf8");

  // Match direct assignments like: key: "_f_react"
  const directRegex = /:\s*"(_(?:f|fd|file|folder|folder_open)_?\w*)"/g;
  let m: RegExpExecArray | null;
  while ((m = directRegex.exec(content)) !== null) {
    if (!definedIds.has(m[1])) {
      undefinedRefs.push({
        file,
        line: lineNumberAt(content, m.index),
        id: m[1],
      });
    }
  }

  // Match make() calls like: ...make(array, "_f_audio")
  const makeRegex = /make\([^,]+,\s*"(_(?:f|fd|file|folder|folder_open)_?\w*)"\)/g;
  while ((m = makeRegex.exec(content)) !== null) {
    if (!definedIds.has(m[1])) {
      undefinedRefs.push({
        file,
        line: lineNumberAt(content, m.index),
        id: m[1],
      });
    }
  }
}

let failed = false;

if (missing.length > 0) {
  console.error(
    `Missing ${missing.length} SVG file(s) referenced in src/icons.ts:`,
  );
  missing.forEach((f) => console.error(`  • ${f}`));
  failed = true;
}

if (unused.length > 0) {
  console.error(
    `Found ${unused.length} SVG file(s) in icons/ not declared in src/icons.ts:`,
  );
  unused.forEach((f) => console.error(`  • ${f}`));
  failed = true;
}

if (undefinedRefs.length > 0) {
  console.error(
    `Found ${undefinedRefs.length} icon ID(s) used in mapping files but not defined in src/icons.ts:`,
  );
  undefinedRefs.forEach(({ file, line, id }) =>
    console.error(`  • ${id} — ${file}:${line}`),
  );
  failed = true;
}

if (failed) {
  process.exit(1);
} else {
  console.log("All icon checks passed.");
}
