import { describe, expect, it } from 'vitest';

import {
  getDomainPreset,
  listDomainPresets,
  resolvePresetConfig,
} from './domain-presets.js';

describe('domain presets', () => {
  it('returns four well-known presets', () => {
    const presets = listDomainPresets();

    expect(presets).toHaveLength(4);
    expect(presets.map((preset) => preset.id)).toEqual([
      'sociology-japan',
      'business-management',
      'religion-studies',
      'philosophy',
    ]);
  });

  it('resolves preset config for experiment defaults', () => {
    const resolved = resolvePresetConfig('business-management', '経営学ワークスペース');

    expect(resolved).not.toBeNull();
    expect(resolved?.skill).toBe('consultant');
    expect(resolved?.mcp_servers).toContain('ToolUniverse');
    expect(resolved?.presetSystemMessage).toContain('DOMAIN PRESET');
  });

  it('returns null for unknown preset config request', () => {
    expect(resolvePresetConfig('unknown-domain', 'x')).toBeNull();
    expect(getDomainPreset('unknown-domain')).toBeUndefined();
  });
});
