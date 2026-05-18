/**
 * In-memory storage for roles, plans, and assignments.
 *
 * Replaces SQLite because Vercel serverless functions don't have a writable
 * filesystem. State lives for the lifetime of the Node process — for `npm run
 * dev` that's the whole dev session, which is enough for hackathon demos.
 *
 * NOTE: On Vercel production, each serverless invocation may run in a fresh
 * container — state will not persist between requests. For the deployed demo
 * to "remember" generated plans across requests, swap this for Vercel KV
 * (drop-in: replace the Maps with KV calls). For local `npm run dev` or
 * `npm run start` on a single machine, in-memory is fine.
 *
 * The `globalThis` trick prevents Next.js hot-reload from wiping state
 * between requests in dev mode.
 */
import type {
  Role,
  StoredPlan,
  StoredAssignment,
} from "./schemas";
import { loadSeedRoles } from "./seed";

type Stores = {
  roles: Map<string, Role>;
  plans: Map<string, StoredPlan>;
  assignments: Map<string, StoredAssignment>;
  seeded: boolean;
};

const globalForStore = globalThis as unknown as { __viddaStores?: Stores };

function initStores(): Stores {
  const stores: Stores = {
    roles: new Map(),
    plans: new Map(),
    assignments: new Map(),
    seeded: false,
  };
  const seedRoles = loadSeedRoles();
  for (const role of seedRoles) {
    stores.roles.set(role.id, role);
  }
  stores.seeded = true;
  console.log(
    `[store] Initialised in-memory store with ${stores.roles.size} seeded roles`,
  );
  return stores;
}

const stores: Stores = globalForStore.__viddaStores ?? initStores();
if (!globalForStore.__viddaStores) {
  globalForStore.__viddaStores = stores;
}

/* ------------------------------ Roles ------------------------------------ */

export function listRoles(): Role[] {
  return Array.from(stores.roles.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

export function getRole(id: string): Role | undefined {
  return stores.roles.get(id);
}

export function upsertRole(role: Role): Role {
  stores.roles.set(role.id, role);
  return role;
}

/* ------------------------------ Plans ------------------------------------ */

export function listPlans(): StoredPlan[] {
  return Array.from(stores.plans.values()).sort(
    (a, b) => b.created_at.localeCompare(a.created_at),
  );
}

export function getPlan(id: string): StoredPlan | undefined {
  return stores.plans.get(id);
}

export function savePlan(plan: StoredPlan): StoredPlan {
  stores.plans.set(plan.id, plan);
  return plan;
}

export function updatePlan(
  id: string,
  patch: Partial<Omit<StoredPlan, "id" | "created_at">>,
): StoredPlan | undefined {
  const existing = stores.plans.get(id);
  if (!existing) return undefined;
  const next: StoredPlan = {
    ...existing,
    ...patch,
    updated_at: new Date().toISOString(),
  };
  stores.plans.set(id, next);
  return next;
}

/* ---------------------------- Assignments -------------------------------- */

export function listAssignments(): StoredAssignment[] {
  return Array.from(stores.assignments.values()).sort(
    (a, b) => b.assigned_at.localeCompare(a.assigned_at),
  );
}

export function getAssignment(id: string): StoredAssignment | undefined {
  return stores.assignments.get(id);
}

export function saveAssignment(a: StoredAssignment): StoredAssignment {
  stores.assignments.set(a.id, a);
  return a;
}

export function updateAssignment(
  id: string,
  patch: Partial<Omit<StoredAssignment, "id" | "assigned_at">>,
): StoredAssignment | undefined {
  const existing = stores.assignments.get(id);
  if (!existing) return undefined;
  const next: StoredAssignment = { ...existing, ...patch };
  stores.assignments.set(id, next);
  return next;
}

/* ----------------------------- Helpers ----------------------------------- */

export function shortId(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
