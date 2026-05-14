import { NextResponse } from "next/server";
import {
  DEFAULT_CHAT_MODEL,
  createOpenRouterClient,
  getOpenRouterApiKey,
} from "@/lib/openrouter";

type Role = "system" | "user" | "assistant";

type ChatMessage = {
  role: Role;
  content: string;
};

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const m = value as Record<string, unknown>;
  const role = m.role;
  const content = m.content;
  return (
    (role === "system" || role === "user" || role === "assistant") &&
    typeof content === "string"
  );
}

export async function POST(req: Request) {
  if (!getOpenRouterApiKey()) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY is not set" },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Expected JSON object" }, { status: 400 });
  }

  const rawMessages = (body as { messages?: unknown }).messages;
  const rawModel = (body as { model?: unknown }).model;

  if (!Array.isArray(rawMessages) || !rawMessages.every(isChatMessage)) {
    return NextResponse.json(
      { error: "Expected messages: Array<{ role, content }>" },
      { status: 400 }
    );
  }

  const modelId =
    typeof rawModel === "string" && rawModel.trim()
      ? rawModel.trim()
      : DEFAULT_CHAT_MODEL;

  try {
    const client = createOpenRouterClient();
    const completion = await client.chat.completions.create({
      model: modelId,
      messages: rawMessages,
    });

    const choice = completion.choices[0]?.message;
    return NextResponse.json({
      model: completion.model,
      content: choice?.content ?? null,
      usage: completion.usage,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "OpenRouter request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
