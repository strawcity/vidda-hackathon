import { NextRequest, NextResponse } from "next/server";
import { listRoles, upsertRole, getRole } from "@/lib/store";
import { RoleSchema } from "@/lib/schemas";

export async function GET() {
  const roles = listRoles();
  // Return summary (frontend selector doesn't need every detail)
  const summary = roles.map((r) => ({
    id: r.id,
    name: r.name,
    team: r.team,
    band: r.band,
    risk_exposure: r.risk_exposure,
  }));
  return NextResponse.json({ roles: summary });
}

/**
 * Create a new role from a structured Role JSON.
 * Free-form job-description parsing is not implemented in v1.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = RoleSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid role payload", issues: result.error.issues },
      { status: 400 },
    );
  }

  if (getRole(result.data.id)) {
    return NextResponse.json(
      { error: `Role with id "${result.data.id}" already exists` },
      { status: 409 },
    );
  }

  const role = upsertRole(result.data);
  return NextResponse.json({ role }, { status: 201 });
}
