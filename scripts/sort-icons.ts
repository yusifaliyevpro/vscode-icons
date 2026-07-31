// Sorts the icon mapping files (keys alphabetically) and the icons object in
// src/icons.ts (grouped by helper, then by name). Single pass, no Oxfmt needed.
import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";

const rootDir = path.resolve(import.meta.dirname, "..");

// ── Mapping files: sort object keys alphabetically ────────────────
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

/** Return `content` with the keys of its `export default { ... }` object sorted alphabetically. */
function sortMappingContent(content: string): string {
  const lines = content.split("\n");
  const openIdx = lines.findIndex((l) => l.startsWith("export default {"));
  const closeIdx = lines.findLastIndex((l) => l.startsWith("}"));
  if (openIdx === -1 || closeIdx === -1) {
    return content;
  }

  const header = lines.slice(0, openIdx + 1);
  const footer = lines.slice(closeIdx);
  const body = lines.slice(openIdx + 1, closeIdx);

  // Separate spread lines (...make(...)) from regular key-value lines. Blank lines are dropped.
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

  entries.sort((a, b) => extractKey(a).localeCompare(extractKey(b)));

  return [...header, ...spreads, ...entries, ...footer].join("\n");
}

// ── icons.ts: group by helper (iconGeneric, folderIcon, icon), then sort by name ──
const iconsFile = "src/icons.ts";
// Groups are emitted in this order; within a group, entries are sorted by name.
const GROUP_ORDER = ["iconGeneric", "folderIcon", "icon"];
// Matches a line like:  ...icon("name"),
const SPREAD_RE = /^\s*\.\.\.(iconGeneric|folderIcon|icon)\("([^"]+)"\)/;

/** Return `src/icons.ts` with the `icons` object's spreads grouped then name-sorted. */
function sortIconsContent(content: string): string {
  const lines = content.split("\n");
  const openIdx = lines.findIndex((l) => l.startsWith("const icons"));
  const closeIdx = lines.findLastIndex((l) => l.startsWith("}"));
  if (openIdx === -1 || closeIdx === -1) {
    return content;
  }

  const header = lines.slice(0, openIdx + 1);
  const footer = lines.slice(closeIdx);
  const body = lines.slice(openIdx + 1, closeIdx);

  const spreads: { fn: string; name: string; line: string }[] = [];
  const other: string[] = []; // any non-spread lines are preserved at the top
  for (const line of body) {
    if (line.trim() === "") {
      continue;
    }
    const match = SPREAD_RE.exec(line);
    if (match) {
      spreads.push({ fn: match[1], name: match[2], line });
    } else {
      other.push(line);
    }
  }

  spreads.sort((a, b) => {
    const group = GROUP_ORDER.indexOf(a.fn) - GROUP_ORDER.indexOf(b.fn);
    return group !== 0 ? group : a.name.localeCompare(b.name, "en");
  });

  return [...header, ...other, ...spreads.map((s) => s.line), ...footer].join("\n");
}

// ── All sortable targets ──────────────────────────────────────────
const targets: { rel: string; sort: (content: string) => string }[] = [
  { rel: iconsFile, sort: sortIconsContent },
  ...mappingFiles.map((rel) => ({ rel, sort: sortMappingContent })),
];

/** Throw if any icon file (the mappings or icons.ts) is not sorted. Does not modify files. */
export function checkIconsSorted(): void {
  const unsorted = targets.filter(({ rel, sort }) => {
    const content = fs.readFileSync(path.join(rootDir, rel), "utf8");
    return sort(content) !== content;
  });

  if (unsorted.length > 0) {
    throw new Error(`Unsorted icon files: ${unsorted.map((t) => path.basename(t.rel)).join(", ")}`);
  }
}

/** Sort every icon file (the mappings and icons.ts) in place. */
export function sortIcons(): void {
  for (const { rel, sort } of targets) {
    const filePath = path.join(rootDir, rel);
    const content = fs.readFileSync(filePath, "utf8");
    const sorted = sort(content);
    if (sorted !== content) {
      fs.writeFileSync(filePath, sorted);
    }
    console.log(`  ✓ ${path.basename(filePath)}`);
  }
  console.log("Done! All icons sorted.");
}

// Run directly (`node scripts/sort-icons.ts`), not when imported.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  sortIcons();
}
