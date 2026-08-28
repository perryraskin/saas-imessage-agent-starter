import { deriveSessionIdFromMCPSession, PostHogMCP, type ToolCallCaptureData } from "@posthog/mcp";
import type { SaasToolName } from "@/lib/agent/saas-adapter";

const metadata: Record<SaasToolName, { category: string; description: string; intent: string }> = {
  get_account_summary: { category: "account", description: "Read the authenticated user's account summary.", intent: "Review account status" },
  update_notification_preference: { category: "settings_mutation", description: "Update a reversible notification preference.", intent: "Change notification preferences" },
  undo_last_change: { category: "recovery", description: "Revert the latest eligible agent change.", intent: "Undo the last agent change" },
  get_handoff_link: { category: "navigation", description: "Create an authorized deep link to the SaaS UI.", intent: "Open the relevant product view" },
  submit_product_feedback: { category: "product_feedback", description: "Submit product feedback through the canonical SaaS feedback system.", intent: "Send product feedback" },
};

let instance: PostHogMCP | null = null;

function client(): PostHogMCP | null {
  if (instance) return instance;
  const apiKey = process.env.POSTHOG_PROJECT_API_KEY?.trim();
  const host = process.env.POSTHOG_HOST?.trim();
  if (!apiKey || !host) return null;
  instance = new PostHogMCP(apiKey, { host, flushAt: 1, flushInterval: 0, requestTimeout: 5_000 });
  return instance;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

/** Safe shape only: no message, account, feedback, URL, or domain values. */
export function summarizeParameters(tool: SaasToolName, input: unknown): Record<string, unknown> {
  const data = record(input);
  switch (tool) {
    case "update_notification_preference":
      return { preference_supplied: typeof data.preference === "string" };
    case "submit_product_feedback":
      return { feedback_supplied: typeof data.feedback === "string", contact_permission: data.contactPermission === true };
    case "get_handoff_link":
      return { destination_kind_supplied: typeof data.destination === "string" };
    default:
      return { input_supplied: Object.keys(data).length > 0 };
  }
}

export function summarizeResponse(result: unknown): Record<string, unknown> {
  const data = record(result);
  return {
    ok: data.ok === true,
    ...(typeof data.changed === "boolean" ? { changed: data.changed } : {}),
    ...(typeof data.reverted === "boolean" ? { reverted: data.reverted } : {}),
    ...(typeof data.submitted === "boolean" ? { submitted: data.submitted } : {}),
    ...(typeof data.url === "string" ? { handoff_created: true } : {}),
    ...(data.ok === true ? {} : { error_type: typeof data.error === "string" ? "tool_error" : "unknown" }),
  };
}

export function buildMcpToolCall(input: {
  userId: string;
  tool: SaasToolName;
  toolInput: unknown;
  result: unknown;
  durationMs: number;
  conversationId?: string;
  testAccount?: boolean;
}): ToolCallCaptureData {
  const info = metadata[input.tool];
  const response = summarizeResponse(input.result);
  return {
    distinctId: input.userId,
    ...(input.conversationId ? { sessionId: deriveSessionIdFromMCPSession(input.conversationId) } : {}),
    toolName: input.tool,
    toolDescription: info.description,
    category: info.category,
    intent: info.intent,
    intentSource: "inferred",
    parameters: summarizeParameters(input.tool, input.toolInput),
    response,
    durationMs: Math.max(0, Math.round(input.durationMs)),
    isError: response.ok !== true,
    ...(response.ok === true ? {} : { errorType: String(response.error_type ?? "tool_error") }),
    properties: {
      $mcp_server_name: "saas-imessage-agent-tools",
      $mcp_client_name: "eve",
      channel: "imessage",
      privacy_mode: "metadata_only",
      ...(input.testAccount ? { is_test_account: true } : {}),
    },
  };
}

export async function captureMcpToolCall(input: Parameters<typeof buildMcpToolCall>[0]): Promise<void> {
  const posthog = client();
  if (!posthog) return;
  try {
    posthog.captureToolCall(buildMcpToolCall(input));
    // captureToolCall transforms asynchronously before enqueue; yield before flush.
    await new Promise<void>((resolve) => setImmediate(resolve));
    await posthog.flush();
  } catch {
    // Analytics must never change the user's tool outcome.
  }
}
