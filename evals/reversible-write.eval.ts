import { defineEval } from "eve/evals";
import { includes } from "eve/evals/expect";
import { sendViaChannel } from "./channel-harness";

export default defineEval({
  description: "A clear low-risk preference write executes without a confirmation loop and remains undoable.",
  tags: ["channel-e2e", "write", "undo"],
  timeoutMs: 120_000,
  async test(t) {
    const conversationId = `write-${crypto.randomUUID()}`;
    const changed = await sendViaChannel(t, conversationId, "Set my notification preference to weekly.");
    changed.succeeded();
    changed.calledTool("update_notification_preference", { status: "completed", count: 1 });
    changed.notCalledTool("ask_question");
    t.check(changed.transcript, includes(/weekly/i));
    t.check(changed.transcript, includes(/undo/i));

    const undone = await sendViaChannel(t, conversationId, "Undo that.");
    undone.succeeded();
    undone.calledTool("undo_last_change", { status: "completed", count: 1 });
    t.check(undone.transcript, includes(/undo|revert/i));
  },
});
