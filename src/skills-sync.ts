/**
 * Skills synchronization for CoreClaw.
 * Copies Agent Skills from the local skills/ directory
 * into per-group .github/skills/ directories so containers can use them.
 */
import fs from 'fs';
import path from 'path';

import { logger } from './logger.js';

/**
 * Resolve the path to the local skills directory.
 */
function getLocalSkillsPath(): string | null {
  const skillsDir = path.resolve(process.cwd(), 'skills');
  if (fs.existsSync(skillsDir)) {
    return skillsDir;
  }
  return null;
}

/**
 * Copy a directory recursively.
 */
function copyDirSync(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Sync skills into a group's .github/skills/ directory.
 *
 * Sources (in order, later overrides earlier):
 *   1. Local skills/ directory (project root)
 *   2. Custom skills from container/skills/ directory
 *
 * @param groupSkillsDir - Destination: data/sessions/{group}/.github/skills/
 * @param projectRoot - The project root directory
 */
export function syncSkillsToGroup(
  groupSkillsDir: string,
  projectRoot: string,
  skillFilter?: string,
): void {
  fs.mkdirSync(groupSkillsDir, { recursive: true });

  // Parse skill filter: supports comma-separated list of skill names
  const filterSet = skillFilter
    ? new Set(skillFilter.split(',').map(s => s.trim()).filter(Boolean))
    : null;

  // 1. Sync skills from local skills/ directory
  const localSkillsPath = getLocalSkillsPath();
  if (localSkillsPath) {
    let synced = 0;
    for (const skillDir of fs.readdirSync(localSkillsPath)) {
      // If a skill filter is set, only sync matching skills
      if (filterSet && !filterSet.has(skillDir)) continue;
      const srcDir = path.join(localSkillsPath, skillDir);
      if (!fs.statSync(srcDir).isDirectory()) continue;
      const dstDir = path.join(groupSkillsDir, skillDir);
      const srcSkillMd = path.join(srcDir, 'SKILL.md');
      if (!fs.existsSync(srcSkillMd)) continue;
      const dstSkillMd = path.join(dstDir, 'SKILL.md');
      if (
        !fs.existsSync(dstSkillMd) ||
        fs.statSync(srcSkillMd).mtimeMs > fs.statSync(dstSkillMd).mtimeMs
      ) {
        copyDirSync(srcDir, dstDir);
        synced++;
      }
    }
    if (synced > 0) {
      logger.debug({ count: synced, filter: skillFilter || 'all' }, 'Synced local skills to group');
    }
  }

  // 2. Sync custom project skills from container/skills/ (overrides local)
  const customSkillsDir = path.join(projectRoot, 'container', 'skills');
  if (fs.existsSync(customSkillsDir)) {
    for (const skillDir of fs.readdirSync(customSkillsDir)) {
      const srcDir = path.join(customSkillsDir, skillDir);
      if (!fs.statSync(srcDir).isDirectory()) continue;
      const dstDir = path.join(groupSkillsDir, skillDir);
      copyDirSync(srcDir, dstDir);
    }
    logger.debug('Synced custom project skills to group');
  }
}

/**
 * Get list of available skill names.
 */
export function listAvailableSkills(): string[] {
  const localSkillsPath = getLocalSkillsPath();
  if (!localSkillsPath) return [];

  return fs
    .readdirSync(localSkillsPath)
    .filter((entry) => {
      const entryPath = path.join(localSkillsPath, entry);
      return (
        fs.statSync(entryPath).isDirectory() &&
        fs.existsSync(path.join(entryPath, 'SKILL.md'))
      );
    })
    .sort();
}

/**
 * Get skill metadata (name and description from YAML frontmatter).
 */
export function getSkillMetadata(
  skillName: string,
): { name: string; description: string } | null {
  const localSkillsPath = getLocalSkillsPath();
  if (!localSkillsPath) return null;

  const skillMdPath = path.join(localSkillsPath, skillName, 'SKILL.md');
  if (!fs.existsSync(skillMdPath)) return null;

  const content = fs.readFileSync(skillMdPath, 'utf-8');
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const frontmatter = match[1];
  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
  const descMatch = frontmatter.match(/^description:\s*\|?\s*\n?([\s\S]*?)$/m);

  return {
    name: nameMatch ? nameMatch[1].trim() : skillName,
    description: descMatch
      ? descMatch[1].trim().replace(/\n\s*/g, ' ')
      : '',
  };
}
