import { defineAgent } from "eve";

export default defineAgent({
  model: process.env.EVE_MODEL?.trim() || "openai/gpt-5.6-luna",
});
