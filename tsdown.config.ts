import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "src/extension.ts",
  outDir: "out",
  format: "esm",
  fixedExtension: false,
  platform: "node",
  target: "es2022",
  clean: true,
  dts: false,
  minify: false,
});
