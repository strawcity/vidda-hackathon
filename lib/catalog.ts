/**
 * In-memory access to the AMLR article catalog and training module catalog.
 *
 * Both are read-only reference data imported directly as JSON modules — this
 * means Next.js bundles them into the build, which works on Vercel
 * serverless (no `fs.readFileSync` needed).
 */
import amlrArticlesRaw from "./data/amlr-articles.json";
import trainingModulesRaw from "./data/training-modules.json";
import {
  AMLRArticleSchema,
  TrainingModuleSchema,
  type AMLRArticle,
  type TrainingModule,
} from "./schemas";

function validateAll<T>(items: unknown[], validator: (x: unknown) => T, label: string): T[] {
  return items.map((item, idx) => {
    try {
      return validator(item);
    } catch (err) {
      console.error(`[catalog] Validation failed for ${label}[${idx}]:`, err);
      throw err;
    }
  });
}

export const amlrArticles: AMLRArticle[] = validateAll(
  amlrArticlesRaw,
  (x) => AMLRArticleSchema.parse(x),
  "amlr-articles",
);

export const trainingModules: TrainingModule[] = validateAll(
  trainingModulesRaw,
  (x) => TrainingModuleSchema.parse(x),
  "training-modules",
);

/* -------------------------- Lookup helpers -------------------------------- */

export function getArticleById(id: string): AMLRArticle | undefined {
  return amlrArticles.find((a) => a.id === id);
}

export function getModuleById(id: string): TrainingModule | undefined {
  return trainingModules.find((m) => m.id === id);
}

/**
 * Filter AMLR articles relevant to a specific role. Keeps the LLM prompt
 * focused — we don't send the entire AMLR to the model, just the articles
 * that apply to this role.
 */
export function articlesForRole(
  roleId: string,
  explicitArticleIds: string[],
): AMLRArticle[] {
  const byExplicit = explicitArticleIds
    .map(getArticleById)
    .filter((a): a is AMLRArticle => a !== undefined);
  const byTag = amlrArticles.filter((a) => a.applies_to_roles.includes(roleId));
  const seen = new Set<string>();
  return [...byExplicit, ...byTag].filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
}

/**
 * Filter the catalog to modules that match the role's risk dimensions.
 * Pre-filtering keeps the LLM prompt short and on-topic.
 */
export function modulesRelevantToRole(
  roleRisks: Record<string, string>,
): TrainingModule[] {
  const highRiskDims = Object.entries(roleRisks)
    .filter(([, level]) => level === "high")
    .map(([dim]) => dim);

  return trainingModules.filter((m) => {
    if (m.target_risk_level === "all") return true;
    return m.risk_dimensions.some((d) => highRiskDims.includes(d));
  });
}
