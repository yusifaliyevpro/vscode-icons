import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const { version } = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

const git = (args: string[]) => execFileSync("git", args, { stdio: "inherit" });

git(["commit", "-am", `chore: release v${version}`]);
git(["push"]);
