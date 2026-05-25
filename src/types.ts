import type { FlagLintConfig, ScanConfig } from "./config.js";
export type { FlagLintConfig, ScanConfig };

export interface FileSource {
  root?: string;
  listFiles(include: string[], exclude: string[]): Promise<string[]>;
  readFile(path: string): Promise<string>;
}

export type StalenessSignal =
  | { source: "keyword"; keyword: string }
  | { source: "path"; pattern: string }
  | { source: "minFileCount"; fileCount: number; threshold: number };

export interface StalenessEvaluator {
  evaluate(usages: FlagUsage[], config: ScanConfig): Promise<void>;
}

export type ScanWarning =
  | { kind: "read-failure"; file: string; fsCode: string }
  | { kind: "parse-failure"; file: string };

export type CallType =
  | "variation"
  | "variationDetail"
  | "allFlags"
  | "isFeatureEnabled"
  | "hook-useFlags"
  | "hook-useLDClient"
  | "hoc"
  | "provider";

export interface FlagUsage {
  flagKey: string;
  isDynamic: boolean;
  // always relative to scan root — never an absolute path
  file: string;
  line: number;
  column: number;
  callType: CallType;
  stalenessSignals: StalenessSignal[];
}

export const isStale = (u: FlagUsage): boolean => u.stalenessSignals.length > 0;

export interface LaunchDarklyFlag {
  key: string;
  name?: string;
  archived?: boolean;
}

export interface LaunchDarklyInventory {
  flags: LaunchDarklyFlag[];
}

export type LaunchDarklyAuditStatus =
  | "in-code-and-launchdarkly"
  | "stale-candidate"
  | "invalid-or-deleted"
  | "manual-review";

export interface LaunchDarklyAuditFlag {
  flagKey: string;
  status: LaunchDarklyAuditStatus;
  name?: string;
  files?: string[];
  usages?: number;
  archived?: boolean;
}

export interface LaunchDarklyAuditManualReview {
  kind: "dynamic-key" | "bulk-inventory";
  flagKey: string;
  file: string;
  line: number;
  callType: string;
  reason: string;
}

export interface LaunchDarklyAudit {
  inventorySource: "json";
  summary: {
    inCodeAndLaunchDarkly: number;
    staleCandidates: number;
    invalidOrDeleted: number;
    manualReview: number;
  };
  foundInCodeAndLaunchDarkly: LaunchDarklyAuditFlag[];
  foundInLaunchDarklyNotCode: LaunchDarklyAuditFlag[];
  foundInCodeNotLaunchDarkly: LaunchDarklyAuditFlag[];
  manualReview: LaunchDarklyAuditManualReview[];
}

export interface ScanResult {
  scannedAt: string;
  scanRoot: string;
  scannedFiles: number;
  totalUsages: number;
  uniqueFlags: string[];
  usages: FlagUsage[];
  scanDurationMs: number;
  warnings: readonly ScanWarning[];
  launchDarklyAudit?: LaunchDarklyAudit;
}

export interface ScanOptions {
  dir: string;
  format: ReportFormat;
  output?: string;
  config?: string;
}

export type ReportFormat = "json" | "markdown" | "html" | "sarif";

export interface ReporterOptions {
  format: ReportFormat;
  title?: string;
}

export interface MigrationItem {
  usage: FlagUsage;
  openFeatureEquivalent: string | null;
  codeChangeBefore: string;
  codeChangeAfter: string;
  requiresManualReview: boolean;
  reviewReason?: string;
}

export interface MigrationAnalysis {
  readinessScore: number;
  requiredPackages: string[];
  items: MigrationItem[];
  manualReviewCount: number;
  autoMigrateCount: number;
}
