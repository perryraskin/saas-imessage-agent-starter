import { dispatchToAgent } from "./agent.server";
import { eventText, type LinqMessageReceivedEvent } from "./contracts";
import { markChatRead, sendImessage, startTyping, stopTyping } from "./provider.server";
import { hashSenderHandle } from "./security";
import { assertRealChannelReady, resolveLinkedActor, updateChannelStatus } from "../agent/saas-adapter";

const STOP_PATTERN = /^\s*(?:stop|unsubscribe|pause|opt[ -]?out)\s*[.!]?\s*$/iu;
const RESUME_PATTERN = /^\s*(?:resume|start|opt[ -]?in)\s*[.!]?\s*$/iu;

export async function processImessageEvent(event: LinqMessageReceivedEvent): Promise<string> {
  assertRealChannelReady();
  const chatId = event.data.chat.id;
  const text = eventText(event);
  if (event.data.chat.is_group || !text) return "ignored";

  await Promise.allSettled([markChatRead(chatId), startTyping(chatId)]);
  const actor = await resolveLinkedActor(hashSenderHandle(event.data.sender_handle.handle));
  if (!actor) {
    await stopTyping(chatId).catch(() => undefined);
    await sendImessage({
      chatId,
      idempotencyKey: `${event.event_id}:link`,
      text: `Link your account to continue.\n${process.env.SAAS_APP_URL || "http://localhost:3000"}/connect/imessage`,
    });
    return "link_required";
  }

  if (STOP_PATTERN.test(text)) {
    await updateChannelStatus(actor.actorId, "paused");
    await stopTyping(chatId).catch(() => undefined);
    await sendImessage({ chatId, idempotencyKey: `${event.event_id}:paused`, text: "You’re paused. Reply RESUME whenever you want to continue." });
    return "paused";
  }
  if (RESUME_PATTERN.test(text)) {
    await updateChannelStatus(actor.actorId, "active");
    await stopTyping(chatId).catch(() => undefined);
    await sendImessage({ chatId, idempotencyKey: `${event.event_id}:resumed`, text: "You’re back on. What can I help with?" });
    return "resumed";
  }
  if (actor.status !== "active") {
    await stopTyping(chatId).catch(() => undefined);
    await sendImessage({ chatId, idempotencyKey: `${event.event_id}:still-paused`, text: "Messages are paused. Reply RESUME to turn them back on." });
    return "still_paused";
  }

  await dispatchToAgent({ chatId, conversationId: actor.conversationId, eventId: event.event_id, message: text, userId: actor.actorId });
  return "dispatched";
}
