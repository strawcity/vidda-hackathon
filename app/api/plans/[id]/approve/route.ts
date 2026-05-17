import { NextResponse } from "next/server";
import { getPlan, updatePlan } from "@/lib/store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!getPlan(id)) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }
  const updated = updatePlan(id, { status: "approved" });
  return NextResponse.json(updated);
}
