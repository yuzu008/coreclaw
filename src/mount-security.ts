import fs from 'fs';
import os from 'os';
import path from 'path';

import { MOUNT_ALLOWLIST_PATH, GROUPS_DIR, DATA_DIR } from './config.js';
import { logger } from './logger.js';
import { AdditionalMount, MountAllowlist } from './types.js';

interface VolumeMount {
  hostPath: string;
  containerPath: string;
  readonly: boolean;
}

function loadAllowlist(): MountAllowlist {
  const defaults: MountAllowlist = {
    allowedRoots: [],
    blockedPatterns: ['.ssh', '.gnupg', '.aws', '.azure', '.config/gh'],
    nonMainReadOnly: true,
  };

  if (!fs.existsSync(MOUNT_ALLOWLIST_PATH)) return defaults;

  try {
    const content = fs.readFileSync(MOUNT_ALLOWLIST_PATH, 'utf-8');
    return { ...defaults, ...JSON.parse(content) };
  } catch {
    logger.warn('Failed to parse mount allowlist, using defaults');
    return defaults;
  }
}

function expandHome(p: string): string {
  if (p.startsWith('~')) {
    return path.join(os.homedir(), p.slice(1));
  }
  return p;
}

function isUnderAllowedRoot(
  hostPath: string,
  allowlist: MountAllowlist,
): { allowed: boolean; readWriteOk: boolean } {
  const resolved = path.resolve(expandHome(hostPath));

  // Always allow paths under the groups directory
  if (resolved.startsWith(GROUPS_DIR)) {
    return { allowed: true, readWriteOk: true };
  }

  // Always allow paths under the data directory (experiments, sessions, etc.)
  if (resolved.startsWith(DATA_DIR)) {
    return { allowed: true, readWriteOk: true };
  }

  for (const root of allowlist.allowedRoots) {
    const rootResolved = path.resolve(expandHome(root.path));
    if (resolved.startsWith(rootResolved + path.sep) || resolved === rootResolved) {
      return { allowed: true, readWriteOk: root.allowReadWrite };
    }
  }

  return { allowed: false, readWriteOk: false };
}

function isBlocked(hostPath: string, allowlist: MountAllowlist): boolean {
  const resolved = path.resolve(expandHome(hostPath));
  for (const pattern of allowlist.blockedPatterns) {
    if (resolved.includes(pattern)) return true;
  }
  return false;
}

export function validateAdditionalMounts(
  mounts: AdditionalMount[],
  groupName: string,
  isMain: boolean,
): VolumeMount[] {
  const allowlist = loadAllowlist();
  const validated: VolumeMount[] = [];

  for (const mount of mounts) {
    const hostPath = path.resolve(expandHome(mount.hostPath));

    if (isBlocked(hostPath, allowlist)) {
      logger.warn(
        { group: groupName, path: hostPath },
        'Mount blocked by security pattern',
      );
      continue;
    }

    const { allowed, readWriteOk } = isUnderAllowedRoot(hostPath, allowlist);
    if (!allowed) {
      logger.warn(
        { group: groupName, path: hostPath },
        'Mount rejected: not under any allowed root',
      );
      continue;
    }

    if (!fs.existsSync(hostPath)) {
      logger.warn(
        { group: groupName, path: hostPath },
        'Mount path does not exist, skipping',
      );
      continue;
    }

    // Determine read-only status
    let isReadOnly = mount.readonly !== false;
    if (!isMain && allowlist.nonMainReadOnly) {
      isReadOnly = true;
    }
    if (!readWriteOk && !isReadOnly) {
      logger.warn(
        { group: groupName, path: hostPath },
        'Read-write not allowed for this root, forcing read-only',
      );
      isReadOnly = true;
    }

    const basename = mount.containerPath || path.basename(hostPath);
    const containerPath = `/workspace/extra/${basename}`;

    validated.push({
      hostPath,
      containerPath,
      readonly: isReadOnly,
    });
  }

  return validated;
}
