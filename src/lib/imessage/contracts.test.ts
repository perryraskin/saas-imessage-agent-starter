import { describe, expect, it } from "vitest";
import { eventIsFresh, eventText, linqMessageReceivedEventSchema } from "./contracts";

function payload(createdAt = new Date().toISOString()) {
  return {
    api_version: "v3",
    webhook_version: "1",
    event_type: "message.received",
    event_id: "2915e81c-5068-4796-ace2-21d2c94ad298",
    created_at: createdAt,
    trace_id: "trace",
    partner_id: "partner",
    data: {
      id: "message",
      direction: "inbound",
      service: "iMessage",
      chat: { id: "chat", is_group: false },
      sender_handle: { handle: "+15555550100" },
      parts: [{ type: "text", value: " Hello " }, { type: "text", value: "there" }],
    },
  };
}

describe("Linq contracts", () => {
  it("accepts a bounded message and extracts text", () => {
    const event = linqMessageReceivedEventSchema.parse(payload());
    expect(eventText(event)).toBe("Hello\nthere");
    expect(eventIsFresh(event)).toBe(true);
  });

  it("rejects stale events", () => {
    const event = linqMessageReceivedEventSchema.parse(payload(new Date(Date.now() - 16 * 60_000).toISOString()));
    expect(eventIsFresh(event)).toBe(false);
  });

  it("rejects unexpected event fields at the outer boundary", () => {
    expect(linqMessageReceivedEventSchema.safeParse({ ...payload(), injected: true }).success).toBe(false);
  });
});
