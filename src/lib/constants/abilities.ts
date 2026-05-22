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
