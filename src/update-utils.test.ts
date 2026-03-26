import { describe, expect, it } from 'vitest';

import { classifyUpdaterDirtyFiles, parseDirtyTrackedFiles } from './update-utils.js';

describe('update utils', () => {
  it('parses tracked dirty files and ignores untracked files', () => {
    const files = parseDirtyTrackedFiles([
      ' M package-lock.json',
      'M  src/web-server.ts',
      'R  skills/consultant/prompts/a.md -> skills/consultant/source/prompts/a.md',
      '?? skills/educationalist/group.json',
    ].join('\n'));

    expect(files).toEqual([
      'package-lock.json',
      'skills/consultant/source/prompts/a.md',
      'src/web-server.ts',
    ]);
  });

  it('classifies package-lock as auto-cleanable and other files as blocking', () => {
    expect(classifyUpdaterDirtyFiles(['package-lock.json', 'src/web-server.ts'])).toEqual({
      autoClean: ['package-lock.json'],
      blocking: ['src/web-server.ts'],
    });
  });
});