import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ open: vi.fn(), seal: vi.fn(), start: vi.fn() }));
vi.mock("@/lib/imessage/security", () => ({ openImessageEvent: mocks.open, sealImessageEvent: mocks.seal }));
vi.mock("workflow/api", () => ({ start: mocks.start }));
vi.mock("@/workflows/imessage-event", () => ({ imessageEventWorkflow: vi.fn() }));

const { POST } = await import("./route");
const eventId = "2915e81c-5068-4796-ace2-21d2c94ad298";
const secret = "operator-canary-secret-with-at-least-32-characters";
const envelope = { eventId, sealedEvent: "s".repeat(128), message: "Run the provider delivery check" };
const source = {
  api_version: "v3" as const,
  webhook_version: "1",
  event_type: "message.received" as const,
  event_id: eventId,
  created_at: "2026-08-28T12:00:00.000Z",
  trace_id: "source-trace",
  partner_id: "partner",
  data: {
    id: "source-message",
    direction: "inbound" as const,
    service: "iMessage",
    chat: { id: "dedicated-canary-chat", is_group: false },
    sender_handle: { handle: "+15555550100" },
    parts: [{ type: "text" as const, value: "source" }],
  },
};

function request(token?: string) {
  return new Request("https://channel.example/api/internal/imessage/canary", {
    method: "POST",
    headers: { "content-type": "application/json", ...(token ? { "x-imessage-canary-token": token } : {}) },
    body: JSON.stringify(envelope),
  });
}

describe("provider delivery canary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.IMESSAGE_ENABLED = "true";
    process.env.IMESSAGE_PROVIDER_CANARY_ENABLED = "true";
    process.env.IMESSAGE_PROVIDER_CANARY_SECRET = secret;
    process.env.IMESSAGE_PROVIDER_CANARY_CHAT_ID = source.data.chat.id;
    mocks.open.mockReturnValue(source);
    mocks.seal.mockReturnValue("fresh-sealed-event");
    mocks.start.mockResolvedValue({ runId: "wrun-provider-canary" });
  });

  afterEach(() => {
    delete process.env.IMESSAGE_ENABLED;
    delete process.env.IMESSAGE_PROVIDER_CANARY_ENABLED;
    delete process.env.IMESSAGE_PROVIDER_CANARY_SECRET;
    delete process.env.IMESSAGE_PROVIDER_CANARY_CHAT_ID;
  });

  it("is invisible while disabled", async () => {
    process.env.IMESSAGE_PROVIDER_CANARY_ENABLED = "false";
    expect((await POST(request(secret))).status).toBe(404);
    expect(mocks.open).not.toHaveBeenCalled();
  });

  it("requires the independent operator credential", async () => {
    expect((await POST(request())).status).toBe(401);
    expect(mocks.start).not.toHaveBeenCalled();
  });

  it("cannot target a chat other than the dedicated canary binding", async () => {
    process.env.IMESSAGE_PROVIDER_CANARY_CHAT_ID = "another-chat";
    expect((await POST(request(secret))).status).toBe(403);
    expect(mocks.start).not.toHaveBeenCalled();
  });

  it("re-seals a genuine event with fresh identity and bounded canary text", async () => {
    const response = await POST(request(secret));
    expect(response.status).toBe(202);
    const body = await response.json() as { eventId: string; runId: string };
    expect(body.runId).toBe("wrun-provider-canary");
    expect(body.eventId).not.toBe(eventId);
    expect(mocks.seal).toHaveBeenCalledWith(expect.objectContaining({
      event_id: body.eventId,
      created_at: expect.any(String),
      trace_id: expect.stringMatching(/^provider-canary-/),
      data: expect.objectContaining({
        id: expect.not.stringMatching(/^source-message$/),
        chat: source.data.chat,
        sender_handle: source.data.sender_handle,
        parts: [{ type: "text", value: envelope.message }],
      }),
    }));
    expect(mocks.start).toHaveBeenCalledWith(expect.any(Function), [{ eventId: body.eventId, sealedEvent: "fresh-sealed-event" }]);
  });
});
