import { ChildProcess } from 'child_process';

import { CronExpressionParser } from 'cron-parser';

import {
  SCHEDULER_POLL_INTERVAL,
  TIMEZONE,
} from './config.js';
import {
  ContainerInput,
  runContainerAgent,
  ContainerOutput,
  writeTasksSnapshot,
} from './container-runner.js';
import {
  getAllTasks,
  getTaskById,
  logTaskRun,
  updateTask,
} from './db.js';
import { GroupQueue } from './group-queue.js';
import { logger } from './logger.js';
import { RegisteredGroup } from './types.js';

interface SchedulerDeps {
  registeredGroups: () => Record<string, RegisteredGroup>;
  getSessions: () => Record<string, string>;
  queue: GroupQueue;
  onProcess: (
    groupJid: string,
    proc: ChildProcess,
    containerName: string,
    groupFolder: string,
  ) => void;
  sendMessage: (jid: string, text: string) => Promise<void>;
}

export function startSchedulerLoop(deps: SchedulerDeps): void {
  const check = async () => {
    try {
      const tasks = getAllTasks();
      const now = new Date();

      for (const task of tasks) {
        if (task.status !== 'active') continue;
        if (!task.next_run) continue;

        const nextRun = new Date(task.next_run);
        if (nextRun > now) continue;

        // Find the group JID for this task
        const groups = deps.registeredGroups();
        let groupJid: string | undefined;
        for (const [jid, group] of Object.entries(groups)) {
          if (group.folder === task.group_folder) {
            groupJid = jid;
            break;
          }
        }

        if (!groupJid) {
          logger.warn(
            { taskId: task.id, groupFolder: task.group_folder },
            'No registered group for task, skipping',
          );
          continue;
        }

        const group = groups[groupJid];

        // Calculate next run before executing
        let nextRunTime: string | null = null;
        if (task.schedule_type === 'cron') {
          try {
            const interval = CronExpressionParser.parse(task.schedule_value, {
              tz: TIMEZONE,
            });
            nextRunTime = interval.next().toISOString();
          } catch (err) {
            logger.error(
              { taskId: task.id, err },
              'Failed to parse cron expression',
            );
          }
        } else if (task.schedule_type === 'interval') {
          const ms = parseInt(task.schedule_value, 10);
          if (!isNaN(ms)) {
            nextRunTime = new Date(now.getTime() + ms).toISOString();
          }
        } else if (task.schedule_type === 'once') {
          nextRunTime = null;
        }

        // Update next_run immediately to prevent duplicate execution
        updateTask(task.id, {
          next_run: nextRunTime,
          last_run: now.toISOString(),
          status: nextRunTime ? 'active' : 'completed',
        });

        // Execute the task
        const taskFn = async () => {
          const startTime = Date.now();
          try {
            const sessions = deps.getSessions();
            const sessionId = sessions[task.group_folder];

            const output = await runContainerAgent(
              group,
              {
                prompt: task.prompt,
                sessionId,
                groupFolder: task.group_folder,
                chatJid: task.chat_jid,
                isMain: group.isMain === true,
                isScheduledTask: true,
                assistantName: undefined,
              },
              (proc, containerName) =>
                deps.onProcess(groupJid!, proc, containerName, task.group_folder),
              async (result) => {
                if (result.result) {
                  const text = result.result
                    .replace(/<internal>[\s\S]*?<\/internal>/g, '')
                    .trim();
                  if (text) {
                    await deps.sendMessage(task.chat_jid, text);
                  }
                }
              },
            );

            const duration = Date.now() - startTime;
            logTaskRun({
              task_id: task.id,
              run_at: now.toISOString(),
              duration_ms: duration,
              status: output.status === 'error' ? 'error' : 'success',
              result:
                output.result != null
                  ? typeof output.result === 'string'
                    ? output.result.slice(0, 5000)
                    : JSON.stringify(output.result).slice(0, 5000)
                  : null,
              error: output.error || null,
            });
          } catch (err) {
            const duration = Date.now() - startTime;
            logTaskRun({
              task_id: task.id,
              run_at: now.toISOString(),
              duration_ms: duration,
              status: 'error',
              result: null,
              error: err instanceof Error ? err.message : String(err),
            });
            logger.error({ taskId: task.id, err }, 'Scheduled task error');
          }
        };

        deps.queue.enqueueTask(groupJid, task.id, taskFn);
      }
    } catch (err) {
      logger.error({ err }, 'Error in scheduler loop');
    }

    setTimeout(check, SCHEDULER_POLL_INTERVAL);
  };

  check();
}
