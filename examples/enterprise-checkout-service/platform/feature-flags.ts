/**
 * platform/feature-flags.ts
 *
 * One-time bootstrap file — LaunchDarkly remains the provider.
 * This file is excluded from `flaglint validate --no-direct-launchdarkly`
 * via the --bootstrap-exclude flag and the .flaglintrc config below.
 *
 * Direct LaunchDarkly SDK usage here is intentional:
 * it wires the LaunchDarkly provider into OpenFeature so that
 * every other service can use OpenFeature without being
 * coupled to the LaunchDarkly SDK directly.
 *
 * Do NOT call ldClient.variation() outside this file.
 */

import { LaunchDarklyProvider } from "@launchdarkly/openfeature-node-server";
import { OpenFeature } from "@openfeature/server-sdk";

if (!process.env.LD_SDK_KEY) {
  throw new Error(
    "LD_SDK_KEY environment variable is required for feature flag bootstrap"
  );
}

// Register LaunchDarkly as the OpenFeature provider.
// LaunchDarkly continues to serve feature flags.
// All application services call OpenFeature, not the LaunchDarkly SDK directly.
const ldProvider = new LaunchDarklyProvider(process.env.LD_SDK_KEY);
await OpenFeature.setProviderAndWait(ldProvider);

// Evaluation context: use `targetingKey` for OpenFeature compliance.
// LaunchDarkly also accepts `key` — both are forwarded by the provider.
export const openFeatureClient = OpenFeature.getClient("checkout-platform");

export type EvaluationContext = {
  targetingKey: string;
  [key: string]: unknown;
};
