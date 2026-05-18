import { NextResponse } from "next/server";
import { listPlans } from "@/lib/store";

export async function GET() {
  const plans = listPlans();
  const summary = plans.map((p) => ({
    id: p.id,
    role_id: p.role_id,
    role_name: p.plan.role_name,
    status: p.status,
    total_modules: Object.values(p.plan.quarters).reduce(
      (sum, q) => sum + q.modules.length,
      0,
    ),
    created_at: p.created_at,
    updated_at: p.updated_at,
  }));
  return NextResponse.json({ plans: summary });
}
