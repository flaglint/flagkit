import { readFile } from "fs/promises";
import { describe, expect, it } from "vitest";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { FlagLintConfigSchema } from "../../config.js";
import {
  auditLaunchDarklyInventory,
  loadLaunchDarklyInventoryFile,
  parseLaunchDarklyInventory,
} from "../../launchdarkly-audit.js";
import { scan } from "../index.js";
import { LocalFileSource } from "../local-source.js";

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

function cfg(filename: string) {
  return FlagLintConfigSchema.parse({ include: [filename], exclude: [], minFileCount: 0 });
}

describe("LaunchDarkly inventory audit", () => {
  it("compares code usage against LaunchDarkly inventory across all audit categories", async () => {
    const result = await scan(new LocalFileSource(FIXTURES), cfg("ld-typed-methods.ts"));
    const inventory = await loadLaunchDarklyInventoryFile(join(FIXTURES, "ld-inventory-audit.json"));
    const audit = auditLaunchDarklyInventory(result, inventory);

    expect(audit.foundInCodeAndLaunchDarkly.map((flag) => flag.flagKey)).toEqual([
      "checkout-tier",
      "generic-bool",
    ]);
    expect(audit.foundInLaunchDarklyNotCode).toEqual([
      {
        flagKey: "launchdarkly-only-flag",
        status: "stale-candidate",
        name: "Dashboard-only flag",
        archived: true,
      },
    ]);
    expect(audit.foundInCodeNotLaunchDarkly.map((flag) => flag.flagKey)).toContain("generic-detail");

    const manualReviewKinds = audit.manualReview.map((item) => item.kind);
    expect(manualReviewKinds).toContain("dynamic-key");
    expect(manualReviewKinds).toContain("bulk-inventory");
    expect(audit.manualReview).toContainEqual(
      expect.objectContaining({ kind: "bulk-inventory", flagKey: "*", callType: "allFlagsState" })
    );
    expect(audit.summary).toEqual({
      inCodeAndLaunchDarkly: 2,
      staleCandidates: 1,
      invalidOrDeleted: audit.foundInCodeNotLaunchDarkly.length,
      manualReview: audit.manualReview.length,
    });
  });

  it("parses LaunchDarkly exports with items[] or flags[] containers", async () => {
    const raw = JSON.parse(await readFile(join(FIXTURES, "ld-inventory-audit.json"), "utf8")) as unknown;
    expect(parseLaunchDarklyInventory(raw).flags.map((flag) => flag.key)).toContain("generic-bool");
    expect(parseLaunchDarklyInventory({ flags: [{ key: "from-flags-array" }] }).flags).toEqual([
      { key: "from-flags-array", name: undefined, archived: undefined },
    ]);
  });
});
