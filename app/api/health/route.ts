import { NextResponse } from "next/server";
import { DEFAULT_CHAT_MODEL, isOpenRouterConfigured } from "@/lib/openrouter";
import { amlrArticles, trainingModules } from "@/lib/catalog";
import { listRoles } from "@/lib/store";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    model: DEFAULT_CHAT_MODEL,
    openrouter_configured: isOpenRouterConfigured(),
    catalog: {
      roles: listRoles().length,
      amlr_articles: amlrArticles.length,
      training_modules: trainingModules.length,
    },
  });
}
