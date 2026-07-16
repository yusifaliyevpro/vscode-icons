import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["typescript", "unicorn", "oxc", "import"],
  categories: {
    correctness: "error",
    suspicious: "warn",
  },
  ignorePatterns: ["out"],
  rules: {
    curly: "warn",
    eqeqeq: "error",
    "no-throw-literal": "warn",
    "unicorn/prefer-node-protocol": "error",
    "typescript/consistent-type-imports": "warn",
    "no-console": "off",
  },
});
