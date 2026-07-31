import { readFileSync } from "node:fs";

/** Split a semver string into [major, minor, patch] numbers (ignoring prerelease). */
function parseSemver(v: string): number[] {
  const [major = 0, minor = 0, patch = 0] = v.split("-")[0].split(".").map(Number);
  return [major, minor, patch];
}

/** Compare two semver strings. Returns -1, 0, or 1. */
function compareSemver(a: string, b: string): number {
  const left = parseSemver(a);
  const right = parseSemver(b);
  for (let i = 0; i < 3; i++) {
    if (left[i] !== right[i]) return left[i] < right[i] ? -1 : 1;
  }
  return 0;
}

/**
 * Guard against publishing a version that is behind npm. Fetches the latest
 * published version and fails if package.json is lower than it. Passes when the
 * local version is equal, higher, or when nothing is published yet.
 */
export async function checkVersion(): Promise<void> {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const name = String(pkg.name);
  const current = String(pkg.version);

  const res = await fetch(`https://registry.npmjs.org/${name}/latest`);
  if (res.status === 404) return; // not published yet, nothing to compare
  if (!res.ok) throw new Error(`npm registry returned ${res.status} for "${name}"`);

  const response: any = await res.json();
  const latest = String(response.version);
  if (compareSemver(current, latest) < 0) {
    throw new Error(`package.json is ${current} but npm latest is ${latest}. Bump the version to ${latest} or higher.`);
  }
}
