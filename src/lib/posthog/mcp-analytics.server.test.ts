import { describe, expect, it } from "vitest";
import { buildMcpToolCall, summarizeParameters } from "./mcp-analytics.server";

describe("metadata-only MCP Analytics", () => {
  it("records feedback shape without feedback content", () => {
    const summary = summarizeParameters("submit_product_feedback", { feedback: "My private feedback", contactPermission: true });
    expect(summary).toEqual({ feedback_supplied: true, contact_permission: true });
    expect(JSON.stringify(summary)).not.toContain("private");
  });

  it("derives opaque sessions and omits raw inputs and responses", () => {
    const event = buildMcpToolCall({
      userId: "user-1",
      tool: "get_handoff_link",
      toolInput: { destination: "billing", privateId: "account-secret" },
      result: { ok: true, url: "https://example.com/signed-secret" },
      durationMs: 12,
      conversationId: "raw-provider-conversation",
    });
    const serialized = JSON.stringify(event);
    expect(serialized).not.toContain("account-secret");
    expect(serialized).not.toContain("signed-secret");
    expect(serialized).not.toContain("raw-provider-conversation");
    expect(event.properties).toMatchObject({ channel: "imessage", privacy_mode: "metadata_only" });
  });
});
