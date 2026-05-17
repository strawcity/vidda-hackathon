import { NextResponse } from "next/server";
import { listAssignments, getPlan } from "@/lib/store";

export async function GET() {
  const assignments = listAssignments();
  // Enrich each assignment with the role_name for the LMS view
  const out = assignments.map((a) => {
    const plan = getPlan(a.plan_id);
    return {
      ...a,
      role_id: plan?.role_id,
      role_name: plan?.plan.role_name,
    };
  });
  return NextResponse.json({ assignments: out });
}
