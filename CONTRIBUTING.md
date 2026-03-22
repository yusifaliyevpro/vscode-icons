# Contributing

Thanks for your interest in contributing! This guide explains how to add new icons to the extension.

## Adding a File Icon

1. **Add the SVG** — Place your icon SVG in the `icons/` directory (e.g., `icons/myicon.svg`).

2. **Register the icon** — In `src/icons.ts`, add an entry using the `icon()` factory:

   ```ts
   icon("myicon"),
   ```

   This creates an icon with ID `_f_myicon` pointing to `./icons/myicon.svg`.

3. **Map it to file extensions or filenames** — Edit the appropriate file in `src/icons/`:

   - **`fileExtensions.ts`** — Map file extensions to your icon:
     ```ts
     myext: "_f_myicon",
     ```
   - **`fileNames.ts`** — Map exact filenames to your icon:
     ```ts
     "myfile.config": "_f_myicon",
     ```

   If you need to map multiple extensions to the same icon, use the `make()` helper from `src/helper.ts`:

   ```ts
   ...make(["ext1", "ext2", "ext3"], "_f_myicon"),
   ```

4. **Build** — Run `pnpm build` to regenerate `icons.json` and verify your icon appears correctly.

## Adding a Folder Icon

Folder icons require two SVG variants: a closed folder and an open folder. You can create these using the **folder-icon-maker** tool.

### Using folder-icon-maker

1. Place your logo SVG in the `folder-icon-maker/` directory (e.g., `folder-icon-maker/mylogo.svg`).

2. Run the generator:

   ```bash
   pnpm generate
   ```

   This creates two files in `folder-icon-maker/output/`:
   - `folder_mylogo.svg` — closed folder icon
   - `folder_mylogo_open.svg` — open folder icon

   You can fine-tune the logo placement with optional flags:

   ```bash
   pnpm generate --scale 1.2       # Make the logo 20% bigger
   pnpm generate --scale 0.7       # Make the logo 30% smaller
   pnpm generate --x 0.5 --y -1    # Shift logo right by 0.5px, up by 1px
   ```

   - `--scale` — Multiplier for logo size (default: `1.0`). Values above 1 make it bigger, below 1 make it smaller.
   - `--x` — Horizontal offset in pixels. Positive values move right, negative values move left.
   - `--y` — Vertical offset in pixels. Positive values move down, negative values move up.

3. **Move the generated SVGs** to the `icons/` directory:

   ```bash
   mv folder-icon-maker/output/folder_mylogo.svg icons/
   mv folder-icon-maker/output/folder_mylogo_open.svg icons/
   ```

4. **Register the icon** — In `src/icons.ts`, add an entry using the `folderIcon()` factory:

   ```ts
   folderIcon("folder_mylogo"),
   ```

   This creates two IDs: `_fd_folder_mylogo` (closed) and `_fd_folder_mylogo_open` (expanded).

5. **Map it to folder names** — Add entries in both:

   - **`src/icons/folderNames.ts`** (closed state):
     ```ts
     mylogo: "_fd_folder_mylogo",
     ```
   - **`src/icons/folderNamesExpanded.ts`** (expanded state):
     ```ts
     mylogo: "_fd_folder_mylogo_open",
     ```

6. **Build** — Run `pnpm build` to regenerate `icons.json`.

## Files Overview

| File | Purpose |
|------|---------|
| `icons/` | SVG icon assets |
| `src/icons.ts` | Icon registry — maps icon IDs to SVG paths |
| `src/icons/fileExtensions.ts` | File extension → icon ID mappings |
| `src/icons/fileNames.ts` | Exact filename → icon ID mappings |
| `src/icons/folderNames.ts` | Folder name → closed folder icon ID |
| `src/icons/folderNamesExpanded.ts` | Folder name → expanded folder icon ID |
| `src/helper.ts` | `make()` helper for batch mappings |
| `folder-icon-maker/` | Tool to generate folder icon SVGs from a logo |

## Local Testing

To test your changes locally in VS Code:

1. **Uninstall the production extension** first — if you have **Icons (Maintained)** installed from the marketplace, uninstall it to avoid conflicts.

2. **Build and install locally:**

   ```bash
   pnpm install:local
   ```

   This builds the project, packages it as a `.vsix` file, and installs it into VS Code.

3. **Set the icon theme** — Open the Command Palette (`Ctrl+Shift+P`), search for `File Icon Theme`, and select **Icons**.

4. Verify your new icons appear correctly in the file explorer.

## Pre-Check

Before submitting your PR, run the pre-check script to catch issues early:

```bash
pnpm pre-check
```

This runs the same checks as CI:

1. **Icon files** — verifies every SVG referenced in `src/icons.ts` exists in `icons/`
2. **Prettier** — checks formatting (offers to auto-fix if it fails)
3. **TypeScript** — type checking
4. **ESLint** — linting
5. **Build** — generates `icons.json`

## Important Notes

- SVG files should use a standard viewBox (e.g., `0 0 128 128` or `0 0 24 24`).
- Icon IDs use the prefix `_f_` for file icons and `_fd_` for folder icons.
- Do **not** change the `version` field in `package.json` — only the maintainer updates the version.
