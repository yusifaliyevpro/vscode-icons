import { defineConfig } from "greenly";
import { checkIcons } from "./scripts/check-icons";
import { checkVersion } from "./scripts/check-version";
import { checkIconsSorted, sortIcons } from "./scripts/sort-icons";

export default defineConfig({
  name: "Icons - Maintained",
  checks: [
    { name: "TypeScript", command: "pnpm tsc --noEmit" },
    { name: "Oxfmt", command: "pnpm fmt:check", onFail: "pnpm fmt" },
    { name: "Oxlint", command: "pnpm lint" },
    { name: "Sorted Icons", command: checkIconsSorted, onFail: sortIcons },
    { name: "Icon Integrity", command: checkIcons },
    { name: "Version Check", command: checkVersion },
    { name: "Build", command: "pnpm build" },
  ],
});
