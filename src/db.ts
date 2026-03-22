import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

import { ASSISTANT_NAME, DATA_DIR, STORE_DIR } from './config.js';
import { isValidGroupFolder } from './group-folder.js';
import { logger } from './logger.js';
import {
  NewMessage,
  RegisteredGroup,
  ScheduledTask,
  TaskRunLog,
} from './types.js';

let db: Database.Database;

/** Expose the raw database instance for subsystems that need it. */
export function getDatabase(): Database.Database {
  if (!db) throw new Error('Database not initialized');
  return db;
}

function createSchema(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS chats (
      jid TEXT PRIMARY KEY,
      name TEXT,
      last_message_time TEXT,
      channel TEXT,
      is_group INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT,
      chat_jid TEXT,
      sender TEXT,
      sender_name TEXT,
      content TEXT,
      timestamp TEXT,
      is_from_me INTEGER,
      is_bot_message INTEGER DEFAULT 0,
      PRIMARY KEY (id, chat_jid),
      FOREIGN KEY (chat_jid) REFERENCES chats(jid)
    );
    CREATE INDEX IF NOT EXISTS idx_timestamp ON messages(timestamp);

    CREATE TABLE IF NOT EXISTS scheduled_tasks (
      id TEXT PRIMARY KEY,
      group_folder TEXT NOT NULL,
      chat_jid TEXT NOT NULL,
      prompt TEXT NOT NULL,
      schedule_type TEXT NOT NULL,
      schedule_value TEXT NOT NULL,
      next_run TEXT,
      last_run TEXT,
      last_result TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_next_run ON scheduled_tasks(next_run);
    CREATE INDEX IF NOT EXISTS idx_status ON scheduled_tasks(status);

    CREATE TABLE IF NOT EXISTS task_run_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT NOT NULL,
      run_at TEXT NOT NULL,
      duration_ms INTEGER NOT NULL,
      status TEXT NOT NULL,
      result TEXT,
      error TEXT,
      FOREIGN KEY (task_id) REFERENCES scheduled_tasks(id)
    );
    CREATE INDEX IF NOT EXISTS idx_task_run_logs ON task_run_logs(task_id, run_at);

    CREATE TABLE IF NOT EXISTS router_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      group_folder TEXT PRIMARY KEY,
      session_id TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS registered_groups (
      jid TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      folder TEXT NOT NULL UNIQUE,
      trigger_pattern TEXT NOT NULL,
      added_at TEXT NOT NULL,
      container_config TEXT,
      requires_trigger INTEGER DEFAULT 1,
      is_main INTEGER DEFAULT 0
    );
  `);
}

function runMigrations(database: Database.Database): void {
  // Add context_mode column to scheduled_tasks if missing
  const cols = database
    .prepare("PRAGMA table_info('scheduled_tasks')")
    .all() as { name: string }[];
  const colNames = cols.map((c) => c.name);
  if (!colNames.includes('context_mode')) {
    database.exec(
      "ALTER TABLE scheduled_tasks ADD COLUMN context_mode TEXT DEFAULT 'group'",
    );
  }
}

export function initDatabase(): void {
  const dbDir = DATA_DIR;
  fs.mkdirSync(dbDir, { recursive: true });
  const dbPath = path.join(dbDir, 'coreclaw.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  createSchema(db);
  runMigrations(db);
}

// --- Router state ---

export function getRouterState(key: string): string | undefined {
  const row = db
    .prepare('SELECT value FROM router_state WHERE key = ?')
    .get(key) as { value: string } | undefined;
  return row?.value;
}

export function setRouterState(key: string, value: string): void {
  db.prepare(
    'INSERT OR REPLACE INTO router_state (key, value) VALUES (?, ?)',
  ).run(key, value);
}

// --- Sessions ---

export function getAllSessions(): Record<string, string> {
  const rows = db
    .prepare('SELECT group_folder, session_id FROM sessions')
    .all() as { group_folder: string; session_id: string }[];
  const result: Record<string, string> = {};
  for (const r of rows) result[r.group_folder] = r.session_id;
  return result;
}

export function setSession(groupFolder: string, sessionId: string): void {
  db.prepare(
    'INSERT OR REPLACE INTO sessions (group_folder, session_id) VALUES (?, ?)',
  ).run(groupFolder, sessionId);
}

// --- Registered groups ---

export function getAllRegisteredGroups(): Record<string, RegisteredGroup> {
  const rows = db.prepare('SELECT * FROM registered_groups').all() as {
    jid: string;
    name: string;
    folder: string;
    trigger_pattern: string;
    added_at: string;
    container_config: string | null;
    requires_trigger: number;
    is_main: number;
  }[];
  const result: Record<string, RegisteredGroup> = {};
  for (const r of rows) {
    result[r.jid] = {
      name: r.name,
      folder: r.folder,
      trigger: r.trigger_pattern,
      added_at: r.added_at,
      containerConfig: r.container_config
        ? JSON.parse(r.container_config)
        : undefined,
      requiresTrigger: r.requires_trigger === 1,
      isMain: r.is_main === 1,
    };
  }
  return result;
}

export function getRegisteredGroup(jid: string): RegisteredGroup | undefined {
  const groups = getAllRegisteredGroups();
  return groups[jid];
}

export function setRegisteredGroup(
  jid: string,
  group: RegisteredGroup,
): void {
  db.prepare(
    `INSERT OR REPLACE INTO registered_groups
     (jid, name, folder, trigger_pattern, added_at, container_config, requires_trigger, is_main)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    jid,
    group.name,
    group.folder,
    group.trigger,
    group.added_at,
    group.containerConfig ? JSON.stringify(group.containerConfig) : null,
    group.requiresTrigger !== false ? 1 : 0,
    group.isMain ? 1 : 0,
  );
}

// --- Messages ---

export function storeMessage(msg: NewMessage): void {
  db.prepare(
    `INSERT OR IGNORE INTO messages
     (id, chat_jid, sender, sender_name, content, timestamp, is_from_me, is_bot_message)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    msg.id,
    msg.chat_jid,
    msg.sender,
    msg.sender_name,
    msg.content,
    msg.timestamp,
    msg.is_from_me ? 1 : 0,
    msg.is_bot_message ? 1 : 0,
  );
}

export function storeChatMetadata(
  jid: string,
  timestamp: string,
  name?: string,
  channel?: string,
  isGroup?: boolean,
): void {
  db.prepare(
    `INSERT INTO chats (jid, name, last_message_time, channel, is_group)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(jid) DO UPDATE SET
       last_message_time = excluded.last_message_time,
       name = COALESCE(excluded.name, chats.name),
       channel = COALESCE(excluded.channel, chats.channel),
       is_group = COALESCE(excluded.is_group, chats.is_group)`,
  ).run(jid, name || null, timestamp, channel || null, isGroup ? 1 : 0);
}

export function getNewMessages(
  registeredJids: string[],
  sinceTimestamp: string,
  assistantName: string,
): { messages: NewMessage[]; newTimestamp: string } {
  if (registeredJids.length === 0) {
    return { messages: [], newTimestamp: sinceTimestamp };
  }

  const placeholders = registeredJids.map(() => '?').join(',');
  const rows = db
    .prepare(
      `SELECT * FROM messages
       WHERE chat_jid IN (${placeholders})
       AND timestamp > ?
       AND is_bot_message = 0
       ORDER BY timestamp ASC`,
    )
    .all(...registeredJids, sinceTimestamp) as {
    id: string;
    chat_jid: string;
    sender: string;
    sender_name: string;
    content: string;
    timestamp: string;
    is_from_me: number;
    is_bot_message: number;
  }[];

  const messages: NewMessage[] = rows.map((r) => ({
    id: r.id,
    chat_jid: r.chat_jid,
    sender: r.sender,
    sender_name: r.sender_name,
    content: r.content,
    timestamp: r.timestamp,
    is_from_me: r.is_from_me === 1,
    is_bot_message: r.is_bot_message === 1,
  }));

  const newTimestamp =
    messages.length > 0
      ? messages[messages.length - 1].timestamp
      : sinceTimestamp;

  return { messages, newTimestamp };
}

export function getMessagesSince(
  chatJid: string,
  sinceTimestamp: string,
  assistantName: string,
): NewMessage[] {
  const rows = db
    .prepare(
      `SELECT * FROM messages
       WHERE chat_jid = ?
       AND timestamp > ?
       AND is_bot_message = 0
       ORDER BY timestamp ASC`,
    )
    .all(chatJid, sinceTimestamp) as {
    id: string;
    chat_jid: string;
    sender: string;
    sender_name: string;
    content: string;
    timestamp: string;
    is_from_me: number;
    is_bot_message: number;
  }[];

  return rows.map((r) => ({
    id: r.id,
    chat_jid: r.chat_jid,
    sender: r.sender,
    sender_name: r.sender_name,
    content: r.content,
    timestamp: r.timestamp,
    is_from_me: r.is_from_me === 1,
    is_bot_message: r.is_bot_message === 1,
  }));
}

// --- Chats ---

export function getAllChats(): {
  jid: string;
  name: string;
  last_message_time: string;
  is_group: boolean;
}[] {
  return (
    db.prepare('SELECT * FROM chats ORDER BY last_message_time DESC').all() as {
      jid: string;
      name: string;
      last_message_time: string;
      is_group: number;
    }[]
  ).map((r) => ({ ...r, is_group: r.is_group === 1 }));
}

// --- Scheduled tasks ---

export function getAllTasks(): ScheduledTask[] {
  return db
    .prepare('SELECT * FROM scheduled_tasks')
    .all() as ScheduledTask[];
}

export function getTaskById(id: string): ScheduledTask | undefined {
  return db
    .prepare('SELECT * FROM scheduled_tasks WHERE id = ?')
    .get(id) as ScheduledTask | undefined;
}

export function createTask(task: Omit<ScheduledTask, 'last_run' | 'last_result'>): void {
  db.prepare(
    `INSERT INTO scheduled_tasks
     (id, group_folder, chat_jid, prompt, schedule_type, schedule_value, context_mode, next_run, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    task.id,
    task.group_folder,
    task.chat_jid,
    task.prompt,
    task.schedule_type,
    task.schedule_value,
    task.context_mode,
    task.next_run,
    task.status,
    task.created_at,
  );
}

export function updateTask(
  id: string,
  updates: Partial<ScheduledTask>,
): void {
  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(updates)) {
    if (key === 'id') continue;
    fields.push(`${key} = ?`);
    values.push(value);
  }

  if (fields.length === 0) return;
  values.push(id);

  db.prepare(
    `UPDATE scheduled_tasks SET ${fields.join(', ')} WHERE id = ?`,
  ).run(...values);
}

export function deleteTask(id: string): void {
  db.prepare('DELETE FROM scheduled_tasks WHERE id = ?').run(id);
}

export function logTaskRun(log: TaskRunLog): void {
  db.prepare(
    `INSERT INTO task_run_logs (task_id, run_at, duration_ms, status, result, error)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(log.task_id, log.run_at, log.duration_ms, log.status, log.result, log.error);
}
