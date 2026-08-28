"use client";

import { useState } from "react";

const sample = "**Your account is on Pro.**\n- 2 open items\n- Weekly updates are on\n\n[Open the exact account view](https://example.com/account).";

export function MessageSimulator() {
  const [source, setSource] = useState(sample);
  const [messages, setMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function render() {
    setLoading(true);
    try {
      const response = await fetch("/api/demo/render", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: source }) });
      const result = await response.json() as { messages?: string[] };
      setMessages(result.messages ?? []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="simulator-grid">
      <div>
        <label htmlFor="source">Model output</label>
        <textarea id="source" value={source} onChange={(event) => setSource(event.target.value)} />
        <button type="button" onClick={render} disabled={loading}>{loading ? "Rendering…" : "Render for iMessage"}</button>
      </div>
      <div className="phone" aria-live="polite">
        <div className="phone-title">Messages preview</div>
        {messages.length === 0 ? <p className="empty">Try the sample to see Markdown removed and links split into their own preview-ready bubble.</p> : messages.map((message, index) => (
          <div className={/^https?:\/\//u.test(message) ? "bubble link-bubble" : "bubble"} key={`${index}-${message}`}>
            {/^https?:\/\//u.test(message) ? <a href={message}>{message}</a> : message}
          </div>
        ))}
      </div>
    </div>
  );
}
