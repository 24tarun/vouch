import { NextRequest, NextResponse } from "next/server";
import {
    enqueueGoogleCalendarInbox,
    findUserIdByWatchChannel,
    processGoogleCalendarInboxItem,
    touchGoogleWebhookReceipt,
} from "@/lib/google-calendar/sync";
import { webhookLimiter, checkRateLimit } from "@/lib/rate-limit";
import { tasks as triggerTasks } from "@trigger.dev/sdk/v3";

export async function POST(request: NextRequest) {
    const channelId = request.headers.get("x-goog-channel-id");
    const resourceId = request.headers.get("x-goog-resource-id");
    const channelToken = request.headers.get("x-goog-channel-token");
    const resourceState = request.headers.get("x-goog-resource-state");
    const expectedToken = process.env.GOOGLE_WEBHOOK_CHANNEL_TOKEN_SECRET;

    if (!channelId) {
        return NextResponse.json({ error: "Missing channel id." }, { status: 400 });
    }

    const { limited } = await checkRateLimit(webhookLimiter, `webhook:${channelId}`);
    if (limited) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    if (!expectedToken || channelToken !== expectedToken) {
        return NextResponse.json({ error: "Invalid channel token." }, { status: 403 });
    }

    const userId = await findUserIdByWatchChannel(channelId, resourceId);
    if (!userId) {
        return NextResponse.json({ ok: true });
    }

    await touchGoogleWebhookReceipt(userId);

    // "sync" is the watch handshake event and carries no actionable change set.
    if (resourceState !== "sync") {
        const inboxId = await enqueueGoogleCalendarInbox(userId, channelId, resourceState ?? "exists");
        if (inboxId) {
            try {
                await triggerTasks.trigger("google-calendar-inbox-dispatch", { inboxId });
            } catch {
                // Trigger.dev unavailable — process inline as fallback.
                await processGoogleCalendarInboxItem(inboxId);
            }
        }
    }

    return NextResponse.json({ ok: true });
}
