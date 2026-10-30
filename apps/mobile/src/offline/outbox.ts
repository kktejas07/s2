/**
 * The outbox: work an inspector has done that the server has not heard about
 * yet.
 *
 * On a construction site there is usually no signal, so "submit" cannot mean
 * "send". It means "write this down durably and send it when you can". The
 * previous app called the API directly and threw away whatever failed, which
 * on a real site meant throwing away the day's work.
 *
 * Three decisions this file is built around:
 *
 * **SQLite, not AsyncStorage.** The queue has to survive the app being killed
 * mid-write - by the OS reclaiming memory, by a flat battery, by the inspector
 * swiping it away. A key-value store that rewrites a whole JSON blob on every
 * change can lose the lot; a transactional row insert cannot.
 *
 * **Files stay on disk, never in the queue.** A photograph is two to five
 * megabytes. Base64 in a database row costs a third more again, has to be
 * held in memory to read back, and makes the queue unreadable when debugging.
 * The row holds a path; the bytes are copied into the app's document
 * directory, out of the camera cache the OS is free to clear.
 *
 * **Every item carries a key the server honours.** The dangerous failure is
 * the ambiguous one: the upload arrived, the reply did not. The queue cannot
 * tell that from a real failure, so it retries - and without an idempotency
 * key one photograph becomes four over a bad afternoon. The key is generated
 * at capture, stored with the item, and reused on every attempt.
 */
import * as Crypto from "expo-crypto";
import * as FileSystem from "expo-file-system";
import * as SQLite from "expo-sqlite";

export type OutboxKind = "EVIDENCE" | "FINDING" | "EXPENSE" | "VISIT_SUBMIT";

export type OutboxStatus = "PENDING" | "SENDING" | "SENT" | "FAILED" | "BLOCKED";

export type OutboxItem = {
  id: string;
  kind: OutboxKind;
  /** The idempotency key the server deduplicates on. Stable for the life of
   *  the item, across every retry. */
  captureId: string;
  entityType: string;
  entityId: string;
  /** JSON. Everything but the file. */
  payload: Record<string, unknown>;
  /** Absolute path in the app's document directory, for items with a file. */
  filePath: string | null;
  fileName: string | null;
  contentType: string | null;
  /** Computed at capture, before the file could have been touched. */
  captureSha256: string | null;
  createdAt: string;
  attempts: number;
  lastAttemptAt: string | null;
  lastError: string | null;
  status: OutboxStatus;
};

const DB_NAME = "iqe-outbox.db";
/** Kept out of the cache directory on purpose: the OS may clear the cache at
 *  any time, and this is the only copy of the inspector's evidence until it
 *  reaches the server. */
const QUEUE_DIR = `${FileSystem.documentDirectory}outbox/`;

/** Beyond this an item stops retrying on its own and waits for a person. A
 *  queue that retries a genuinely broken item forever burns the battery and
 *  hides the one item that needs attention. */
export const MAX_ATTEMPTS = 8;

let db: SQLite.SQLiteDatabase | null = null;

export async function open(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS outbox (
      id             TEXT PRIMARY KEY NOT NULL,
      kind           TEXT NOT NULL,
      capture_id     TEXT NOT NULL UNIQUE,
      entity_type    TEXT NOT NULL,
      entity_id      TEXT NOT NULL,
      payload        TEXT NOT NULL,
      file_path      TEXT,
      file_name      TEXT,
      content_type   TEXT,
      capture_sha256 TEXT,
      created_at     TEXT NOT NULL,
      attempts       INTEGER NOT NULL DEFAULT 0,
      last_attempt_at TEXT,
      last_error     TEXT,
      status         TEXT NOT NULL DEFAULT 'PENDING'
    );
    CREATE INDEX IF NOT EXISTS outbox_status ON outbox (status, created_at);
  `);
  await FileSystem.makeDirectoryAsync(QUEUE_DIR, { intermediates: true }).catch(
    () => {
      // Already there. makeDirectoryAsync rejects rather than no-opping.
    },
  );
  return db;
}

function rowToItem(r: any): OutboxItem {
  return {
    id: r.id,
    kind: r.kind,
    captureId: r.capture_id,
    entityType: r.entity_type,
    entityId: r.entity_id,
    payload: JSON.parse(r.payload),
    filePath: r.file_path,
    fileName: r.file_name,
    contentType: r.content_type,
    captureSha256: r.capture_sha256,
    createdAt: r.created_at,
    attempts: r.attempts,
    lastAttemptAt: r.last_attempt_at,
    lastError: r.last_error,
    status: r.status,
  };
}

/**
 * Take custody of a captured file and queue the work.
 *
 * The file is copied into the queue directory and hashed *here*, at capture,
 * rather than on the server. Hashing on receipt proves only that the bytes
 * have not changed since the server got them, which for a photograph that sat
 * in this queue overnight is the wrong claim to make.
 */
export async function enqueue(input: {
  kind: OutboxKind;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
  /** The camera's temporary URI. Copied, not referenced. */
  sourceUri?: string;
  fileName?: string;
  contentType?: string;
}): Promise<OutboxItem> {
  const conn = await open();
  const id = Crypto.randomUUID();
  const captureId = Crypto.randomUUID();

  let filePath: string | null = null;
  let captureSha256: string | null = null;

  if (input.sourceUri) {
    const extension = (input.fileName?.split(".").pop() || "jpg").toLowerCase();
    filePath = `${QUEUE_DIR}${captureId}.${extension}`;
    // Copy before hashing: the camera's cache entry can disappear between the
    // two, and a hash of a file we no longer hold is worth nothing.
    await FileSystem.copyAsync({ from: input.sourceUri, to: filePath });

    const base64 = await FileSystem.readAsStringAsync(filePath, {
      encoding: FileSystem.EncodingType.Base64,
    });
    captureSha256 = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      base64,
      { encoding: Crypto.CryptoEncoding.HEX },
    );
  }

  const item: OutboxItem = {
    id,
    kind: input.kind,
    captureId,
    entityType: input.entityType,
    entityId: input.entityId,
    payload: input.payload,
    filePath,
    fileName: input.fileName ?? null,
    contentType: input.contentType ?? null,
    captureSha256,
    createdAt: new Date().toISOString(),
    attempts: 0,
    lastAttemptAt: null,
    lastError: null,
    status: "PENDING",
  };

  await conn.runAsync(
    `INSERT INTO outbox
       (id, kind, capture_id, entity_type, entity_id, payload, file_path,
        file_name, content_type, capture_sha256, created_at, attempts, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'PENDING')`,
    [
      item.id, item.kind, item.captureId, item.entityType, item.entityId,
      JSON.stringify(item.payload), item.filePath, item.fileName,
      item.contentType, item.captureSha256, item.createdAt,
    ],
  );
  return item;
}

/** Items ready to send, oldest first - an inspector's day reads in order. */
export async function pending(limit = 20): Promise<OutboxItem[]> {
  const conn = await open();
  const rows = await conn.getAllAsync<any>(
    `SELECT * FROM outbox
      WHERE status IN ('PENDING', 'FAILED') AND attempts < ?
      ORDER BY created_at ASC LIMIT ?`,
    [MAX_ATTEMPTS, limit],
  );
  return rows.map(rowToItem);
}

export async function all(): Promise<OutboxItem[]> {
  const conn = await open();
  const rows = await conn.getAllAsync<any>(
    `SELECT * FROM outbox ORDER BY created_at DESC`,
  );
  return rows.map(rowToItem);
}

export async function counts(): Promise<{
  pending: number;
  failed: number;
  blocked: number;
  sent: number;
}> {
  const conn = await open();
  const rows = await conn.getAllAsync<any>(
    `SELECT status, COUNT(*) AS n FROM outbox GROUP BY status`,
  );
  const by: Record<string, number> = {};
  for (const r of rows) by[r.status] = r.n;
  return {
    // SENDING counts as pending: from the inspector's side it has not landed.
    pending: (by.PENDING ?? 0) + (by.SENDING ?? 0),
    failed: by.FAILED ?? 0,
    blocked: by.BLOCKED ?? 0,
    sent: by.SENT ?? 0,
  };
}

export async function markSending(id: string): Promise<void> {
  const conn = await open();
  await conn.runAsync(
    `UPDATE outbox SET status = 'SENDING', last_attempt_at = ?,
            attempts = attempts + 1 WHERE id = ?`,
    [new Date().toISOString(), id],
  );
}

/**
 * The server has it. Drop the file but keep the row.
 *
 * The row is what lets an inspector see that this morning's photographs
 * landed; deleting it immediately would make a working sync indistinguishable
 * from one that silently dropped everything.
 */
export async function markSent(id: string, serverId?: string): Promise<void> {
  const conn = await open();
  const row = await conn.getFirstAsync<any>(
    `SELECT file_path FROM outbox WHERE id = ?`, [id],
  );
  if (row?.file_path) {
    await FileSystem.deleteAsync(row.file_path, { idempotent: true }).catch(() => {
      // A file we cannot delete is a disk-space problem, not a sync problem.
    });
  }
  await conn.runAsync(
    `UPDATE outbox SET status = 'SENT', last_error = NULL,
            payload = json_set(payload, '$.server_id', ?) WHERE id = ?`,
    [serverId ?? null, id],
  );
}

/**
 * The attempt failed.
 *
 * `permanent` separates "the network was not there" from "the server refused
 * this and always will". A 4xx that is not 408 or 429 will not succeed on the
 * tenth try either; retrying it forever hides it behind items that might
 * actually go.
 */
export async function markFailed(
  id: string, error: string, permanent = false,
): Promise<void> {
  const conn = await open();
  await conn.runAsync(
    `UPDATE outbox SET status = ?, last_error = ? WHERE id = ?`,
    [permanent ? "BLOCKED" : "FAILED", error.slice(0, 500), id],
  );
}

/** Put a blocked item back in the queue - after the inspector has fixed
 *  whatever the server objected to. */
export async function retry(id: string): Promise<void> {
  const conn = await open();
  await conn.runAsync(
    `UPDATE outbox SET status = 'PENDING', attempts = 0, last_error = NULL
      WHERE id = ?`,
    [id],
  );
}

/** Discard an item the inspector has decided against. Deliberately explicit:
 *  nothing in this file throws work away on its own. */
export async function discard(id: string): Promise<void> {
  const conn = await open();
  const row = await conn.getFirstAsync<any>(
    `SELECT file_path FROM outbox WHERE id = ?`, [id],
  );
  if (row?.file_path) {
    await FileSystem.deleteAsync(row.file_path, { idempotent: true }).catch(() => {});
  }
  await conn.runAsync(`DELETE FROM outbox WHERE id = ?`, [id]);
}

/**
 * Housekeeping: forget sent items after a fortnight.
 *
 * Long enough that an inspector can still see last week's submissions landed,
 * short enough that the table does not grow without bound on a device that
 * never gets wiped.
 */
export async function pruneSent(olderThanDays = 14): Promise<number> {
  const conn = await open();
  const cutoff = new Date(
    Date.now() - olderThanDays * 24 * 60 * 60 * 1000,
  ).toISOString();
  const result = await conn.runAsync(
    `DELETE FROM outbox WHERE status = 'SENT' AND created_at < ?`, [cutoff],
  );
  return result.changes ?? 0;
}

/** Orphaned files, if a row vanished without its file being cleaned up. */
export async function reclaimOrphanedFiles(): Promise<number> {
  const conn = await open();
  const rows = await conn.getAllAsync<any>(
    `SELECT file_path FROM outbox WHERE file_path IS NOT NULL`,
  );
  const known = new Set(rows.map((r) => r.file_path as string));
  const names = await FileSystem.readDirectoryAsync(QUEUE_DIR).catch(() => []);
  let removed = 0;
  for (const name of names) {
    const path = `${QUEUE_DIR}${name}`;
    if (!known.has(path)) {
      await FileSystem.deleteAsync(path, { idempotent: true }).catch(() => {});
      removed += 1;
    }
  }
  return removed;
}
