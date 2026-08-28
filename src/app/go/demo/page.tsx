import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account ready · SaaS Assistant",
  description: "A privacy-safe example of an exact iMessage-to-product handoff.",
  openGraph: {
    title: "Your account is ready",
    description: "Open the exact product view your assistant referenced.",
    images: ["/api/og?title=Your%20account%20is%20ready&detail=2%20items%20need%20attention"],
  },
};

export default function DemoHandoff() {
  return <main><section className="hero"><span className="eyebrow">Exact handoff example</span><h1>Your account is ready.</h1><p className="lede">In a real product, this route validates a short-lived token, reauthorizes the signed-in user, and lands on the exact record or action—without exposing private data to link-preview crawlers.</p><a className="secondary" href="/">Back to the starter</a></section></main>;
}
