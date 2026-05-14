import { NextResponse } from "next/server";
import { isOpenRouterConfigured } from "@/lib/openrouter";

export function GET() {
  return NextResponse.json({
    configured: isOpenRouterConfigured(),
  });
}
