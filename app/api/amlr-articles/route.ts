import { NextResponse } from "next/server";
import { amlrArticles } from "@/lib/catalog";

export async function GET() {
  return NextResponse.json({ articles: amlrArticles });
}
