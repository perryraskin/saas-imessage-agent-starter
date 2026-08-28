import { z } from "zod";

export const IMESSAGE_MAX_EVENT_BYTES = 64 * 1024;
export const IMESSAGE_MAX_REPLY_CHARACTERS = 1_400;
export const IMESSAGE_EVENT_MAX_AGE_MS = 15 * 60 * 1_000;
export const IMESSAGE_EVENT_MAX_FUTURE_SKEW_MS = 2 * 60 * 1_000;

const handleSchema = z.object({
  handle: z.string().trim().min(3).max(320),
  id: z.string().trim().min(1).max(128).optional(),
  is_me: z.boolean().optional(),
  service: z.string().max(32).optional(),
}).passthrough();

const messagePartSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), value: z.string().max(10_000) }).passthrough(),
  z.object({ type: z.literal("media") }).passthrough(),
  z.object({ type: z.literal("link") }).passthrough(),
]);

export const linqMessageReceivedEventSchema = z.object({
  api_version: z.literal("v3"),
  webhook_version: z.string().max(32),
  event_type: z.literal("message.received"),
  event_id: z.string().uuid(),
  created_at: z.string().datetime({ offset: true }),
  trace_id: z.string().trim().min(1).max(128),
  partner_id: z.string().max(128),
  data: z.object({
    id: z.string().min(1).max(128),
    direction: z.literal("inbound"),
    service: z.string().max(32),
    chat: z.object({ id: z.string().min(1).max(128), is_group: z.boolean() }).passthrough(),
    sender_handle: handleSchema,
    parts: z.array(messagePartSchema).max(100),
  }).passthrough(),
}).strict();

export type LinqMessageReceivedEvent = z.infer<typeof linqMessageReceivedEventSchema>;

export function eventIsFresh(event: LinqMessageReceivedEvent, now = Date.now()): boolean {
  const createdAt = Date.parse(event.created_at);
  return createdAt >= now - IMESSAGE_EVENT_MAX_AGE_MS
    && createdAt <= now + IMESSAGE_EVENT_MAX_FUTURE_SKEW_MS;
}

export function eventText(event: LinqMessageReceivedEvent): string {
  return event.data.parts
    .filter((part): part is Extract<(typeof event.data.parts)[number], { type: "text" }> => part.type === "text")
    .map((part) => part.value.trim())
    .filter(Boolean)
    .join("\n")
    .slice(0, 2_000);
}
