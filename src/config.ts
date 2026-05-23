import { readFile, access } from "fs/promises";
import { resolve, join } from "path";
import { z, ZodError } from "zod";

export const FlagLintConfigSchema = z.object({
  include: z.array(z.string()).default(["**/*.{ts,tsx,js,jsx}"]),
  exclude: z
    .array(z.string())
    .default([
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.next/**",
      "**/coverage/**",
      "**/*.d.ts",
    ]),
  provider: z
    .enum(["launchdarkly", "unleash", "growthbook", "custom"])
    .default("launchdarkly"),
  // TODO v0.3: replace minFileCount with real date-based staleness via git log
  minFileCount: z.number().int().min(0).default(1),
  wrappers: z.array(z.string()).default([]),
  reportTitle: z.string().optional(),
  outputDir: z.string().default("."),
});

export type FlagLintConfig = z.infer<typeof FlagLintConfigSchema>;

// Scan-relevant config only — the subset scan() needs. CLI output fields
// (reportTitle, outputDir) are stripped so the Cloud can pass its own config
// without dummy values for fields that have no meaning outside the CLI.
export type ScanConfig = Pick<FlagLintConfig, "include" | "exclude" | "provider" | "minFileCount" | "wrappers">;

const SEARCH_PATHS = [".flaglintrc", ".flaglintrc.json", "flaglint.config.json"];

export async function loadConfig(configPath?: string, dir?: string): Promise<FlagLintConfig> {
  let candidates: string[];
  if (configPath) {
    candidates = [configPath];
  } else {
    // Scanned dir takes precedence over cwd — check dir first, then cwd.
    const fromDir = dir ? SEARCH_PATHS.map((p) => join(resolve(dir), p)) : [];
    const fromCwd = SEARCH_PATHS.map((p) => resolve(p));
    candidates = [...fromDir, ...fromCwd];
  }

  for (const candidate of candidates) {
    const full = resolve(candidate);
    try {
      await access(full);
    } catch {
      continue;
    }

    let raw: unknown;
    try {
      raw = JSON.parse(await readFile(full, "utf8"));
    } catch (err) {
      throw new Error(`Error reading ${candidate}: ${String(err)}`);
    }

    try {
      return FlagLintConfigSchema.parse(raw);
    } catch (err) {
      if (err instanceof ZodError) {
        const detail = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
        throw new Error(`Error in ${candidate}: ${detail}`);
      }
      throw err;
    }
  }

  return FlagLintConfigSchema.parse({});
}
