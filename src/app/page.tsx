import { MessageSimulator } from "@/components/message-simulator";

const pillars = [
  ["Durable agent", "Each conversation is an Eve session. Provider events enter a retryable Workflow instead of a fragile one-shot function."],
  ["Real SaaS boundary", "The model gets bounded tools. Your product service reauthorizes every read and write and remains the source of truth."],
  ["Native messages", "Plain text, short bubbles, live typing state, and standalone URLs designed for Apple's rich previews."],
  ["Safe action", "Clear low-risk writes execute once, create an audit record, and can be undone. High-risk actions stay unavailable."],
  ["Observable by default", "PostHog MCP Analytics captures safe tool metadata, latency, success, failure, and test-account markers—not message content."],
  ["Test the real path", "Contract tests, deployed Eve evals, provider canaries, and a physical iPhone checklist catch what mocked chat tests miss."],
];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <span className="eyebrow">Open-source starter</span>
        <h1>Give your SaaS a great iMessage agent.</h1>
        <p className="lede">A production-minded starting point for meeting users where they already are—without turning your model into an unaudited database client.</p>
        <div className="actions">
          <a className="primary" href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fperryraskin%2Fsaas-imessage-agent-starter&project-name=saas-imessage-agent&repository-name=saas-imessage-agent">Deploy simulator to Vercel</a>
          <a className="secondary" href="https://github.com/perryraskin/saas-imessage-agent-starter">View on GitHub</a>
        </div>
      </section>

      <section className="architecture" aria-labelledby="architecture-title">
        <div>
          <span className="eyebrow">The boundary that matters</span>
          <h2 id="architecture-title">Agentic orchestration, deterministic product authority.</h2>
        </div>
        <pre>{`Linq / iMessage
       │ signed webhook
       ▼
Durable Workflow ── dedupe · order · retry
       │
       ▼
Eve session ─────── context · tools · trace
       │ actor-scoped internal calls
       ▼
Your SaaS services ─ authz · writes · audit · undo
       │
       ├── PostHog MCP Analytics (metadata only)
       └── Exact UI link + privacy-safe OG preview`}</pre>
      </section>

      <section className="pillars">
        {pillars.map(([title, copy]) => <article key={title}><h3>{title}</h3><p>{copy}</p></article>)}
      </section>

      <section className="simulator">
        <span className="eyebrow">Zero-config demo</span>
        <h2>See how an agent response becomes iMessage.</h2>
        <p>The deploy button ships this safe simulator immediately. Real delivery stays disabled until you connect Linq and implement the authorization-aware SaaS adapter.</p>
        <MessageSimulator />
      </section>

      <section className="next">
        <h2>Production checklist</h2>
        <ol>
          <li>Deploy the simulator and run the test suite.</li>
          <li>Implement the five methods in <code>src/lib/agent/saas-adapter.ts</code>.</li>
          <li>Link Linq through Vercel Connect and configure signed webhooks.</li>
          <li>Add consent-first account linking, pause, unlink, retention, and support policies.</li>
          <li>Enable the channel for test accounts, run deployed evals twice, then test a physical iPhone.</li>
        </ol>
      </section>
    </main>
  );
}
