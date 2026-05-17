/**
 * POST /api/roles/[id]/generate-plan
 *
 * The main pipeline entry point. Runs the LLM, validates output, stores the
 * resulting plan as a draft, and returns it.
 */
import { NextResponse } from "next/server";
import { getRole, savePlan, shortId } from "@/lib/store";
import { generatePlanForRole } from "@/lib/pipeline";

// Generating a plan can take 5–15s; tell Next.js not to time out at 10s.
export const maxDuration = 60;

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const role = getRole(id);
  if (!role) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }

  try {
    const plan = await generatePlanForRole(role);
    const now = new Date().toISOString();
    const stored = savePlan({
      id: shortId("plan"),
      role_id: role.id,
      status: "draft",
      plan,
      created_at: now,
      updated_at: now,
    });
    return NextResponse.json(stored, { status: 201 });
  } catch (err: unknown) {
    console.error("[generate-plan] failed:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Plan generation failed", detail: message },
      { status: 502 },
    );
  }
}
