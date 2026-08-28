import { afterEach, describe, expect, it } from "vitest";
import { authorizedInternalRequest, openImessageEvent, sealImessageEvent } from "./security";

const oldInternal = process.env.AGENT_INTERNAL_SECRET;
const oldSealing = process.env.IMESSAGE_EVENT_SEALING_KEY;

afterEach(() => {
  process.env.AGENT_INTERNAL_SECRET = oldInternal;
  process.env.IMESSAGE_EVENT_SEALING_KEY = oldSealing;
});

describe("iMessage security", () => {
  it("uses constant-shape bearer authorization", () => {
    process.env.AGENT_INTERNAL_SECRET = "a".repeat(32);
    expect(authorizedInternalRequest(new Request("https://example.com", { headers: { authorization: `Bearer ${"a".repeat(32)}` } }))).toBe(true);
    expect(authorizedInternalRequest(new Request("https://example.com", { headers: { authorization: "Bearer wrong" } }))).toBe(false);
  });

  it("seals provider data before durable workflow storage", () => {
    process.env.IMESSAGE_EVENT_SEALING_KEY = "b".repeat(32);
    const event = {
      api_version: "v3" as const,
      webhook_version: "1",
      event_type: "message.received" as const,
      event_id: "2915e81c-5068-4796-ace2-21d2c94ad298",
      created_at: new Date().toISOString(),
      trace_id: "trace",
      partner_id: "partner",
      data: {
        id: "message",
        direction: "inbound" as const,
        service: "iMessage",
        chat: { id: "chat", is_group: false },
        sender_handle: { handle: "+15555550100" },
        parts: [{ type: "text" as const, value: "private message" }],
      },
    };
    const sealed = sealImessageEvent(event);
    expect(sealed).not.toContain("private message");
    expect(openImessageEvent(sealed)).toEqual(event);
  });
});
