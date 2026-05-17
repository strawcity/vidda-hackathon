import { NextResponse } from "next/server";
import { getRole } from "@/lib/store";
import { articlesForRole } from "@/lib/catalog";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const role = getRole(id);
  if (!role) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }
  const articles = articlesForRole(role.id, role.applicable_amlr_articles);
  return NextResponse.json({ role, applicable_articles: articles });
}
