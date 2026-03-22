import fs from 'fs';
import path from 'path';

import { GROUPS_DIR, DATA_DIR } from './config.js';

const FOLDER_PATTERN = /^[a-zA-Z0-9_-]+$/;

export function isValidGroupFolder(folder: string): boolean {
  return FOLDER_PATTERN.test(folder) && !folder.includes('..');
}

export function resolveGroupFolderPath(folder: string): string {
  if (!isValidGroupFolder(folder)) {
    throw new Error(`Invalid group folder name: ${folder}`);
  }
  return path.resolve(GROUPS_DIR, folder);
}

export function resolveGroupIpcPath(folder: string): string {
  if (!isValidGroupFolder(folder)) {
    throw new Error(`Invalid group folder name: ${folder}`);
  }
  return path.join(DATA_DIR, 'ipc', folder);
}
