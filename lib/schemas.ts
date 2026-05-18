/**
 * Zod schemas — validate every shape that flows through the system.
 *
 * The most important one is `GeneratedPlanSchema`: the LLM is asked to return
 * exactly this shape, and we validate its response before storing. If the LLM
 * returns malformed JSON, the caller sees a clean error instead of garbage.
 */
import { z } from "zod";

/* ---------------------------- Catalog schemas ----------------------------- */

export const RiskLevelSchema = z.enum(["low", "medium", "high"]);
export const RiskDimensionSchema = z.enum([
  "aml",
  "sanctions",
  "fraud",
  "documentation",
  "regulatory",
]);

export const RoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  team: z.string().optional(),
  band: z.string().optional(),
  purpose: z.string(),
  responsibilities: z.array(z.string()),
  risk_exposure: z.object({
    aml: RiskLevelSchema,
    sanctions: RiskLevelSchema,
    fraud: RiskLevelSchema,
    documentation: RiskLevelSchema,
    regulatory: RiskLevelSchema,
  }),
  key_risk_themes: z.array(z.string()),
  competency_needs: z.object({
    knowledge: z.array(z.string()),
    skills: z.array(z.string()),
    judgement: z.array(z.string()),
  }),
  applicable_amlr_articles: z.array(z.string()),
});
export type Role = z.infer<typeof RoleSchema>;

export const AMLRArticleSchema = z.object({
  id: z.string(),
  article_number: z.string(),
  title: z.string(),
  summary: z.string(),
  tags: z.array(z.string()),
  applies_to_risks: z.array(RiskDimensionSchema),
  applies_to_roles: z.array(z.string()),
});
export type AMLRArticle = z.infer<typeof AMLRArticleSchema>;

export const TrainingModuleSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  duration_hours: z.number(),
  level: z.enum(["foundation", "application", "deepening", "embedding"]),
  delivery_mode: z.string(),
  aml_articles_covered: z.array(z.string()),
  risk_dimensions: z.array(RiskDimensionSchema),
  competencies_built: z.array(z.string()),
  target_risk_level: z.string(),
});
export type TrainingModule = z.infer<typeof TrainingModuleSchema>;

/* ----------------------- Generated plan (LLM output) ---------------------- */

export const PlanModuleSchema = z.object({
  module_id: z.string(),
  title: z.string(),
  rationale: z
    .string()
    .min(20, "Rationale must explain WHY this module is assigned to this role"),
  aml_articles_covered: z.array(z.string()),
  risks_addressed: z.array(RiskDimensionSchema),
  competencies_built: z.array(z.string()),
});
export type PlanModule = z.infer<typeof PlanModuleSchema>;

export const QuarterSchema = z.object({
  theme: z.enum(["Foundation", "Application", "Deepening", "Embedding"]),
  months: z.string(),
  modules: z.array(PlanModuleSchema),
});
export type Quarter = z.infer<typeof QuarterSchema>;

export const GeneratedPlanSchema = z.object({
  role_id: z.string(),
  role_name: z.string(),
  philosophy: z
    .string()
    .min(20, "Philosophy should describe the training approach for this role"),
  quarters: z.object({
    Q1: QuarterSchema,
    Q2: QuarterSchema,
    Q3: QuarterSchema,
    Q4: QuarterSchema,
  }),
  overall_rationale: z
    .string()
    .min(
      50,
      "Overall rationale must tie the plan to the role's risk profile and AMLR obligations",
    ),
});
export type GeneratedPlan = z.infer<typeof GeneratedPlanSchema>;

/* ------------------------- Persisted entities ----------------------------- */

export const PlanStatusSchema = z.enum([
  "draft",
  "under_review",
  "approved",
  "archived",
]);
export type PlanStatus = z.infer<typeof PlanStatusSchema>;

export const AssignmentStatusSchema = z.enum([
  "assigned",
  "in_progress",
  "completed",
  "overdue",
]);
export type AssignmentStatus = z.infer<typeof AssignmentStatusSchema>;

export interface StoredPlan {
  id: string;
  role_id: string;
  status: PlanStatus;
  plan: GeneratedPlan;
  created_at: string;
  updated_at: string;
}

export interface StoredAssignment {
  id: string;
  plan_id: string;
  employee_name: string;
  employee_email?: string;
  status: AssignmentStatus;
  progress_pct: number;
  assigned_at: string;
  due_at?: string;
}
