# FlagLint Codebase Summary

Generated: 2026-05-20  
Branch: develop  
Version: 0.1.1

---

## Directory Structure

```
flaglint/
├── bin/
│   └── flaglint.ts              # CLI entry point — calls createCLI() and program.parse()
├── src/
│   ├── cli.ts                   # createCLI() — builds Commander program, registers commands
│   ├── types.ts                 # All shared TypeScript interfaces (FlagUsage, ScanResult, etc.)
│   ├── config.ts                # FlagLintConfigSchema (Zod) + loadConfig() function
│   ├── scanner/
│   │   ├── index.ts             # scan() — AST-based LD SDK usage detection
│   │   └── tests/
│   │       ├── scanner.test.ts  # 23 tests covering all detection patterns
│   │       └── fixtures/
│   │           ├── ld-basic.ts      # variation() + variationDetail() usage
│   │           ├── ld-dynamic.ts    # runtime flag key + allFlags()
│   │           ├── ld-react.tsx     # useFlags, useLDClient, LDProvider, withLDConsumer
│   │           ├── ld-stale.ts      # old-checkout, temp-debug-mode (stale keywords)
│   │           ├── no-ld.ts         # clean file with no LD usage
│   │           └── syntax-error.ts  # intentionally invalid TypeScript for parse-skip test
│   ├── reporter/
│   │   ├── index.ts             # formatReport() — dispatches to markdown/json/html formatters
│   │   └── tests/
│   │       └── reporter.test.ts # 22 tests covering all three output formats
│   ├── migrator/
│   │   └── index.ts             # analyze() + formatMigrationReport() — OpenFeature migration plan
│   ├── commands/
│   │   ├── scan.ts              # registerScanCommand() — CLI scan subcommand handler
│   │   └── migrate.ts           # registerMigrateCommand() — CLI migrate subcommand handler
│   └── config/
│       └── tests/
│           └── config.test.ts   # 12 tests: defaults, partial overrides, validation errors
├── scripts/
│   └── agent/
│       ├── agent.ts             # Dev agent CLI entry — Commander with 5 subcommands
│       ├── README.md            # Agent usage docs
│       ├── lib/
│       │   ├── git.ts           # Safe git helpers (no force-push/reset/delete exposed)
│       │   ├── npm.ts           # getPackageVersion() + verifyPublishable()
│       │   └── claude.ts        # runClaude() — streaming claude CLI subprocess wrapper
│       ├── tasks/
│       │   ├── launch.ts        # 5-step release sequence with confirmation gate
│       │   ├── parallel.ts      # Run multiple Claude prompts in parallel subprocesses
│       │   ├── sync-docs.ts     # Append-only MEMORY.md writer + ADR creator
│       │   ├── prompt.ts        # Print prompt files from scripts/agent/prompts/
│       │   └── status.ts        # Print git branch + package version + tree state
│       └── prompts/
│           ├── update-memory.md  # Prompt: append unrecorded decisions to MEMORY.md
│           ├── fix-bug.md        # Prompt: reproduce → test → fix → verify 57+ tests
│           ├── add-feature.md    # Prompt: design first, get approval, implement with tests
│           ├── publish-release.md# Prompt: pre-publish checklist, never runs npm publish
│           └── write-blog-post.md# Prompt: dev.to/HN copy in FlagLint voice
├── docs/
│   ├── adr/
│   │   ├── README.md            # ADR format guide and append-only rule
│   │   ├── 001-typescript-esm-strict.md    # Decision: TS5+ strict + ESM
│   │   ├── 002-ast-parser-choice.md        # Decision: @typescript-eslint/typescript-estree
│   │   └── 003-vendor-neutral-positioning.md # Decision: LD-only scan, OpenFeature-only migration
│   └── agents/
│       ├── issue-tracker.md     # GitHub Issues config, label guidance
│       └── triage-labels.md     # needs-triage / ready / in-progress / blocked / wont-fix
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md        # Bug report template with environment fields
│   │   └── feature_request.md   # Feature request template
│   └── workflows/
│       ├── ci.yml               # Push to main: build + test:coverage + upload artifact
│       ├── pr-checks.yml        # PRs to main: typecheck + test + build (Node 22)
│       └── release.yml          # Tag push v*.*.*: test + build + npm publish + GitHub Release
├── CLAUDE.md                    # Agent instructions — architecture rules, forbidden actions
├── CONTEXT.md                   # Domain vocabulary — canonical terms for all agents/contributors
├── CHANGELOG.md                 # Keep-a-Changelog format, v0.1.0 entry
├── CONTRIBUTING.md              # Contributor guide
├── LICENSE                      # MIT
├── README.md                    # Public-facing project docs
├── CODEBASE.md                  # This file
├── package.json                 # npm manifest with files allowlist
├── package-lock.json
├── tsconfig.json                # TS5+ strict, ESNext, moduleResolution: bundler
├── tsup.config.ts               # Build config — ESM, no sourcemap, __PKG_VERSION__ injected
└── vitest.config.ts             # v8 coverage, thresholds: lines 75, functions 75, branches 70
```

---

## Package.json

**Name:** `flaglint`  
**Version:** `0.1.1`  
**Type:** `"module"` (ESM)  
**Bin:** `flaglint` → `./dist/bin/flaglint.js`  
**Files allowlist:** `["dist/", "README.md", "CHANGELOG.md", "LICENSE"]`  
**Engines:** `node >= 18`

### Scripts

| Script | Command |
|--------|---------|
| `build` | `tsup` |
| `dev` | `tsup --watch` |
| `typecheck` | `tsc --noEmit` |
| `test` | `vitest` (interactive) |
| `test:run` | `vitest run` |
| `test:coverage` | `vitest run --coverage` |
| `agent` | `tsx scripts/agent/agent.ts` |
| `agent:launch` | `tsx scripts/agent/agent.ts launch` |
| `agent:parallel` | `tsx scripts/agent/agent.ts parallel` |
| `agent:sync` | `tsx scripts/agent/agent.ts sync-docs` |

### Dependencies (runtime — ship in npm package)

| Package | Version | Purpose |
|---------|---------|---------|
| `@typescript-eslint/types` | ^8.59.4 | TSESTree node type definitions |
| `@typescript-eslint/typescript-estree` | ^8.59.4 | AST parser for TS/TSX files |
| `chalk` | ^5.3.0 | Terminal colour output |
| `commander` | ^12.1.0 | CLI framework (subcommands, options, help) |
| `fast-glob` | ^3.3.2 | File discovery with glob patterns |
| `ora` | ^8.1.0 | Spinner (stderr-based) |
| `zod` | ^3.23.8 | Config schema validation |

### DevDependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@types/node` | ^22.0.0 | Node.js type declarations |
| `@vitest/coverage-v8` | ^4.1.6 | V8-based coverage provider |
| `clipboardy` | ^4.0.0 | Clipboard write for `agent prompt --copy` |
| `tsup` | ^8.2.4 | ESM bundler |
| `tsx` | ^4.19.0 | TypeScript runner for scripts/agent/ |
| `typescript` | ^5.5.4 | TypeScript compiler |
| `vitest` | ^4.1.6 | Test runner |

---

## Architecture

The codebase follows a strict unidirectional dependency graph:

```
bin/flaglint.ts
  └── src/cli.ts
        ├── src/commands/scan.ts
        │     ├── src/scanner/index.ts   ← reads files, produces ScanResult
        │     └── src/reporter/index.ts  ← formats ScanResult as md/json/html
        └── src/commands/migrate.ts
              ├── src/scanner/index.ts
              └── src/migrator/index.ts  ← analyzes ScanResult, produces MigrationAnalysis

src/config.ts  ← imported by commands and scanner (via types.ts re-export)
src/types.ts   ← imported by all modules (defines shared interfaces)
```

**No circular dependencies.** Each module has a single public surface.

### Module Responsibilities

**`src/scanner/index.ts`**  
Exports `scan(dir, config, onProgress?)`. Uses `fast-glob` to find files, reads each with `fs/promises.readFile`, parses with `@typescript-eslint/typescript-estree` (JSX-aware), walks the AST with a recursive `walk()` function, and calls `detectUsages()` to collect `FlagUsage[]`. Applies `staleThreshold` post-scan: flags appearing in ≤ N files are marked stale. Validates `config.include` patterns are relative and don't start with `..`. Parse failures are silently skipped and collected in `result.warnings[]` (never thrown). Returns `ScanResult`.

**`src/reporter/index.ts`**  
Exports `formatReport(result, options)`. Dispatches to `formatMarkdown()`, `formatJSON()`, or `formatHTML()`. Internal helper `buildFlagMap()` aggregates usages by flag key into a `Map<string, FlagEntry>`. Sorting: stale flags first, then by usage count descending. HTML output includes inline CSS with `prefers-color-scheme` dark mode, a live `<input>` filter (vanilla JS), and summary stat cards. HTML escaping done via `esc()` helper. `formatJSON()` wraps `ScanResult` with a top-level `generatedAt` ISO timestamp.

**`src/migrator/index.ts`**  
Exports `analyze(result)` and `formatMigrationReport(analysis)`. `analyze()` maps each `FlagUsage` to a `MigrationItem` via `buildItem()`. `buildItem()` switches on `callType` — all server-side calls (`variation`, `variationDetail`, `isFeatureEnabled`) emit `await`-prefixed OpenFeature equivalents and set `requiresManualReview: true` (async migration). `calcReadinessScore()` deducts points for dynamic keys (-10 each, max -40), `hook-useFlags` (-5 each), `allFlags` (-15), HOC (-5 each), and no static keys (-20). `calcRequiredPackages()` detects browser vs server usage: React-only → `web-sdk + react-sdk`; mixed → all three SDKs; server-only → `server-sdk` only.

**`src/config.ts`**  
Exports `FlagLintConfigSchema` (Zod), `FlagLintConfig` (inferred type), and `loadConfig(configPath?)`. Config file search order: `.flaglintrc` → `.flaglintrc.json` → `flaglint.config.json`. Uses sync `readFileSync`/`existsSync` (intentional — config is loaded once at startup). Zod validation produces field-level error messages from `ZodError.errors`.

**`src/commands/scan.ts`**  
Registers the `scan` subcommand via `registerScanCommand(program)`. Validates format against `VALID_FORMATS = ["json", "markdown", "html"]` before any I/O (exit code 2 on invalid format). Discriminates directory errors: ENOENT, EACCES, and other (not "not found" for all). Runs `ora` spinner (progress updates every 50 files). Prints `result.warnings` after spinner stops. `staleCount` and `dynamicCount` use `new Set(...).size` — counts unique flag keys, not usages. Exits code 1 when stale flags found (enables CI blocking). SIGINT handler stops spinner and exits 130.

**`src/commands/migrate.ts`**  
Registers the `migrate` subcommand via `registerMigrateCommand(program)`. Same directory validation pattern as scan. Calls `scan()` without a progress callback. Calls `analyze()` → `formatMigrationReport()`. `--dry-run` flag prints to stdout without writing a file. Default output file: `MIGRATION.md`. SIGINT handler, writeFile try/catch, and warnings print are all present.

---

## Entry Points

| Role | File | Notes |
|------|------|-------|
| CLI binary | `bin/flaglint.ts` | 4 lines: imports `createCLI`, calls `program.parse(process.argv)` |
| CLI factory | `src/cli.ts` | `createCLI()` builds the Commander program and returns it |
| Scan command | `src/commands/scan.ts` | `registerScanCommand(program: Command): void` |
| Migrate command | `src/commands/migrate.ts` | `registerMigrateCommand(program: Command): void` |
| Scanner | `src/scanner/index.ts` | `scan(dir, config, onProgress?): Promise<ScanResult>` |
| Reporter | `src/reporter/index.ts` | `formatReport(result, options): string` |
| Migrator | `src/migrator/index.ts` | `analyze(result): MigrationAnalysis`, `formatMigrationReport(analysis): string` |
| Config loader | `src/config.ts` | `loadConfig(configPath?: string): FlagLintConfig` |
| Dev agent | `scripts/agent/agent.ts` | `tsx scripts/agent/agent.ts <subcommand>` |

---

## Key Types and Interfaces

All defined in `src/types.ts` unless noted.

```typescript
// src/types.ts

interface FlagUsage {
  flagKey: string;       // literal key or "dynamic" or "*"
  isDynamic: boolean;    // true when key is runtime-computed
  file: string;          // absolute path
  line: number;          // 1-indexed
  column: number;        // 0-indexed
  callType: string;      // see call types below
  isStale: boolean;
}

interface ScanResult {
  scannedFiles: number;
  totalUsages: number;
  uniqueFlags: string[];         // static keys only, deduplicated
  usages: FlagUsage[];
  scanDurationMs: number;
  warnings: readonly string[];   // parse failure messages
}

interface ReporterOptions {
  format: "json" | "markdown" | "html";
  title?: string;
}

interface MigrationItem {
  usage: FlagUsage;
  openFeatureEquivalent: string | null;
  codeChangeBefore: string;
  codeChangeAfter: string;
  requiresManualReview: boolean;
  reviewReason?: string;
}

interface MigrationAnalysis {
  readinessScore: number;      // 0-100
  requiredPackages: string[];  // npm package names
  items: MigrationItem[];
  manualReviewCount: number;
  autoMigrateCount: number;
}

// src/config.ts
type FlagLintConfig = z.infer<typeof FlagLintConfigSchema>
```

### FlagUsage callType Values

| callType | Source pattern |
|----------|---------------|
| `"variation"` | `ldClient.variation(key, ctx, default)` |
| `"variationDetail"` | `ldClient.variationDetail(key, ctx, default)` |
| `"allFlags"` | `ldClient.allFlags(ctx)` |
| `"isFeatureEnabled"` | `isFeatureEnabled(key, ctx)` |
| `"hook-useFlags"` | `useFlags()` React hook |
| `"hook-useLDClient"` | `useLDClient()` React hook |
| `"hoc"` | `withLDConsumer()(Component)` |
| `"provider"` | `<LDProvider>` JSX element |

### Internal Types (reporter)

```typescript
// src/reporter/index.ts (not exported)
type FlagEntry = {
  usages: FlagUsage[];
  files: Set<string>;
  callTypes: Set<string>;
  isStale: boolean;
}
```

---

## Config Schema

Defined in `src/config.ts` as `FlagLintConfigSchema` (Zod object).

| Field | Type | Default | Validation |
|-------|------|---------|------------|
| `include` | `string[]` | `["**/*.{ts,tsx,js,jsx}"]` | array of strings |
| `exclude` | `string[]` | `["**/node_modules/**", "**/dist/**", "**/build/**", "**/.next/**", "**/coverage/**", "**/*.d.ts"]` | array of strings |
| `provider` | enum | `"launchdarkly"` | `"launchdarkly" \| "unleash" \| "growthbook" \| "custom"` |
| `staleThreshold` | `number` | `1` | integer, min 0 |
| `reportTitle` | `string` | `undefined` | optional |
| `outputDir` | `string` | `"."` | string |

Config file search order (first match wins): `.flaglintrc` → `.flaglintrc.json` → `flaglint.config.json`

**`staleThreshold` semantics:** A flag key appearing in ≤ N distinct files is marked `isStale: true`. Default 1 means any flag seen in only one file is a stale candidate. Set to 0 to disable threshold-based stale detection.

---

## Test Coverage

**57 tests total across 3 test files. All passing.**

### `src/scanner/tests/scanner.test.ts` — 23 tests

| describe block | What it tests |
|----------------|--------------|
| `scanner — ld-basic.ts` | `variation()` detection, string literal key extraction, file path, line numbers, `variationDetail()`, `uniqueFlags` population |
| `scanner — ld-dynamic.ts` | Runtime key → `isDynamic: true`, `allFlags()` → `flagKey: "*"`, dynamic keys excluded from `uniqueFlags` |
| `scanner — ld-react.tsx` | `useFlags()` hook, `useLDClient()` hook, `<LDProvider>` JSX, `withLDConsumer()` HOC |
| `scanner — ld-stale.ts` | `"old"` keyword → `isStale: true`, `"temp"` keyword → `isStale: true` |
| `scanner — no-ld.ts` | Zero usages returned, file still counted as scanned |
| `scanner — syntax-error.ts` | No throw on parse failure, zero usages, file counted as scanned |
| `scanner — scan() metadata` | `scanDurationMs >= 0`, `onProgress` callback fires per file |

Fixture files used: real `.ts`/`.tsx` source files in `src/scanner/tests/fixtures/`. Tests target individual fixtures via `FlagLintConfigSchema.parse({ include: [filename], exclude: [] })`.

### `src/reporter/tests/reporter.test.ts` — 22 tests

Three fixture `ScanResult` objects: `resultWithStale` (2 files, 3 usages: active + stale + dynamic), `resultNoStale` (1 file, 1 active usage).

| describe block | What it tests |
|----------------|--------------|
| `reporter — markdown format` | Flag keys present, stale section conditional, dynamic section conditional, stats summary, optional title, stale-first sort order, usages-by-file with line numbers |
| `reporter — json format` | Valid JSON, `generatedAt` ISO timestamp, all `ScanResult` fields, flag keys in `usages` |
| `reporter — html format` | `<!DOCTYPE html>` output, flag key presence, `class="stale"`, `class="dynamic"`, filter input, stat cards, footer attribution, `prefers-color-scheme` |

### `src/config/tests/config.test.ts` — 12 tests

Uses `tmpdir()` + `writeFileSync` to create temp JSON config files. Cleanup via `afterEach`.

| describe block | What it tests |
|----------------|--------------|
| `loadConfig — defaults` | Provider default, staleThreshold default, outputDir default, include glob pattern, exclude contains node_modules, `reportTitle` undefined |
| `loadConfig — partial config merges with defaults` | reportTitle override, provider override, include override, staleThreshold override |
| `loadConfig — invalid config throws clear error` | Negative staleThreshold, unknown provider, non-array include, error message contains field name, invalid JSON |

---

## Build Output

**Tool:** tsup v8.5.1  
**Entry:** `{ "bin/flaglint": "bin/flaglint.ts" }`  
**Format:** ESM only  
**Target:** `node22`  
**Sourcemaps:** disabled (`sourcemap: false`)  
**Clean:** yes (output dir wiped before each build)

| Output file | Size | Description |
|-------------|------|-------------|
| `dist/bin/flaglint.js` | ~35 KB | Bundled ESM CLI with `#!/usr/bin/env node` banner prepended |
| `dist/bin/flaglint.d.ts` | 13 B | Type declaration (minimal — just the entrypoint) |

**Compile-time constants injected via `define`:**
- `__PKG_VERSION__` → value of `package.json.version` (currently `"0.1.1"`)
- `__PKG_DESCRIPTION__` → value of `package.json.description`

Both are read at build time via `createRequire(import.meta.url)("./package.json")` in `tsup.config.ts`. Consumer code guards with `typeof __PKG_VERSION__ !== "undefined"` before use (reporter and migrator) or uses directly (cli.ts — safe because tsup always injects it for bundled output).

**npm package contents** (7 files, ~27 KB packed):
```
CHANGELOG.md
LICENSE
README.md
dist/bin/flaglint.d.ts
dist/bin/flaglint.js
package.json
```
`scripts/`, `src/`, `docs/`, `bin/` (source), and all dev config are excluded by the `files` allowlist.

---

## Known Issues or TODOs in Code

No `TODO` or `FIXME` comments exist in any source file under `src/` or `scripts/agent/`.

**Architectural notes worth flagging for future decisions:**

1. **`src/config.ts` uses sync I/O** (`readFileSync`, `existsSync`). Intentional — config is read once at startup. All other file I/O in the codebase is async.

2. **`src/commands/migrate.ts` calls `scan()` without a progress callback.** The spinner runs but the text never updates to show file count during migrate. Low priority.

3. **`scripts/agent/` is not covered by `npm run typecheck`** — `tsconfig.json` includes only `src/**/*` and `bin/**/*`. Type errors in agent scripts will not be caught by CI.

4. **`callType` in `FlagUsage` is typed as `string`**, not a discriminated union of the 8 known values. Any code that switches on `callType` (e.g., `buildItem()` in migrator) has an implicit `default` case rather than exhaustiveness checking.

5. **`src/config.ts` `provider` field** (`launchdarkly | unleash | growthbook | custom`) — only `launchdarkly` is actually used by the scanner. The field is stored but never read by scanning logic. Reserved for future multi-vendor support.

---

## GitHub Actions

### `ci.yml` — Main Branch CI
**Trigger:** `push` to `main` only (no PR trigger — `pr-checks.yml` handles that)  
**Node:** 22  
**Steps:** `npm ci` → `npm run build` → `npm run test:coverage` → upload `coverage/` artifact  
**Note:** Does not run `typecheck`. Coverage report uploaded as artifact named `coverage-report`.

### `pr-checks.yml` — PR Gate
**Trigger:** `pull_request` targeting `main`  
**Node:** 22  
**Steps:** `npm ci` → `npm run typecheck` → `npm test` → `npm run build`  
**Note:** This is the required status check for merging. Runs `typecheck` (ci.yml does not). Uses `vitest` interactive mode (not `test:run`) — but runs non-interactively in CI.

### `release.yml` — Tag-Triggered Publish
**Trigger:** `push` tag matching `v*.*.*`  
**Node:** 22  
**Permissions:** `contents: write` (GitHub Release creation), `id-token: write` (npm provenance)  
**Steps:**
1. `npm ci`
2. `npm test`
3. `npm run build`
4. `npm publish --access public --provenance` (requires `NPM_TOKEN` secret)
5. Extract CHANGELOG.md section for the tag version using `awk`
6. `gh release create "$GITHUB_REF_NAME"` with extracted changelog notes as release body

---

## Agent Scripts

All in `scripts/agent/`. Run via `npm run agent -- <subcommand>`. Never shipped in npm package. Not covered by `tsc --noEmit`.

### Entry: `scripts/agent/agent.ts`
Commander program with 5 subcommands: `launch`, `parallel`, `sync-docs`, `prompt`, `status`. Delegates each to a task file.

### `scripts/agent/tasks/launch.ts` — `runLaunch(version)`
Five-step release sequence with hard gates:
1. `git status --porcelain` must be empty
2. `npm run test:run` must exit 0
3. `npm run build` must exit 0
4. `package.json.version` must equal the version argument
5. Prompts `"Tag and push v<version>? (y/N)"` — proceeds only on explicit `y`  
Then: `git tag v<version>` + `git push origin <branch> --tags`.  
**Never runs `npm publish`** — prints the command for the human to run.

### `scripts/agent/tasks/parallel.ts` — `runParallel(promptList, options)`
Reads comma-separated prompt names, loads each from `scripts/agent/prompts/<name>.md`, optionally creates a git worktree per prompt (`--isolated`), spawns `claude -p <content>` subprocesses in parallel. Streams stdout/stderr with chalk-colored `[name]` prefix per subprocess. SIGINT sends SIGTERM to all children, SIGKILL after 5 seconds. Exit 0 if all succeed, 1 if any fail.

### `scripts/agent/tasks/sync-docs.ts` — `runSyncDocs(options)`
Appends `- <decision>` to `MEMORY.md` under a `## [YYYY-MM-DD] Session decisions` heading. If today's heading already exists, appends to it; otherwise creates a new section. **Append-only — never edits past entries.** Optional `--adr <title>`: auto-increments NNN, slugifies the title, creates `docs/adr/NNN-<slug>.md` with PROPOSED status template. Optional `--update-claude`: shows diff and requires explicit `y` confirmation before modifying `CLAUDE.md`.

### `scripts/agent/tasks/prompt.ts` — `runPrompt(name, options)`
Reads `scripts/agent/prompts/<name>.md` and prints to stdout. If name is omitted, lists all `.md` files in the prompts directory. `--copy` flag dynamically imports `clipboardy` and writes content to clipboard. Exits 1 with available prompt list if name not found.

### `scripts/agent/tasks/status.ts` — `runStatus()`
Runs `getCurrentBranch()`, `getPackageVersion()`, and `getStatus()` in parallel. Prints branch, version, and clean/dirty state to stdout.

### `scripts/agent/lib/git.ts`
Safe git subprocess helpers. All use `spawn("git", args)` — never `execSync`.  
Exports: `getStatus(cwd?)`, `getCurrentBranch(cwd?)`, `getRemoteUrl(remote, cwd?)`, `createTag(name, cwd?)`, `pushTags(remote, branch, cwd?)`.  
**Not exposed:** force-push, `reset --hard`, `clean -fd`, `branch -D`.

### `scripts/agent/lib/npm.ts`
Exports: `getPackageVersion(cwd?)` — reads `package.json` and returns `version` string.  
`verifyPublishable(cwd?)` — checks `name`, `version`, and `main` or `bin` are set. Throws with field list if missing.  
**Does not call `npm publish`.**

### `scripts/agent/lib/claude.ts`
Exports: `runClaude(prompt, cwd, onOutput): Promise<{ exitCode: number }>`.  
Spawns `claude -p <prompt>` with `stdio: ["ignore", "pipe", "pipe"]`. Streams both stdout and stderr through `onOutput` callback. Returns exit code.

### Prompt Templates (`scripts/agent/prompts/`)

| File | Purpose |
|------|---------|
| `fix-bug.md` | Read CONTEXT.md + CLAUDE.md → write failing test → fix → verify 57+ tests |
| `add-feature.md` | Read CONTEXT.md + ADRs → propose design → get approval → implement with tests |
| `publish-release.md` | Pre-publish checklist: tests, build, typecheck, CHANGELOG, version, MEMORY.md |
| `update-memory.md` | Identify unrecorded session decisions and append to MEMORY.md |
| `write-blog-post.md` | dev.to/HN copy in developer-native voice, no marketing language |
