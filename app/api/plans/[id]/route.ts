import { NextRequest, NextResponse } from "next/server";
import { getPlan, updatePlan } from "@/lib/store";
import { GeneratedPlanSchema, PlanStatusSchema } from "@/lib/schemas";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const plan = getPlan(id);
  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }
  return NextResponse.json(plan);
}

/**
 * PATCH /api/plans/[id]
 * Accepts { plan?: GeneratedPlan, status?: PlanStatus }
 * Used by the human reviewer to edit modules / rationale / status.
 */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const existing = getPlan(id);
  if (!existing) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  let body: { plan?: unknown; status?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const patch: { plan?: typeof existing.plan; status?: typeof existing.status } = {};

  if (body.plan !== undefined) {
    const parsed = GeneratedPlanSchema.safeParse(body.plan);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid plan payload", issues: parsed.error.issues },
        { status: 400 },
      );
    }
    patch.plan = parsed.data;
  }

  if (body.status !== undefined) {
    const parsed = PlanStatusSchema.safeParse(body.status);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    patch.status = parsed.data;
  }

  if (patch.plan === undefined && patch.status === undefined) {
    return NextResponse.json(
      { error: "Provide at least one of: plan, status" },
      { status: 400 },
    );
  }

  const updated = updatePlan(id, patch);
  return NextResponse.json(updated);
}
