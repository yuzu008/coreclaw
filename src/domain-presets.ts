export type DomainPresetId =
  | 'sociology-japan'
  | 'business-management'
  | 'religion-studies'
  | 'philosophy';

export interface DomainPreset {
  id: DomainPresetId;
  name: string;
  description: string;
  defaultSkill: string;
  mcpServers: string[];
  defaultPrompt: string;
}

export interface PresetResolvedConfig {
  name: string;
  description: string;
  skill: string;
  mcp_servers: string;
  presetSystemMessage: string;
}

const DOMAIN_PRESETS: DomainPreset[] = [
  {
    id: 'sociology-japan',
    name: '社会学: 日本社会課題',
    description:
      '人口減少・地域格差・労働市場などの社会課題を、統計と制度の観点で分析する。',
    defaultSkill: 'scientist',
    mcpServers: ['ToolUniverse', 'deep-research'],
    defaultPrompt:
      '日本社会の課題分析では、一次情報（公的統計・白書）を優先し、因果断定を避けて複数仮説を示してください。',
  },
  {
    id: 'business-management',
    name: '経営学: 戦略と実行',
    description:
      '戦略立案から実行計画、KPI設計までを構造化して検討する。',
    defaultSkill: 'consultant',
    mcpServers: ['ToolUniverse', 'deep-research'],
    defaultPrompt:
      '経営課題はフレームワークを明示し、施策ごとに期待効果・リスク・実行優先度を提示してください。',
  },
  {
    id: 'religion-studies',
    name: '宗教学: 比較と背景',
    description:
      '宗教の教義・儀礼・歴史背景を、価値判断を避けて比較整理する。',
    defaultSkill: 'educationalist',
    mcpServers: ['deep-research'],
    defaultPrompt:
      '宗教学では教義説明と歴史的事実を分け、地域差・時代差を明示し、中立的な表現で回答してください。',
  },
  {
    id: 'philosophy',
    name: '哲学: 論点整理',
    description:
      '倫理・認識・存在論などのテーマを立場別に整理し、反論可能性を示す。',
    defaultSkill: 'educationalist',
    mcpServers: ['deep-research'],
    defaultPrompt:
      '哲学的検討では定義を先に示し、複数立場の主張と限界、想定反論を対比して説明してください。',
  },
];

export function listDomainPresets(): DomainPreset[] {
  return DOMAIN_PRESETS.map((preset) => ({
    ...preset,
    mcpServers: [...preset.mcpServers],
  }));
}

export function getDomainPreset(
  presetId: string,
): DomainPreset | undefined {
  return DOMAIN_PRESETS.find((preset) => preset.id === presetId);
}

// F-401 / DES-401: プリセットIDから実験作成の既定値を解決する。
export function resolvePresetConfig(
  presetId: string,
  fallbackName: string,
): PresetResolvedConfig | null {
  const preset = getDomainPreset(presetId);
  if (!preset) return null;

  return {
    name: fallbackName || preset.name,
    description: preset.description,
    skill: preset.defaultSkill,
    mcp_servers: JSON.stringify(preset.mcpServers),
    presetSystemMessage: [
      '[DOMAIN PRESET]',
      `id: ${preset.id}`,
      `name: ${preset.name}`,
      preset.defaultPrompt,
    ].join('\n'),
  };
}
