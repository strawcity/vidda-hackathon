import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPlan, saveAssignment, shortId } from "@/lib/store";

const AssignBodySchema = z.object({
  employee_name: z.string().min(1),
  employee_email: z.string().email().optional(),
  due_at: z.string().optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const plan = getPlan(id);
  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }
  if (plan.status !== "approved") {
    return NextResponse.json(
      {
        error: `Plan must be approved before assignment (current status: ${plan.status})`,
      },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = AssignBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid assignment payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const assignment = saveAssignment({
    id: shortId("asg"),
    plan_id: id,
    employee_name: parsed.data.employee_name,
    employee_email: parsed.data.employee_email,
    status: "assigned",
    progress_pct: 0,
    assigned_at: new Date().toISOString(),
    due_at: parsed.data.due_at,
  });

  return NextResponse.json(assignment, { status: 201 });
}
