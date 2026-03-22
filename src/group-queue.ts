import { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

import { DATA_DIR, MAX_CONCURRENT_CONTAINERS } from './config.js';
import { logger } from './logger.js';

interface QueuedTask {
  id: string;
  groupJid: string;
  fn: () => Promise<void>;
}

const MAX_RETRIES = 5;
const BASE_RETRY_MS = 5000;

interface GroupState {
  active: boolean;
  idleWaiting: boolean;
  isTaskContainer: boolean;
  runningTaskId: string | null;
  pendingMessages: boolean;
  pendingTasks: QueuedTask[];
  process: ChildProcess | null;
  containerName: string | null;
  groupFolder: string | null;
  retryCount: number;
}

export class GroupQueue {
  private groups = new Map<string, GroupState>();
  private activeCount = 0;
  private waitingGroups: string[] = [];
  private processMessagesFn: ((groupJid: string) => Promise<boolean>) | null =
    null;
  private shuttingDown = false;

  private getGroup(groupJid: string): GroupState {
    let state = this.groups.get(groupJid);
    if (!state) {
      state = {
        active: false,
        idleWaiting: false,
        isTaskContainer: false,
        runningTaskId: null,
        pendingMessages: false,
        pendingTasks: [],
        process: null,
        containerName: null,
        groupFolder: null,
        retryCount: 0,
      };
      this.groups.set(groupJid, state);
    }
    return state;
  }

  setProcessMessagesFn(fn: (groupJid: string) => Promise<boolean>): void {
    this.processMessagesFn = fn;
  }

  registerProcess(
    groupJid: string,
    proc: ChildProcess,
    containerName: string,
    groupFolder: string,
  ): void {
    const state = this.getGroup(groupJid);
    state.process = proc;
    state.containerName = containerName;
    state.groupFolder = groupFolder;
  }

  enqueueMessageCheck(groupJid: string): void {
    const state = this.getGroup(groupJid);
    state.pendingMessages = true;

    if (state.active) return;
    this.tryActivate(groupJid);
  }

  enqueueTask(groupJid: string, taskId: string, fn: () => Promise<void>): void {
    const state = this.getGroup(groupJid);
    state.pendingTasks.push({ id: taskId, groupJid, fn });

    if (state.active) return;
    this.tryActivate(groupJid);
  }

  /** Pipe a message into an active container's stdin via IPC */
  sendMessage(groupJid: string, message: string): boolean {
    const state = this.getGroup(groupJid);
    if (!state.active || !state.groupFolder) return false;

    const ipcDir = path.join(DATA_DIR, 'ipc', state.groupFolder, 'input');
    fs.mkdirSync(ipcDir, { recursive: true });

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`;
    fs.writeFileSync(
      path.join(ipcDir, filename),
      JSON.stringify({ type: 'message', text: message }),
    );
    return true;
  }

  /** Close container stdin via IPC sentinel */
  closeStdin(groupJid: string): void {
    const state = this.getGroup(groupJid);
    if (!state.groupFolder) return;

    const sentinelPath = path.join(
      DATA_DIR,
      'ipc',
      state.groupFolder,
      'input',
      '_close',
    );
    try {
      fs.mkdirSync(path.dirname(sentinelPath), { recursive: true });
      fs.writeFileSync(sentinelPath, '');
    } catch (err) {
      logger.warn({ groupJid, err }, 'Failed to write close sentinel');
    }
  }

  /** Signal that container is idle (query completed, waiting for input) */
  notifyIdle(groupJid: string): void {
    const state = this.getGroup(groupJid);
    state.idleWaiting = true;
  }

  private tryActivate(groupJid: string): void {
    if (this.shuttingDown) return;

    if (this.activeCount >= MAX_CONCURRENT_CONTAINERS) {
      if (!this.waitingGroups.includes(groupJid)) {
        this.waitingGroups.push(groupJid);
      }
      return;
    }

    const state = this.getGroup(groupJid);
    if (state.active) return;

    state.active = true;
    this.activeCount++;

    this.processGroup(groupJid).catch((err) => {
      logger.error({ groupJid, err }, 'Error processing group');
      this.deactivate(groupJid);
    });
  }

  private async processGroup(groupJid: string): Promise<void> {
    const state = this.getGroup(groupJid);

    // Process tasks first (higher priority)
    while (state.pendingTasks.length > 0 && !this.shuttingDown) {
      const task = state.pendingTasks.shift()!;
      state.isTaskContainer = true;
      state.runningTaskId = task.id;
      try {
        await task.fn();
        state.retryCount = 0;
      } catch (err) {
        logger.error({ groupJid, taskId: task.id, err }, 'Task execution failed');
      }
      state.runningTaskId = null;
      state.isTaskContainer = false;
    }

    // Process messages
    if (state.pendingMessages && !this.shuttingDown) {
      state.pendingMessages = false;
      if (this.processMessagesFn) {
        const success = await this.processMessagesFn(groupJid);
        if (success) {
          state.retryCount = 0;
        } else {
          state.retryCount++;
          if (state.retryCount <= MAX_RETRIES) {
            const delay = BASE_RETRY_MS * Math.pow(2, state.retryCount - 1);
            logger.warn(
              { groupJid, retryCount: state.retryCount, delay },
              'Scheduling retry',
            );
            setTimeout(() => {
              state.pendingMessages = true;
              if (!state.active) this.tryActivate(groupJid);
            }, delay);
          } else {
            logger.error(
              { groupJid, retryCount: state.retryCount },
              'Max retries exceeded',
            );
            state.retryCount = 0;
          }
        }
      }
    }

    this.deactivate(groupJid);
  }

  private deactivate(groupJid: string): void {
    const state = this.getGroup(groupJid);
    state.active = false;
    state.idleWaiting = false;
    state.process = null;
    state.containerName = null;
    this.activeCount--;

    // Activate next waiting group
    if (this.waitingGroups.length > 0) {
      const next = this.waitingGroups.shift()!;
      this.tryActivate(next);
    }
  }

  async shutdown(timeoutMs: number): Promise<void> {
    this.shuttingDown = true;
    logger.info('GroupQueue shutting down...');

    // Send close sentinels to all active containers
    for (const [jid, state] of this.groups) {
      if (state.active && state.groupFolder) {
        this.closeStdin(jid);
      }
    }

    // Wait for containers to exit
    await new Promise((resolve) => setTimeout(resolve, Math.min(timeoutMs, 5000)));
    logger.info('GroupQueue shutdown complete');
  }
}
