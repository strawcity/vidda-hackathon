/**
 * Seeds the in-memory store with the roles defined in lib/data/roles.json.
 *
 * Called once on first import of lib/store. Idempotent (replaces by id).
 */
import rolesData from "./data/roles.json";
import { RoleSchema, type Role } from "./schemas";

export function loadSeedRoles(): Role[] {
  return rolesData.map((raw, idx) => {
    try {
      return RoleSchema.parse(raw);
    } catch (err) {
      console.error(`[seed] Validation failed for roles[${idx}]:`, err);
      throw err;
    }
  });
}
