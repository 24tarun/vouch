import { schedules, task } from "@trigger.dev/sdk/v3";
import {
    processGoogleCalendarDeltaForUser,
    processGoogleCalendarOutboxItem,
    processGoogleTasksDeltaForUser,
    reconcileStaleGoogleCalendarConnections,
    renewExpiringGoogleCalendarWatches,
    retryPendingGoogleCalendarOutbox,
    syncGoogleTasksForEnabledConnections,
} from "@/lib/google-calendar/sync";

/**
 * Dispatch task for processing a single Google Calendar outbox item.
 *
 * This is typically enqueued whenever we have a new change that needs to be pushed
 * from our system to Google Calendar (for example: creating, updating, or deleting
 * an event). The `outboxId` references a row in our Google Calendar outbox table.
 *
 * Flow:
 * - A piece of business logic writes a new outbox record.
 * - That logic (or a database trigger) enqueues this task with the corresponding `outboxId`.
 * - This task validates that an `outboxId` is present and then calls
 *   `processGoogleCalendarOutboxItem`, which:
 *   - Reads the outbox record.
 *   - Calls the Google Calendar API as needed.
 *   - Marks the outbox record as succeeded / failed and records any error details.
 *
 * This task is **on‑demand** (not scheduled): it runs only when explicitly queued
 * with a payload.
 */
export const googleCalendarDispatch = task({
    id: "google-calendar-dispatch",
    run: async (payload: { outboxId: number }) => {
        if (!payload?.outboxId) return;
        await processGoogleCalendarOutboxItem(payload.outboxId);
    },
});

/**
 * Per‑user sync task that pulls incremental changes from Google Calendar.
 *
 * This task is designed to keep an individual user's calendars in sync with Vouch.
 * It is usually triggered in response to:
 * - Webhook notifications from Google (push channels).
 * - Manual actions in the product (e.g. "force resync").
 * - Backfill / maintenance operations.
 *
 * The `userId` is required and identifies which Google connection (tokens, sync
 * state, cursors) should be used. The optional `reason` field is useful for
 * observability and logging (e.g. "webhook", "manual", "backfill"), but does
 * not change the behavior of the task.
 *
 * Internally, `processGoogleCalendarDeltaForUser`:
 * - Loads the current sync cursor / history for the user.
 * - Calls the Google Calendar API to fetch changes since the last sync.
 * - Applies those changes to our local data store (creates / updates / deletes).
 * - Advances the sync cursor so subsequent runs are incremental and efficient.
 */
export const googleCalendarSyncConnection = task({
    id: "google-calendar-sync-connection",
    run: async (payload: { userId: string; reason?: string }) => {
        if (!payload?.userId) return;
        await processGoogleCalendarDeltaForUser(payload.userId);
        const forceTasksSync = payload.reason === "manual" || payload.reason === "backfill";
        await processGoogleTasksDeltaForUser(payload.userId, { force: forceTasksSync });
    },
});

// Google Tasks has no native webhook/watch API, so we run a lightweight
// incremental sweep as a reliability fallback for inbound task mirroring.
export const googleTasksSyncSweeper = schedules.task({
    id: "google-tasks-sync-sweeper",
    cron: "*/5 * * * *",
    run: async () => {
        await syncGoogleTasksForEnabledConnections(200);
    },
});

/**
 * Scheduled "retry sweeper" for failed or stuck Google Calendar outbox items.
 *
 * Schedule:
 * - `cron: "*15 * * * *"` → every 15 minutes, at minute 0, 15, 30, and 45 of every hour.
 *
 * Purpose:
 * - When an outbox item fails (e.g. due to transient Google API errors, rate limits,
 *   or network issues), we do not want to drop the change forever.
 * - Instead, failed or "pending for too long" items are left in the outbox with a
 *   status that makes them eligible for retry.
 *
 * On each run this task:
 * - Selects up to 200 retryable outbox items (the `200` argument is the batch size).
 * - Re‑invokes the same processing pipeline that a normal dispatch would use.
 * - Ensures that eventually‑consistent operations are retried without manual
 *   intervention, while still limiting throughput and load on the Google API.
 */
export const googleCalendarRetrySweeper = schedules.task({
    id: "google-calendar-retry-sweeper",
    cron: "*/15 * * * *",
    run: async () => {
        await retryPendingGoogleCalendarOutbox(200);
    },
});

/**
 * Scheduled job that renews expiring Google Calendar webhook "watches".
 *
 * Google Calendar push notifications are delivered via watch channels that:
 * - Are created with an explicit expiration time.
 * - Stop sending notifications once expired, unless renewed / recreated.
 *
 * Schedule:
 * - `cron: "0 * * * *"` → once every hour on the hour (e.g. 00:00, 01:00, 02:00).
 *
 * On each run this task:
 * - Finds watch channels that are close to expiring or already expired.
 * - Calls the Google Calendar API to renew or recreate those channels.
 * - Updates our internal bookkeeping so that new webhook events continue to arrive.
 *
 * This job is critical for **staying subscribed** to Google Calendar changes over
 * long periods without manual operator involvement.
 */
export const googleCalendarWatchRenew = schedules.task({
    id: "google-calendar-watch-renew",
    cron: "0 * * * *",
    run: async () => {
        await renewExpiringGoogleCalendarWatches();
    },
});

/**
 * Scheduled reconciliation job for stale or unhealthy Google Calendar connections.
 *
 * Over time, some connections can drift into a bad state:
 * - Tokens may be revoked or expire in a way that normal flows don't fully recover from.
 * - Webhook channels may silently fail.
 * - Sync cursors may get stuck due to unexpected API responses or long‑lived errors.
 *
 * Schedule:
 * - `cron: "*15 * * * *"` → every 15 minutes.
 *
 * On each run this task:
 * - Scans for "stale" connections (e.g. users who have not synced successfully for
 *   some threshold of time, or connections marked as unhealthy).
 * - Attempts to repair them using `reconcileStaleGoogleCalendarConnections`, which
 *   might:
 *   - Kick off a fresh full sync.
 *   - Reset internal state so incremental syncs can resume.
 *   - Tear down and re‑establish webhook channels.
 *
 * This reconciliation layer adds resilience beyond the normal sync / webhook flows
 * by periodically healing long‑running integrations that may have silently broken.
 */
export const googleCalendarReconcile = schedules.task({
    id: "google-calendar-reconcile",
    cron: "*/15 * * * *",
    run: async () => {
        await reconcileStaleGoogleCalendarConnections();
    },
});
