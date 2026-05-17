import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAssignment, getPlan, updateAssignment } from "@/lib/store";
import { AssignmentStatusSchema } from "@/lib/schemas";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const assignment = getAssignment(id);
  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }
  const plan = getPlan(assignment.plan_id);
  return NextResponse.json({ ...assignment, plan: plan?.plan });
}

const PatchBodySchema = z.object({
  status: AssignmentStatusSchema.optional(),
  progress_pct: z.number().int().min(0).max(100).optional(),
});

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  if (!getAssignment(id)) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = PatchBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  if (parsed.data.status === undefined && parsed.data.progress_pct === undefined) {
    return NextResponse.json(
      { error: "Provide status or progress_pct" },
      { status: 400 },
    );
  }

  const updated = updateAssignment(id, parsed.data);
  return NextResponse.json(updated);
}
