/**
 * The generation pipeline — the core of the system.
 *
 * Given a role, this:
 *   1. Filters AMLR articles relevant to the role (no vector DB needed — the
 *      articles are pre-tagged in the catalog).
 *   2. Filters the training module catalog to modules covering this role's
 *      high-risk dimensions.
 *   3. Asks the LLM to *select* modules from that filtered catalog and arrange
 *      them across four quarters (Foundation / Application / Deepening /
 *      Embedding) per the Vidda training philosophy.
 *   4. Validates the LLM response against `GeneratedPlanSchema`.
 *   5. Hydrates each plan module with definitive catalog metadata (so the
 *      frontend gets `aml_articles_covered` etc. exactly right even if the
 *      LLM was sloppy about them).
 *
 * Uses Erik's existing `createOpenRouterClient` from `@/lib/openrouter`.
 *
 * The key explainability move: because the LLM is picking from a catalog
 * where each module is pre-tagged with the AMLR articles it covers, every
 * assigned module is automatically traceable to a real AMLR obligation.
 */
import {
  createOpenRouterClient,
  DEFAULT_CHAT_MODEL,
} from "@/lib/openrouter";
import {
  GeneratedPlanSchema,
  type GeneratedPlan,
  type Role,
} from "./schemas";
import {
  articlesForRole,
  modulesRelevantToRole,
  getModuleById,
} from "./catalog";

const SYSTEM_PROMPT = `You are an expert compliance training program designer. You generate role-specific AML compliance training plans that satisfy AMLR 2024/1624 (EU Anti-Money Laundering Regulation).

CRITICAL RULES:
1. You MUST select modules ONLY from the "Training Module Catalog" provided in the user message. Do NOT invent new modules. Use the exact \`module_id\` and \`title\` from the catalog.
2. Every selected module MUST include a \`rationale\` (minimum 20 characters) explaining specifically why THIS module is needed for THIS role, referencing the role's responsibilities, risk exposure, or specific AMLR articles.
3. Spread modules across four quarters following the Vidda training philosophy:
   - Q1 Foundation (Months 1-3): Build core knowledge. Use modules with level="foundation".
   - Q2 Application (Months 4-6): Apply knowledge to real cases. Prefer level="application".
   - Q3 Deepening (Months 7-9): Develop specialist judgement. Prefer level="deepening".
   - Q4 Embedding (Months 10-12): Refresh, assess, and embed. Prefer level="embedding".
4. Total modules across all quarters: 18 to 28 (roughly 4-7 per quarter). Higher-risk roles should have more modules.
5. Every module's \`aml_articles_covered\`, \`risks_addressed\`, and \`competencies_built\` MUST be copied exactly from the catalog entry for that module. Do not modify these arrays.
6. Output STRICT JSON matching the schema. No prose, no markdown, no code fences. Just JSON.

OUTPUT SCHEMA (exactly this shape):
{
  "role_id": string,
  "role_name": string,
  "philosophy": string (>=20 chars, describes the training approach for this role),
  "quarters": {
    "Q1": { "theme": "Foundation", "months": "1-3", "modules": [...] },
    "Q2": { "theme": "Application", "months": "4-6", "modules": [...] },
    "Q3": { "theme": "Deepening", "months": "7-9", "modules": [...] },
    "Q4": { "theme": "Embedding", "months": "10-12", "modules": [...] }
  },
  "overall_rationale": string (>=50 chars, ties the plan back to the role's risk profile and AMLR obligations)
}

Each module entry:
{
  "module_id": "<from catalog>",
  "title": "<from catalog>",
  "rationale": "<your role-specific justification, 20+ chars>",
  "aml_articles_covered": [<copied from catalog>],
  "risks_addressed": [<copied from catalog>],
  "competencies_built": [<copied from catalog>]
}`;

function buildUserPrompt(role: Role): string {
  const relevantArticles = articlesForRole(role.id, role.applicable_amlr_articles);
  const relevantModules = modulesRelevantToRole(role.risk_exposure);

  return [
    "## ROLE TO DESIGN TRAINING FOR",
    JSON.stringify(role, null, 2),
    "",
    "## RELEVANT AMLR ARTICLES (regulatory obligations that apply to this role)",
    JSON.stringify(relevantArticles, null, 2),
    "",
    "## TRAINING MODULE CATALOG (you must pick from this list — do not invent modules)",
    JSON.stringify(relevantModules, null, 2),
    "",
    "Now produce the training plan as strict JSON following the schema in the system message.",
  ].join("\n");
}

/**
 * Overwrite LLM-provided fields with definitive catalog values where possible.
 * If the LLM references a module_id that doesn't exist in the catalog, the
 * entry is dropped (with a warning).
 */
function hydrateFromCatalog(plan: GeneratedPlan): GeneratedPlan {
  for (const quarterKey of ["Q1", "Q2", "Q3", "Q4"] as const) {
    const quarter = plan.quarters[quarterKey];
    quarter.modules = quarter.modules
      .map((mod) => {
        const catalogEntry = getModuleById(mod.module_id);
        if (!catalogEntry) {
          console.warn(
            `[pipeline] LLM referenced unknown module_id: ${mod.module_id} — dropping`,
          );
          return null;
        }
        return {
          module_id: catalogEntry.id,
          title: catalogEntry.title,
          rationale: mod.rationale,
          aml_articles_covered: catalogEntry.aml_articles_covered,
          risks_addressed: catalogEntry.risk_dimensions,
          competencies_built: catalogEntry.competencies_built,
        };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null);
  }
  return plan;
}

export async function generatePlanForRole(role: Role): Promise<GeneratedPlan> {
  const userPrompt = buildUserPrompt(role);
  const client = createOpenRouterClient();

  console.log(`[pipeline] Generating plan for role: ${role.id}`);
  const t0 = Date.now();
  const completion = await client.chat.completions.create({
    model: DEFAULT_CHAT_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });
  console.log(`[pipeline] LLM responded in ${Date.now() - t0}ms`);

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("LLM returned empty response");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    console.error("[pipeline] LLM returned non-JSON:", content.slice(0, 500));
    throw new Error("LLM returned non-JSON response");
  }

  const result = GeneratedPlanSchema.safeParse(parsed);
  if (!result.success) {
    console.error("[pipeline] LLM response failed schema validation:");
    console.error(result.error.issues);
    throw new Error(
      "LLM response did not match expected schema. See server logs for details.",
    );
  }

  const hydrated = hydrateFromCatalog(result.data);
  // Force role_id/name to match the canonical role (LLM occasionally renames)
  hydrated.role_id = role.id;
  hydrated.role_name = role.name;
  return hydrated;
}
