/**
 * Draining the outbox.
 *
 * Runs when the app comes to the foreground, when the network returns, and on
 * a slow timer while the app is open. It is deliberately not clever: one item
 * at a time, oldest first, stopping at the first network failure.
 *
 * **Serial, not parallel.** A phone on one bar of signal does not upload six
 * photographs faster by starting all six; it fails all six. One at a time
 * also means an item that is going to fail fails before the next five have
 * burned their attempt counters.
 *
 * **Stop on the first network failure.** If this upload could not reach the
 * server, the next one will not either. Continuing just spends attempts and
 * battery, and pushes every item closer to the retry ceiling for one outage.
 *
 * **Separate "refused" from "could not reach".** A 4xx that is not 408 or 429
 * will not succeed on the tenth try, so it blocks and waits for a person. A
 * timeout retries. Conflating them either loses evidence or retries forever.
 */
import NetInfo from "@react-native-community/netinfo";
import { AppState, AppStateStatus } from "react-native";

import { api } from "../api/client";
import * as outbox from "./outbox";
import type { OutboxItem } from "./outbox";

export type SyncResult = {
  attempted: number;
  sent: number;
  failed: number;
  blocked: number;
  stoppedBecause: "done" | "offline" | "already-running" | "network-failure";
};

let running = false;
const listeners = new Set<() => void>();

/** Lets the badge and the queue screen refresh without polling the database. */
export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  for (const fn of listeners) {
    try {
      fn();
    } catch {
      // A screen that throws in its refresh handler must not stop the sync.
    }
  }
}

async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  // isInternetReachable is null while unknown. Treating unknown as offline
  // would mean never syncing on networks that do not answer the probe, so
  // unknown counts as connected and the upload itself decides.
  return Boolean(state.isConnected) && state.isInternetReachable !== false;
}

/** A refusal the server will repeat however many times we ask. */
function isPermanent(status: number | undefined): boolean {
  if (status === undefined) return false;        // no response: network
  if (status === 408 || status === 429) return false;  // timeout, rate limit
  return status >= 400 && status < 500;
}

async function send(item: OutboxItem): Promise<void> {
  switch (item.kind) {
    case "EVIDENCE":
      await api.attachEvidenceFromQueue(item);
      return;
    case "FINDING":
      await api.addFinding(item.entityId, item.payload);
      return;
    case "EXPENSE":
      await api.addExpense(item.entityId, item.payload);
      return;
    case "VISIT_SUBMIT":
      await api.submitVisit(item.entityId, item.payload);
      return;
    default: {
      // A kind written by a newer build than this one. Block rather than
      // discard: the inspector's work is not ours to throw away.
      const unknown: never = item.kind;
      throw Object.assign(new Error(`Unknown queued item type: ${unknown}`), {
        permanent: true,
      });
    }
  }
}

export async function drain(): Promise<SyncResult> {
  const result: SyncResult = {
    attempted: 0, sent: 0, failed: 0, blocked: 0, stoppedBecause: "done",
  };
  if (running) return { ...result, stoppedBecause: "already-running" };
  if (!(await isOnline())) return { ...result, stoppedBecause: "offline" };

  running = true;
  try {
    const items = await outbox.pending();
    for (const item of items) {
      result.attempted += 1;
      await outbox.markSending(item.id);
      notify();
      try {
        const response: any = await send(item);
        await outbox.markSent(item.id, response?.evidence_id ?? response?.id);
        result.sent += 1;
      } catch (error: any) {
        const status: number | undefined = error?.response?.status;
        const permanent = error?.permanent === true || isPermanent(status);
        const detail =
          error?.response?.data?.detail ||
          error?.message ||
          "Could not reach the server";
        await outbox.markFailed(item.id, detail, permanent);
        if (permanent) {
          result.blocked += 1;
        } else {
          result.failed += 1;
          // The network is the problem, not this item. Everything behind it
          // would fail the same way.
          result.stoppedBecause = "network-failure";
          break;
        }
      } finally {
        notify();
      }
    }
    await outbox.pruneSent();
  } finally {
    running = false;
    notify();
  }
  return result;
}

/**
 * Start syncing in the background for as long as the app is open.
 *
 * There is no background-fetch registration here on purpose: that needs a
 * native build and store permissions, and claiming it works when it has not
 * been tested on a device would be worse than not having it. While the app is
 * open - which is when an inspector gets back into signal and looks at their
 * phone - this is enough.
 */
export function startBackgroundSync(): () => void {
  const timer = setInterval(() => {
    void drain();
  }, 60_000);

  const net = NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable !== false) {
      void drain();
    }
  });

  const onAppState = (next: AppStateStatus) => {
    if (next === "active") void drain();
  };
  const appState = AppState.addEventListener("change", onAppState);

  void outbox.reclaimOrphanedFiles();
  void drain();

  return () => {
    clearInterval(timer);
    net();
    appState.remove();
  };
}
