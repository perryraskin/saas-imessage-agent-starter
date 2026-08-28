import { defineEval } from "eve/evals";
import { includes, satisfies } from "eve/evals/expect";
import { finalAssistantMessage, sendViaChannel } from "./channel-harness";

export default defineEval({
  description: "An iMessage-shaped turn uses the live SaaS tool and returns native plain text.",
  tags: ["channel-e2e", "read"],
  timeoutMs: 90_000,
  async test(t) {
    const session = await sendViaChannel(t, `summary-${crypto.randomUUID()}`, "What's going on with my account?");
    session.succeeded();
    session.calledTool("get_account_summary", { status: "completed", count: 1 });
    const final = finalAssistantMessage(session.events);
    t.check(final, includes(/starter|open|account/i));
    t.check(final, satisfies((text) => !/(?:\*\*|\[[^\]]+\]\(|^#{1,6}\s|^[-*+]\s)/mu.test(String(text)), "reply contains no Markdown syntax"));
  },
});
