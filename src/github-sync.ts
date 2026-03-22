/**
 * GitHub sync for SciClaw experiments.
 * Pushes experiment results (messages, artifacts) to a private GitHub repository.
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import { DATA_DIR, GROUPS_DIR } from './config.js';
import { logger } from './logger.js';
import {
  getExperiment,
  getMessages,
  listArtifacts,
  resolveArtifactPath,
} from './experiments.js';

interface SyncSettings {
  github_token: string;
  github_username: string;
  sync_repository: string;
}

function loadSyncSettings(): SyncSettings | null {
  const settingsPath = path.join(DATA_DIR, 'settings.json');
  if (!fs.existsSync(settingsPath)) return null;
  try {
    const s = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    if (!s.github_token || !s.github_username || !s.sync_repository) return null;
    return {
      github_token: s.github_token,
      github_username: s.github_username,
      sync_repository: s.sync_repository,
    };
  } catch {
    return null;
  }
}

function run(cmd: string, cwd: string, env?: Record<string, string>): string {
  return execSync(cmd, {
    cwd,
    encoding: 'utf-8',
    timeout: 30000,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, ...env },
  }).trim();
}

/**
 * Ensure the sync repository exists (create as private if missing).
 */
function ensureRepo(settings: SyncSettings): void {
  const [owner, repo] = settings.sync_repository.split('/');
  try {
    // Check if repo exists
    run(
      `gh api repos/${owner}/${repo} --jq .private`,
      process.cwd(),
      { GH_TOKEN: settings.github_token },
    );
    logger.debug({ repo: settings.sync_repository }, 'Sync repo exists');
  } catch {
    // Create private repo
    logger.info({ repo: settings.sync_repository }, 'Creating private sync repo');
    run(
      `gh repo create ${settings.sync_repository} --private --description "SciClaw experiment results" --confirm`,
      process.cwd(),
      { GH_TOKEN: settings.github_token },
    );
  }
}

/**
 * Export experiment data to a directory structure for git.
 */
function exportExperiment(
  experimentId: string,
  exportDir: string,
): void {
  const exp = getExperiment(experimentId);
  if (!exp) throw new Error('Experiment not found');

  const expDir = path.join(exportDir, exp.name.replace(/[^a-zA-Z0-9_\u3000-\u9FFF\u4E00-\u9FFF -]/g, '_'));
  fs.mkdirSync(expDir, { recursive: true });

  // Export metadata
  fs.writeFileSync(
    path.join(expDir, 'experiment.json'),
    JSON.stringify(
      { id: exp.id, name: exp.name, description: exp.description, status: exp.status, created_at: exp.created_at, updated_at: exp.updated_at },
      null,
      2,
    ),
  );

  // Export messages as markdown
  const messages = getMessages(experimentId, 10000);
  if (messages.length > 0) {
    const lines = [`# ${exp.name}\n`, `> ${exp.description || 'No description'}\n`];
    for (const msg of messages) {
      const ts = new Date(msg.timestamp).toLocaleString('ja-JP');
      const role = msg.role === 'user' ? '👤 User' : msg.role === 'assistant' ? '🤖 SciClaw' : '⚙️ System';
      lines.push(`## ${role} (${ts})\n`);
      lines.push(msg.content + '\n');
    }
    fs.writeFileSync(path.join(expDir, 'conversation.md'), lines.join('\n'));
  }

  // Copy artifacts
  const artifacts = listArtifacts(experimentId);
  if (artifacts.length > 0) {
    const artDir = path.join(expDir, 'artifacts');
    fs.mkdirSync(artDir, { recursive: true });
    for (const artifact of artifacts) {
      const srcPath = resolveArtifactPath(experimentId, artifact);
      if (srcPath) {
        const destPath = path.join(artDir, artifact);
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

/**
 * Sync an experiment to the GitHub repository.
 */
export async function syncExperiment(experimentId: string): Promise<{ ok: boolean; message: string }> {
  const settings = loadSyncSettings();
  if (!settings) {
    return { ok: false, message: 'GitHub sync not configured. Set GitHub Token and Username in Settings.' };
  }

  const exp = getExperiment(experimentId);
  if (!exp) {
    return { ok: false, message: 'Experiment not found.' };
  }

  // Use per-experiment sync_repo if set, otherwise fall back to global setting
  const syncRepo = exp.sync_repo || settings.sync_repository;
  if (!syncRepo) {
    return { ok: false, message: 'No sync repository configured. Set it in experiment settings or global Settings.' };
  }
  const effectiveSettings = { ...settings, sync_repository: syncRepo };

  const syncDir = path.join(DATA_DIR, 'sync-workspace');
  const repoDir = path.join(syncDir, syncRepo.replace('/', '-'));

  try {
    ensureRepo(effectiveSettings);

    const gitEnv = {
      GH_TOKEN: settings.github_token,
      GIT_AUTHOR_NAME: 'SciClaw',
      GIT_AUTHOR_EMAIL: 'sciclaw@local',
      GIT_COMMITTER_NAME: 'SciClaw',
      GIT_COMMITTER_EMAIL: 'sciclaw@local',
    };

    // Clone or pull
    if (!fs.existsSync(path.join(repoDir, '.git'))) {
      fs.mkdirSync(syncDir, { recursive: true });
      const cloneUrl = `https://x-access-token:${settings.github_token}@github.com/${settings.sync_repository}.git`;
      run(`git clone ${cloneUrl} ${repoDir}`, syncDir, gitEnv);
    } else {
      try {
        run('git pull --rebase origin main', repoDir, gitEnv);
      } catch {
        // May fail if repo is empty — that's fine
      }
    }

    // Export experiment
    exportExperiment(experimentId, repoDir);

    // Git add, commit, push
    run('git add -A', repoDir, gitEnv);

    const status = run('git status --porcelain', repoDir, gitEnv);
    if (!status) {
      return { ok: true, message: 'Already up to date. No changes to push.' };
    }

    const commitMsg = `Update experiment: ${exp.name} (${new Date().toISOString().split('T')[0]})`;
    run(`git commit -m "${commitMsg}"`, repoDir, gitEnv);

    try {
      run('git push origin main', repoDir, gitEnv);
    } catch {
      // First push to empty repo — set upstream
      run('git push -u origin HEAD:main', repoDir, gitEnv);
    }

    logger.info({ experimentId, repo: settings.sync_repository }, 'Experiment synced to GitHub');
    return { ok: true, message: `Synced to github.com/${settings.sync_repository}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ experimentId, err }, 'GitHub sync failed');
    return { ok: false, message: `Sync failed: ${msg}` };
  }
}

/**
 * Pull experiment data from the GitHub repository into the local workspace.
 */
export async function pullExperiment(experimentId: string): Promise<{ ok: boolean; message: string; imported: number }> {
  const settings = loadSyncSettings();
  if (!settings) {
    return { ok: false, message: 'GitHub sync not configured.', imported: 0 };
  }

  const exp = getExperiment(experimentId);
  if (!exp) {
    return { ok: false, message: 'Experiment not found.', imported: 0 };
  }

  const syncRepo = exp.sync_repo || settings.sync_repository;
  if (!syncRepo) {
    return { ok: false, message: 'No sync repository configured.', imported: 0 };
  }
  const effectiveSettings = { ...settings, sync_repository: syncRepo };

  const syncDir = path.join(DATA_DIR, 'sync-workspace');
  const repoDir = path.join(syncDir, syncRepo.replace('/', '-'));

  try {
    ensureRepo(effectiveSettings);

    const gitEnv = {
      GH_TOKEN: settings.github_token,
      GIT_AUTHOR_NAME: 'SciClaw',
      GIT_AUTHOR_EMAIL: 'sciclaw@local',
      GIT_COMMITTER_NAME: 'SciClaw',
      GIT_COMMITTER_EMAIL: 'sciclaw@local',
    };

    if (!fs.existsSync(path.join(repoDir, '.git'))) {
      fs.mkdirSync(syncDir, { recursive: true });
      const cloneUrl = `https://x-access-token:${settings.github_token}@github.com/${syncRepo}.git`;
      run(`git clone ${cloneUrl} ${repoDir}`, syncDir, gitEnv);
    } else {
      run('git pull --rebase origin main', repoDir, gitEnv);
    }

    // Find experiment directory in repo
    const safeName = exp.name.replace(/[^a-zA-Z0-9_\u3000-\u9FFF\u4E00-\u9FFF -]/g, '_');
    const expRepoDir = path.join(repoDir, safeName);

    if (!fs.existsSync(expRepoDir)) {
      return { ok: true, message: 'No data found in remote repository for this experiment.', imported: 0 };
    }

    const wsDir = path.join(GROUPS_DIR, `experiment-${experimentId}`);
    let imported = 0;

    function copyRecursive(src: string, dest: string): void {
      for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
          fs.mkdirSync(destPath, { recursive: true });
          copyRecursive(srcPath, destPath);
        } else {
          fs.mkdirSync(path.dirname(destPath), { recursive: true });
          fs.copyFileSync(srcPath, destPath);
          imported++;
        }
      }
    }

    const artSrc = path.join(expRepoDir, 'artifacts');
    if (fs.existsSync(artSrc)) {
      copyRecursive(artSrc, wsDir);
    }

    for (const entry of fs.readdirSync(expRepoDir, { withFileTypes: true })) {
      if (['artifacts', 'conversation.md', 'experiment.json'].includes(entry.name)) continue;
      const srcPath = path.join(expRepoDir, entry.name);
      const destPath = path.join(wsDir, entry.name);
      if (entry.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
        imported++;
      }
    }

    logger.info({ experimentId, repo: settings.sync_repository, imported }, 'Experiment pulled from GitHub');
    return { ok: true, message: `Pulled ${imported} files from github.com/${settings.sync_repository}`, imported };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ experimentId, err }, 'GitHub pull failed');
    return { ok: false, message: `Pull failed: ${msg}`, imported: 0 };
  }
}
