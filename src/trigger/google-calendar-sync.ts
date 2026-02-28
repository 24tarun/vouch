import { schedules, task } from "@trigger.dev/sdk/v3";
import {
    processGoogleCalendarDeltaForUser,
    processGoogleCalendarOutboxItem,
    reconcileStaleGoogleCalendarConnections,
    renewExpiringGoogleCalendarWatches,
    retryPendingGoogleCalendarOutbox,
} from "@/lib/google-calendar/sync";

export const googleCalendarDispatch = task({
    id: "google-calendar-dispatch",
    run: async (payload: { outboxId: number }) => {
        if (!payload?.outboxId) return;
        await processGoogleCalendarOutboxItem(payload.outboxId);
    },
});

export const googleCalendarSyncConnection = task({
    id: "google-calendar-sync-connection",
    run: async (payload: { userId: string; reason?: string }) => {
        if (!payload?.userId) return;
        await processGoogleCalendarDeltaForUser(payload.userId);
    },
});

export const googleCalendarRetrySweeper = schedules.task({
    id: "google-calendar-retry-sweeper",
    cron: "*/15 * * * *",
    run: async () => {
        await retryPendingGoogleCalendarOutbox(200);
    },
});

export const googleCalendarWatchRenew = schedules.task({
    id: "google-calendar-watch-renew",
    cron: "0 * * * *",
    run: async () => {
        await renewExpiringGoogleCalendarWatches();
    },
});

export const googleCalendarReconcile = schedules.task({
    id: "google-calendar-reconcile",
    cron: "*/15 * * * *",
    run: async () => {
        await reconcileStaleGoogleCalendarConnections();
    },
});
