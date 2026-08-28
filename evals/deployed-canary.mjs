import { spawnSync } from "node:child_process";

const url = process.env.CHANNEL_EVAL_TARGET_URL?.trim();
const secret = process.env.CHANNEL_EVAL_SECRET?.trim();
if (!url) throw new Error("CHANNEL_EVAL_TARGET_URL is required.");
if (!secret || secret.length < 32) throw new Error("CHANNEL_EVAL_SECRET must contain at least 32 characters.");

const result = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["eve", "eval", "--tag", "channel-e2e", "--url", url, "--strict", "--verbose"],
  { stdio: "inherit", env: { ...process.env, EVE_EVAL_AUTH_TOKEN: secret } },
);
if (result.error) throw result.error;
process.exit(result.status ?? 1);
