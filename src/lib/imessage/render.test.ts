import { describe, expect, it } from "vitest";
import { renderImessageMessages } from "./render";

describe("renderImessageMessages", () => {
  it("removes Markdown and sends URLs in their own bubbles", () => {
    expect(renderImessageMessages("**Account**\n- Plan: Pro\n[Open billing](https://example.com/billing)."))
      .toEqual(["Account\n• Plan: Pro\nOpen billing.", "https://example.com/billing"]);
  });

  it("deduplicates links and preserves readable copy", () => {
    expect(renderImessageMessages("Open https://example.com/a, then https://example.com/a."))
      .toEqual(["Open, then.", "https://example.com/a"]);
  });

  it("splits long responses into provider-safe bubbles", () => {
    const messages = renderImessageMessages("word ".repeat(500));
    expect(messages.length).toBeGreaterThan(1);
    expect(messages.every((message) => message.length <= 1_400)).toBe(true);
  });
});
