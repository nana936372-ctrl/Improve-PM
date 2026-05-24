export const ABILITY_DIMENSIONS = [
  {
    key: "user_insight",
    label: "用户与业务洞察",
    description: "理解用户、场景、业务目标和真实约束"
  },
  {
    key: "problem_framing",
    label: "问题定义与目标拆解",
    description: "把模糊需求拆成清晰问题、目标和优先级"
  },
  {
    key: "ai_boundary",
    label: "AI 能力边界判断",
    description: "判断模型能力、幻觉、数据依赖和技术适用边界"
  },
  {
    key: "solution_tradeoff",
    label: "方案设计与取舍",
    description: "提出可落地方案，并说明关键取舍"
  },
  {
    key: "metrics_experiment",
    label: "指标与实验设计",
    description: "定义指标、评估方法和实验路径"
  },
  {
    key: "risk_governance",
    label: "风险、伦理与治理",
    description: "识别安全、合规、隐私、偏见和体验风险"
  }
] as const;

export type AbilityKey = (typeof ABILITY_DIMENSIONS)[number]["key"];

export const ABILITY_KEYS = ABILITY_DIMENSIONS.map((item) => item.key);

const abilityKeySet = new Set<string>(ABILITY_KEYS);

const abilityKeyAliases: Record<string, AbilityKey> = {
  understanding_ai_boundary: "ai_boundary",
  ai_boundary_understanding: "ai_boundary",
  ability_boundary_understanding: "ai_boundary",
  ai_capability_boundary: "ai_boundary",
  boundary_judgment: "ai_boundary",
  boundary_assessment: "ai_boundary",
  technical_understanding: "ai_boundary",
  technical_knowledge: "ai_boundary",
  技术认知: "ai_boundary",
  边界判断: "ai_boundary",
  识别ai能力边界: "ai_boundary",
  "ai 能力边界判断": "ai_boundary",

  risk_awareness: "risk_governance",
  risk_management: "risk_governance",
  risk_control: "risk_governance",
  safety_governance: "risk_governance",
  privacy_compliance: "risk_governance",
  风险意识: "risk_governance",
  "风险、伦理与治理": "risk_governance",

  user_experience_consideration: "user_insight",
  user_experience: "user_insight",
  user_insight_analysis: "user_insight",
  business_impact_analysis: "user_insight",
  用户体验考虑: "user_insight",
  分析业务影响: "user_insight",
  沟通策略: "user_insight",
  "用户与业务洞察": "user_insight",

  "practicality_&_feasibility": "solution_tradeoff",
  practicality_and_feasibility: "solution_tradeoff",
  practical_feasibility: "solution_tradeoff",
  feasibility: "solution_tradeoff",
  solution_design: "solution_tradeoff",
  tradeoff: "solution_tradeoff",
  方案设计: "solution_tradeoff",
  提出分层方案: "solution_tradeoff",
  "方案设计与取舍": "solution_tradeoff",

  problem_definition: "problem_framing",
  goal_breakdown: "problem_framing",
  问题定义: "problem_framing",
  "问题定义与目标拆解": "problem_framing",

  metrics_design: "metrics_experiment",
  experiment_design: "metrics_experiment",
  指标设计: "metrics_experiment",
  "指标与实验设计": "metrics_experiment"
};

function normalizeAliasText(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

export function isAbilityKey(value: string): value is AbilityKey {
  return abilityKeySet.has(value);
}

export function normalizeAbilityKey(value: string): AbilityKey | null {
  const normalized = normalizeAliasText(value);
  if (isAbilityKey(normalized)) return normalized;
  return abilityKeyAliases[normalized] ?? abilityKeyAliases[value.trim()] ?? null;
}
