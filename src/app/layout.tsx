import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SAAS_APP_URL || "https://saas-imessage-agent-starter.vercel.app"),
  title: "SaaS iMessage Agent Starter",
  description: "A production-minded iMessage agent channel for SaaS products, built with Eve, Vercel, Linq, durable workflows, safe tools, analytics, and real channel testing.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
