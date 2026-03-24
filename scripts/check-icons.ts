#!/usr/bin/env node
// Verify icon integrity:
// 1. Every icon referenced in src/icons.ts has an SVG in icons/
// 2. Every SVG in icons/ is declared in src/icons.ts
// 3. Every icon ID used in mapping files is defined in src/icons.ts
// 4. Every icon ID defined in src/icons.ts is used in at least one mapping file or generator.ts
import * as fs from "fs";
import * as path from "path";

const rootDir = path.resolve(import.meta.dirname, "..");
const iconsTs = fs.readFileSync(path.join(rootDir, "src", "icons.ts"), "utf8");
const iconsDir = path.join(rootDir, "icons");

// Build declared SVG filenames, icon IDs, and source locations from icons.ts in one pass
const iconRegex = /\.\.\.(icon|folderIcon|iconGeneric)\("([^"]+)"\)/g;
const declaredSvgs = new Set<string>();
const definedIds = new Set<string>();
const iconInfoMap = new Map<string, { line: number; svgName: string; declaration: string }>();
let match: RegExpExecArray | null;
while ((match = iconRegex.exec(iconsTs)) !== null) {
  const [, fn, name] = match;
  declaredSvgs.add(`${name}.svg`);
  let id: string;
  if (fn === "icon") {
    id = `_f_${name}`;
  } else if (fn === "folderIcon") {
    id = `_fd_${name}`;
  } else {
    id = `_${name}`;
  }
  definedIds.add(id);
  iconInfoMap.set(id, {
    line: lineNumberAt(iconsTs, match.index),
    svgName: `${name}.svg`,
    declaration: `...${fn}("${name}")`,
  });
}

// Check 1: referenced SVGs must exist on disk
const missing = [...declaredSvgs].filter((f) => !fs.existsSync(path.join(iconsDir, f)));

// Check 2: SVG files must be declared in icons.ts
const svgFiles = fs.readdirSync(iconsDir).filter((f) => f.endsWith(".svg"));
const unused = svgFiles.filter((f) => !declaredSvgs.has(f));

// Helper: find line number for a character offset in content
function lineNumberAt(content: string, offset: number): number {
  let line = 1;
  for (let i = 0; i < offset && i < content.length; i++) {
    if (content[i] === "\n") {
      line++;
    }
  }
  return line;
}

// Check 3: icon IDs used in mapping files must be defined in icons.ts
// Also collect all used IDs for Check 4
const mappingFiles = [
  "src/icons/fileExtensions.ts",
  "src/icons/fileNames.ts",
  "src/icons/folderNames.ts",
  "src/icons/folderNamesExpanded.ts",
];
const undefinedRefs: { file: string; line: number; id: string }[] = [];
const usedIds = new Set<string>();

for (const file of mappingFiles) {
  const content = fs.readFileSync(path.join(rootDir, file), "utf8");

  // Match direct assignments like: key: "_f_react"
  const directRegex = /:\s*"(_(?:f|fd|file|folder|folder_open)_?[\w-]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = directRegex.exec(content)) !== null) {
    usedIds.add(m[1]);
    if (!definedIds.has(m[1])) {
      undefinedRefs.push({
        file,
        line: lineNumberAt(content, m.index),
        id: m[1],
      });
    }
  }

  // Match make() calls like: ...make(array, "_f_audio")
  const makeRegex = /make\([^,]+,\s*"(_(?:f|fd|file|folder|folder_open)_?[\w-]*)"\)/g;
  while ((m = makeRegex.exec(content)) !== null) {
    usedIds.add(m[1]);
    if (!definedIds.has(m[1])) {
      undefinedRefs.push({
        file,
        line: lineNumberAt(content, m.index),
        id: m[1],
      });
    }
  }
}

// Collect IDs used as defaults in generator.ts (e.g. "_file", "_folder_open")
const generatorContent = fs.readFileSync(path.join(rootDir, "src", "generator.ts"), "utf8");
const generatorIdRegex = /"(_{1,2}[\w]+)"/g;
while ((match = generatorIdRegex.exec(generatorContent)) !== null) {
  usedIds.add(match[1]);
}

// Check 4: icon IDs declared in icons.ts but never used in any mapping or generator
const unusedIds = [...definedIds].filter((id) => !usedIds.has(id));

let failed = false;

if (missing.length > 0) {
  console.error(`Missing ${missing.length} SVG file(s) referenced in src/icons.ts:`);
  missing.forEach((f) => console.error(`  • ${f}`));
  failed = true;
}

if (unused.length > 0) {
  console.error(`Found ${unused.length} SVG file(s) in icons/ not declared in src/icons.ts:`);
  unused.forEach((f) => console.error(`  • ${f}`));
  failed = true;
}

if (undefinedRefs.length > 0) {
  console.error(`Found ${undefinedRefs.length} icon ID(s) used in mapping files but not defined in src/icons.ts:`);
  undefinedRefs.forEach(({ file, line, id }) => console.error(`  • ${id} — ${file}:${line}`));
  failed = true;
}

if (unusedIds.length > 0) {
  console.error(`Found ${unusedIds.length} icon ID(s) declared in src/icons.ts but never used in any mapping file:`);
  unusedIds.forEach((id) => {
    const { line, svgName, declaration } = iconInfoMap.get(id)!;
    console.error(`  • ${declaration.padEnd(30)}  icons/${svgName}`);
  });
  failed = true;
}

if (failed) {
  process.exit(1);
} else {
  console.log("All icon checks passed.");
}
