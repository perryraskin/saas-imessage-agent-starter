import { describe, expect, it } from "vitest";
import { runtimeLimits, workflowPolicy } from "./runtime-policy";

const usage = (inputTokens: number, cacheReadTokens = 0) => ({
  inputTokens, cacheReadTokens, cacheWriteTokens: 0, outputTokens: 0,
});

describe("agent runtime policy", () => {
  it("requests deletion of completed Workflow payloads", () => {
    expect(workflowPolicy.retention).toBe(0);
  });

  it("keeps an explicit 30-day idle timeout", () => {
    expect(runtimeLimits.sessionTimeoutMs).toBe(2_592_000_000);
  });

  it("stops at the input-token boundary, including cache reads", () => {
    const check = runtimeLimits.sessionUsage!;
    expect(check({ total: usage(1_999_999), window: usage(1_999_999) })).toBe(false);
    expect(check({ total: usage(2_000_000), window: usage(2_000_000, 1_900_000) })).toBe(true);
    expect(check({ total: usage(2_000_001), window: usage(2_000_001) })).toBe(true);
  });

  it("allows a new window after an approved continuation, not an uncapped session", () => {
    const check = runtimeLimits.sessionUsage!;
    expect(check({ total: usage(3_000_000), window: usage(1_000_000) })).toBe(false);
    expect(check({ total: usage(4_000_000), window: usage(2_000_000) })).toBe(true);
  });
});
