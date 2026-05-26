# Enterprise Checkout Service — FlagLint Demo

A realistic end-to-end demo showing how a mid-sized SaaS platform team
migrates from direct LaunchDarkly Node.js server SDK evaluations to OpenFeature,
keeping LaunchDarkly as the provider.

---

## Scenario

**AcmePay** is a SaaS checkout platform with four Node.js services using direct
LaunchDarkly SDK calls: `checkout.ts`, `pricing.ts`, `analytics.ts`, and `product.ts`.
The platform team has also built a shared internal `flags-wrapper.ts`.

The platform team wants to:
1. Inventory every direct LaunchDarkly SDK call across services
2. Safely migrate the automatable ones to OpenFeature
3. Identify calls that require manual review (detail methods, dynamic keys, wrappers)
4. Enforce in CI that no new direct LD calls land after migration and manual review are complete

**LaunchDarkly remains the feature flag provider throughout.**
Only the application-facing call-site API changes: `ldClient.*Variation()` becomes
`openFeatureClient.get*Value()`.

---

## File Structure

```
enterprise-checkout-service/
  platform/
    feature-flags.ts      # bootstrap/provider file — excluded from CI enforcement
  src/
    checkout.ts           # boolVariation, stringVariation — safely automatable
    pricing.ts            # numberVariation, jsonVariation — safely automatable
    analytics.ts          # variationDetail, boolVariationDetail — manual review
    flags-wrapper.ts      # shared internal LD wrapper — manual review
    product.ts            # dynamic key + 2 static keys (partial auto-migration)
  before/                 # snapshot of src/ before migration
  after/                  # snapshot of src/ after flaglint migrate --apply
  generated-reports/
    inventory-report.md   # sample output of flaglint scan --format markdown
    migration-plan.md     # sample output of flaglint migrate --dry-run
    flaglint.sarif        # representative SARIF for GitHub Code Scanning
  .github/
    workflows/
      flaglint.yml        # CI workflow on Node.js 20 and 22
  .flaglintrc             # config with openFeatureClientBindings
```

---

## Automatable vs. Manual Review

| File | Call Type | Automatable |
|------|-----------|-------------|
| `src/checkout.ts` | boolVariation, stringVariation | Yes — 4 usages |
| `src/pricing.ts` | numberVariation, jsonVariation | Yes — 4 usages |
| `src/product.ts` | stringVariation, boolVariation (static keys) | Yes — 2 usages |
| `src/product.ts` | boolVariation (dynamic key) | No — dynamic key |
| `src/analytics.ts` | variationDetail, boolVariationDetail | No — detail methods |
| `src/analytics.ts` | allFlagsState | No — bulk call |
| `src/flags-wrapper.ts` | wrapper functions | No — shared wrapper |

---

## Walkthrough

### Step 1: Install

```bash
cd examples/enterprise-checkout-service
npm install
```

### Step 2: Scan — inventory all LaunchDarkly SDK calls

```bash
npx flaglint scan ./src --format html --output generated-reports/inventory-report.html
```

This produces an HTML report showing every direct LaunchDarkly call across all service files.
A Markdown version is already committed at `generated-reports/inventory-report.md`.

Expected output:
```
✓ 20 flag usages found across 11 unique flags
ℹ  1 dynamic flag key(s) require manual review
```

You can also output SARIF for GitHub Code Scanning:
```bash
npx flaglint scan ./src --format sarif --output generated-reports/flaglint.sarif
```

### Step 3: Review — generate the migration plan

```bash
npx flaglint migrate ./src --dry-run
```

This prints reviewable before/after diffs to stdout and identifies:
- 10 transformations with proven OpenFeature client bindings
- 9 call sites requiring manual review, with specific guidance for each

A sample output is committed at `generated-reports/migration-plan.md`.

### Step 4: Apply — automatically migrate the safe call sites

```bash
npx flaglint migrate ./src --apply
```

This rewrites only the safely automatable transformations in-place:

**src/checkout.ts before:**
```typescript
return ldClient.boolVariation("checkout-v2", ctx, false);
return ldClient.stringVariation("payment-provider", ctx, "stripe");
```

**src/checkout.ts after:**
```typescript
return openFeatureClient.getBooleanValue("checkout-v2", false, ctx);
return openFeatureClient.getStringValue("payment-provider", "stripe", ctx);
```

**src/pricing.ts before:**
```typescript
return ldClient.numberVariation("discount-percentage", ctx, 0);
return ldClient.jsonVariation("discount-config", ctx, fallback);
```

**src/pricing.ts after:**
```typescript
return openFeatureClient.getNumberValue("discount-percentage", 0, ctx);
return openFeatureClient.getObjectValue("discount-config", fallback, ctx);
```

The `before/` and `after/` directories in this demo contain committed snapshots of the
transformation so you can compare without running `--apply`.

`--apply` safety contracts:
- Refuses on a dirty git working tree unless `--allow-dirty`
- Only rewrites files where `openFeatureClient` is proven (via import from `platform/feature-flags`)
- Preserves flag key, fallback value, evaluation context, and `await` exactly
- Never touches detail methods, dynamic keys, bulk calls, or wrapper functions

### Step 5: Enforce in CI

```bash
npx flaglint validate ./src \
  --no-direct-launchdarkly \
  --bootstrap-exclude "platform/feature-flags.ts"
```

This exits 1 while the manual-review examples still contain direct LaunchDarkly
evaluations. That is expected for this demo: `analytics.ts`, `product.ts`, and
`flags-wrapper.ts` intentionally show detail methods, dynamic keys, bulk calls,
and wrapper abstractions that require human migration.

After those manual-review items are resolved, this same command becomes the CI
gate that keeps migration complete.

The `platform/feature-flags.ts` file contains intentional direct LaunchDarkly
SDK usage to wire the provider — this is excluded from enforcement.

**Expected output before manual review is complete:**
```
✗ validate --no-direct-launchdarkly: direct LaunchDarkly evaluation call(s) found.
```

**Expected output after manual review is complete:**
```
✓ validate --no-direct-launchdarkly: no direct LaunchDarkly evaluation calls found.
  Scanned 5 file(s). platform/feature-flags.ts excluded (bootstrap).
```

---

## Provider Configuration

The `.flaglintrc` in this demo configures FlagLint to recognize `openFeatureClient`
imported from `platform/feature-flags` as a proven binding for `--apply` eligibility:

```json
{
  "openFeatureClientBindings": [
    {
      "importName": "openFeatureClient",
      "modulePatterns": ["**/platform/feature-flags"]
    }
  ]
}
```

This means `--apply` will rewrite any file that imports `openFeatureClient` from
`platform/feature-flags` (or any path matching the glob), without requiring a local
`OpenFeature.getClient()` call in every service file.

---

## The Provider Setup (platform/feature-flags.ts)

```typescript
import { LaunchDarklyProvider } from "@launchdarkly/openfeature-node-server";
import { OpenFeature } from "@openfeature/server-sdk";

const ldProvider = new LaunchDarklyProvider(process.env.LD_SDK_KEY!);
await OpenFeature.setProviderAndWait(ldProvider);

export const openFeatureClient = OpenFeature.getClient("checkout-platform");
```

This is the only file that touches the LaunchDarkly SDK directly after migration.
LaunchDarkly continues to serve the feature flags. All services now call OpenFeature.

---

## CI Workflow

The `.github/workflows/flaglint.yml` in this demo runs the full pipeline on
Node.js 20 and 22:

1. Scan and upload SARIF to GitHub Code Scanning (PR annotations)
2. Generate migration plan as a downloadable artifact
3. Demonstrate the `--no-direct-launchdarkly` enforcement gate. In this demo
   it remains advisory until the manual-review examples are resolved.

See `generated-reports/` for committed sample outputs from this pipeline.

---

## Related

- [FlagLint README](../../README.md)
- [Supported API matrix](../../README.md#supported-api-matrix)
- [Configuration reference](../../README.md#configuration)
- [CI integration guide](../../README.md#ci-integration)
