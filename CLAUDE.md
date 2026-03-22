# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VS Code icon theme extension ("Icons") that provides custom file and folder icons. Published by yusifaliyevpro. Built with TypeScript, no runtime dependencies.

## Commands

- **Build**: `pnpm build` — compiles TypeScript then runs `node ./out/extension.js` to generate `icons.json`
- **Lint**: `pnpm lint` — runs ESLint with auto-fix across all `.ts` files
- **Package**: `pnpm package` — creates `.vsix` file via `vsce package`
- **Build & install locally**: `pnpm build:local` — builds, packages, and installs the extension into VS Code

There are no tests.

## Architecture

The build pipeline flows: **icon definitions → generator → extension.ts → icons.json**

1. **`src/icons.ts`** — Central icon registry. Uses `icon(name)` and `folderIcon(name)` factory functions to create icon definitions that map an ID to an SVG path (e.g., `_f_react` → `./icons/react.svg`).

2. **`src/icons/`** — Four mapping files that associate file patterns with icon IDs:
   - `fileExtensions.ts` — file extension → icon (e.g., `"js": "_f_js"`)
   - `fileNames.ts` — exact filename → icon (e.g., `"package.json": "_f_npm"`)
   - `folderNames.ts` — folder name → closed folder icon
   - `folderNamesExpanded.ts` — folder name → expanded folder icon

3. **`src/generator.ts`** — Composes all mappings into the VS Code icon theme structure with default icons for file, folder, rootFolder, and their expanded variants.

4. **`src/extension.ts`** — Entry point that writes `icons.json` by merging icon definitions with generator mappings. This runs at build time, not at VS Code runtime.

5. **`icons/`** — ~800 SVG icon assets referenced by the generated theme.

## Key Conventions

- **Icon ID prefixes**: `_f_` for file icons, `_fd_` for folder icons, `_open` suffix for expanded folder variants.
- **`make()` helper** (`src/helper.ts`): Maps an array of strings to a single icon ID. Used for batch assignments (e.g., all audio extensions → `_f_audio`).
- **`src/defaults/`**: Predefined arrays of related extensions — `media.ts` (audio/video/image/font extensions) and `bundler.ts` (webpack config filename variants).
- **Naming convention disabled**: Icon mapping files use `/* eslint-disable @typescript-eslint/naming-convention */` since property names are arbitrary file/folder names.

## Adding a New Icon

1. Add the SVG file to `icons/` (e.g., `myicon.svg`)
2. Add an icon definition in `src/icons.ts` using `icon("myicon")` or `folderIcon("myicon")`
3. Add the mapping in the appropriate `src/icons/` file (fileExtensions, fileNames, folderNames, or folderNamesExpanded)
4. Run `pnpm build` to regenerate `icons.json`
