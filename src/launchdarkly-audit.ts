import { readFile } from "fs/promises";
import type {
  FlagUsage,
  LaunchDarklyAudit,
  LaunchDarklyAuditFlag,
  LaunchDarklyAuditManualReview,
  LaunchDarklyFlag,
  LaunchDarklyInventory,
  ScanResult,
} from "./types.js";

type LaunchDarklyExportFlag = {
  key?: unknown;
  name?: unknown;
  archived?: unknown;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readFlag(value: unknown): LaunchDarklyFlag | null {
  if (!isObject(value) || typeof value["key"] !== "string" || value["key"].length === 0) {
    return null;
  }

  const flag = value as LaunchDarklyExportFlag;
  return {
    key: value["key"],
    name: typeof flag.name === "string" ? flag.name : undefined,
    archived: typeof flag.archived === "boolean" ? flag.archived : undefined,
  };
}

export function parseLaunchDarklyInventory(raw: unknown): LaunchDarklyInventory {
  const source = Array.isArray(raw)
    ? raw
    : isObject(raw) && Array.isArray(raw["items"])
      ? raw["items"]
      : isObject(raw) && Array.isArray(raw["flags"])
        ? raw["flags"]
        : null;

  if (!source) {
    throw new Error("LaunchDarkly inventory JSON must be an array, or an object with items[] or flags[]");
  }

  const flags = source.map(readFlag).filter((flag): flag is LaunchDarklyFlag => flag !== null);
  return { flags };
}

export async function loadLaunchDarklyInventoryFile(path: string): Promise<LaunchDarklyInventory> {
  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(path, "utf8"));
  } catch (err) {
    throw new Error(`Error reading LaunchDarkly inventory ${path}: ${String(err)}`);
  }
  return parseLaunchDarklyInventory(raw);
}

function sorted<T extends { flagKey: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.flagKey.localeCompare(b.flagKey));
}

function filesFor(flagKey: string, usages: FlagUsage[]): string[] {
  return [...new Set(usages.filter((u) => u.flagKey === flagKey).map((u) => u.file))].sort();
}

function usageCount(flagKey: string, usages: FlagUsage[]): number {
  return usages.filter((u) => u.flagKey === flagKey).length;
}

export function auditLaunchDarklyInventory(
  result: ScanResult,
  inventory: LaunchDarklyInventory
): LaunchDarklyAudit {
  const inventoryByKey = new Map(inventory.flags.map((flag) => [flag.key, flag]));
  const codeKeys = new Set(result.uniqueFlags);

  const foundInCodeAndLaunchDarkly: LaunchDarklyAuditFlag[] = [];
  const foundInCodeNotLaunchDarkly: LaunchDarklyAuditFlag[] = [];
  const foundInLaunchDarklyNotCode: LaunchDarklyAuditFlag[] = [];

  for (const flagKey of codeKeys) {
    const inventoryFlag = inventoryByKey.get(flagKey);
    const base = {
      flagKey,
      files: filesFor(flagKey, result.usages),
      usages: usageCount(flagKey, result.usages),
    };

    if (inventoryFlag) {
      foundInCodeAndLaunchDarkly.push({
        ...base,
        status: "in-code-and-launchdarkly",
        name: inventoryFlag.name,
        archived: inventoryFlag.archived,
      });
    } else {
      foundInCodeNotLaunchDarkly.push({
        ...base,
        status: "invalid-or-deleted",
      });
    }
  }

  for (const flag of inventory.flags) {
    if (!codeKeys.has(flag.key)) {
      foundInLaunchDarklyNotCode.push({
        flagKey: flag.key,
        status: "stale-candidate",
        name: flag.name,
        archived: flag.archived,
      });
    }
  }

  const bulkCallTypes = new Set(["allFlags", "allFlagsState"]);
  const manualReview: LaunchDarklyAuditManualReview[] = result.usages
    .filter((usage) => usage.isDynamic || bulkCallTypes.has(usage.callType))
    .map((usage) => ({
      kind: usage.isDynamic ? "dynamic-key" : "bulk-inventory",
      flagKey: usage.flagKey,
      file: usage.file,
      line: usage.line,
      callType: usage.callType,
      reason: usage.isDynamic
        ? "Flag key is computed at runtime and cannot be reconciled to LaunchDarkly inventory."
        : "Bulk flag inventory call has no single flag key and requires manual migration review.",
    }));

  return {
    inventorySource: "json",
    summary: {
      inCodeAndLaunchDarkly: foundInCodeAndLaunchDarkly.length,
      staleCandidates: foundInLaunchDarklyNotCode.length,
      invalidOrDeleted: foundInCodeNotLaunchDarkly.length,
      manualReview: manualReview.length,
    },
    foundInCodeAndLaunchDarkly: sorted(foundInCodeAndLaunchDarkly),
    foundInLaunchDarklyNotCode: sorted(foundInLaunchDarklyNotCode),
    foundInCodeNotLaunchDarkly: sorted(foundInCodeNotLaunchDarkly),
    manualReview: manualReview.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line),
  };
}
