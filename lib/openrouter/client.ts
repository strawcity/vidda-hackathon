import OpenAI from "openai";
import { OPENROUTER_BASE_URL } from "./constants";
import { requireOpenRouterApiKey } from "./env";

export { OPENROUTER_BASE_URL };

/**
 * OpenRouter is OpenAI-API compatible; use the official SDK with a custom baseURL.
 * @see https://openrouter.ai/docs/guides/community/frameworks-and-integrations-overview
 */
export function createOpenRouterClient(): OpenAI {
  const siteUrl = process.env.OPENROUTER_SITE_URL?.trim();
  const appName = process.env.OPENROUTER_APP_NAME?.trim();

  return new OpenAI({
    apiKey: requireOpenRouterApiKey(),
    baseURL: OPENROUTER_BASE_URL,
    defaultHeaders: {
      ...(siteUrl ? { "HTTP-Referer": siteUrl } : {}),
      ...(appName ? { "X-Title": appName } : {}),
    },
  });
}
