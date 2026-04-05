# v1.1.2

- Added file names `lighthouserc.cjs`, `.lighthouserc.cjs`, `.lighthouserc.mjs`, `lighthouserc.mjs`
- Added file name `skills-lock.json`
- Added file name `turbopack`,

# v1.1.1

- Added .ts.map extension

# v1.1.0

- Added `tsmap.svg` icon
- Added .cts, .mts, .cts.map, .mts.map, .cjs.map, mjs.map, .d.mts, .d.cts

# v1.0.7

- Changed icon of extension for better compability with Microsoft policies
- Added Cursor IDE icons (.cursorrules, .cursorignore, .mdc file extension)

# v1.0.6

- Rename extension display name to "Icons – Maintained"
- Added kotlin folder, expo folder, output folder icons and more
- Update description and keywords for better Marketplace discoverability
- Update README to reflect Open VSX availability (Cursor, VSCodium, Antigravity, Gitpod and more)
- Split installation instructions into VS Code Marketplace and Open VSX sections with direct links
- Add unused icon check — icon IDs declared in `src/icons.ts` but not used in any mapping file are now reported
- Improve `check-icons` output for unused icons: shows original declaration and SVG path

# v1.0.5

- Fix broken icon mappings (smali, docker-compose.debug, .watchmanconfig, changesets, vscode-test folders)
- Add reverse icon check — mapping files are now validated against icons.ts definitions
- Clickable file:line references in check-icons output for quick way to check

# v1.0.4

- Add contributing section to README

# v1.0.3

- Fix GitHub release notes rendering (use --notes-file to avoid shell interpretation of backticks)
- Add icon existence check to PR check CI workflow
- Updated script (`pnpm pre-check`)

# v1.0.2

- Add CONTRIBUTING guide with icon addition instructions
- Add folder-icon-maker documentation
- Add pre-check script (`pnpm pre-check`) for local PR validation
- Add PR check CI workflow (TypeScript, ESLint, Prettier, build, icon validation, version check)
- Add changelog enforcer for version bumps
- Add PR and issue templates
- Rename folder-maker to folder-icon-maker
- Switch deploy workflow from npm to pnpm
- Add `permissions: contents: write` to deploy workflow for git tag creation
- Lower minimum VS Code engine version to 1.60.0

# v1.0.1

- Update README

# v1.0.0

- Initial commit
