import fs from 'fs';

import { SENDER_ALLOWLIST_PATH } from './config.js';

interface SenderAllowlistConfig {
  groups: Record<
    string,
    {
      mode: 'allow' | 'deny';
      senders: string[];
      dropDenied?: boolean;
    }
  >;
  logDenied?: boolean;
}

let cachedConfig: SenderAllowlistConfig | null = null;
let lastModified = 0;

export function loadSenderAllowlist(): SenderAllowlistConfig {
  try {
    if (!fs.existsSync(SENDER_ALLOWLIST_PATH)) {
      return { groups: {} };
    }
    const stat = fs.statSync(SENDER_ALLOWLIST_PATH);
    if (cachedConfig && stat.mtimeMs === lastModified) {
      return cachedConfig;
    }
    const content = fs.readFileSync(SENDER_ALLOWLIST_PATH, 'utf-8');
    cachedConfig = JSON.parse(content);
    lastModified = stat.mtimeMs;
    return cachedConfig!;
  } catch {
    return { groups: {} };
  }
}

export function isSenderAllowed(
  chatJid: string,
  sender: string,
  config: SenderAllowlistConfig,
): boolean {
  const groupConfig = config.groups[chatJid];
  if (!groupConfig) return true;

  const isInList = groupConfig.senders.includes(sender);
  return groupConfig.mode === 'allow' ? isInList : !isInList;
}

export function isTriggerAllowed(
  chatJid: string,
  sender: string,
  config: SenderAllowlistConfig,
): boolean {
  return isSenderAllowed(chatJid, sender, config);
}

export function shouldDropMessage(
  chatJid: string,
  config: SenderAllowlistConfig,
): boolean {
  const groupConfig = config.groups[chatJid];
  return groupConfig?.dropDenied === true;
}
