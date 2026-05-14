/** OpenAI-compatible base URL for OpenRouter. */
export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

/** Google Gemini 3.1 Pro (preview) — higher quality when cost/latency are less critical. */
export const GEMINI_3_1_PRO_PREVIEW = "google/gemini-3.1-pro-preview";

/** Google Gemini 2.5 Flash — recommended balance of cost, speed, and quality. */
export const GEMINI_2_5_FLASH = "google/gemini-2.5-flash";

/** Used by `/api/openrouter/chat` when the request body omits `model`. */
export const DEFAULT_CHAT_MODEL = GEMINI_2_5_FLASH;
