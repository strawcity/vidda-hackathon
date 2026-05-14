export function getOpenRouterApiKey(): string | undefined {
  return process.env.OPENROUTER_API_KEY?.trim() || undefined;
}

export function isOpenRouterConfigured(): boolean {
  return Boolean(getOpenRouterApiKey());
}

export function requireOpenRouterApiKey(): string {
  const key = getOpenRouterApiKey();
  if (!key) {
    throw new Error(
      "Missing OPENROUTER_API_KEY. Copy .env.example to .env.local and add your key."
    );
  }
  return key;
}
