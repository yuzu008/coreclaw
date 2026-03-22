import fs from 'fs';
import path from 'path';

import { CronExpressionParser } from 'cron-parser';

import { DATA_DIR, IPC_POLL_INTERVAL, TIMEZONE } from './config.js';
import { AvailableGroup } from './container-runner.js';
import { createTask, deleteTask, getTaskById, updateTask } from './db.js';
import { isValidGroupFolder } from './group-folder.js';
import { logger } from './logger.js';
import { RegisteredGroup } from './types.js';

export interface IpcDeps {
  sendMessage: (jid: string, text: string) => Promise<void>;
  registeredGroups: () => Record<string, RegisteredGroup>;
  registerGroup: (jid: string, group: RegisteredGroup) => void;
  syncGroups: (force: boolean) => Promise<void>;
  getAvailableGroups: () => AvailableGroup[];
  writeGroupsSnapshot: (
    groupFolder: string,
    isMain: boolean,
    availableGroups: AvailableGroup[],
    registeredJids: Set<string>,
  ) => void;
  onTasksChanged: () => void;
}

let ipcWatcherRunning = false;

export function startIpcWatcher(deps: IpcDeps): void {
  if (ipcWatcherRunning) {
    logger.debug('IPC watcher already running, skipping duplicate start');
    return;
  }
  ipcWatcherRunning = true;

  const ipcBaseDir = path.join(DATA_DIR, 'ipc');
  fs.mkdirSync(ipcBaseDir, { recursive: true });

  const processIpcFiles = async () => {
    let groupFolders: string[];
    try {
      groupFolders = fs.readdirSync(ipcBaseDir).filter((f) => {
        const stat = fs.statSync(path.join(ipcBaseDir, f));
        return stat.isDirectory() && f !== 'errors';
      });
    } catch (err) {
      logger.error({ err }, 'Error reading IPC base directory');
      setTimeout(processIpcFiles, IPC_POLL_INTERVAL);
      return;
    }

    const registeredGroups = deps.registeredGroups();
    const folderIsMain = new Map<string, boolean>();
    for (const group of Object.values(registeredGroups)) {
      if (group.isMain) folderIsMain.set(group.folder, true);
    }

    for (const folder of groupFolders) {
      if (!isValidGroupFolder(folder)) continue;

      const isMain = folderIsMain.get(folder) === true;

      // Process message IPC files
      const msgDir = path.join(ipcBaseDir, folder, 'messages');
      if (fs.existsSync(msgDir)) {
        const files = fs
          .readdirSync(msgDir)
          .filter((f) => f.endsWith('.json') && f !== 'groups-snapshot.json')
          .sort();

        for (const file of files) {
          const filePath = path.join(msgDir, file);
          try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            fs.unlinkSync(filePath);

            if (data.type === 'send_message' && data.jid && data.text) {
              await deps.sendMessage(data.jid, data.text);
            } else if (data.type === 'register_group' && data.jid && data.group) {
              // Security: agents cannot set isMain via IPC
              if (!isMain) {
                data.group.isMain = false;
              }
              deps.registerGroup(data.jid, data.group);
            } else if (data.type === 'sync_groups') {
              await deps.syncGroups(data.force === true);
              const availableGroups = deps.getAvailableGroups();
              const registeredJids = new Set(Object.keys(registeredGroups));
              deps.writeGroupsSnapshot(
                folder,
                isMain,
                availableGroups,
                registeredJids,
              );
            }
          } catch (err) {
            logger.error(
              { folder, file, err },
              'Error processing IPC message file',
            );
            // Move to errors directory
            const errDir = path.join(ipcBaseDir, 'errors');
            fs.mkdirSync(errDir, { recursive: true });
            try {
              fs.renameSync(filePath, path.join(errDir, file));
            } catch {
              try { fs.unlinkSync(filePath); } catch { /* ignore */ }
            }
          }
        }
      }

      // Process task IPC files
      const taskDir = path.join(ipcBaseDir, folder, 'tasks');
      if (fs.existsSync(taskDir)) {
        const files = fs
          .readdirSync(taskDir)
          .filter((f) => f.endsWith('.json') && f !== 'snapshot.json')
          .sort();

        for (const file of files) {
          const filePath = path.join(taskDir, file);
          try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            fs.unlinkSync(filePath);

            if (data.action === 'create' && data.task) {
              createTask(data.task);
              deps.onTasksChanged();
            } else if (data.action === 'update' && data.taskId && data.updates) {
              updateTask(data.taskId, data.updates);
              deps.onTasksChanged();
            } else if (data.action === 'delete' && data.taskId) {
              deleteTask(data.taskId);
              deps.onTasksChanged();
            }
          } catch (err) {
            logger.error(
              { folder, file, err },
              'Error processing IPC task file',
            );
            try { fs.unlinkSync(filePath); } catch { /* ignore */ }
          }
        }
      }
    }

    setTimeout(processIpcFiles, IPC_POLL_INTERVAL);
  };

  processIpcFiles();
}
