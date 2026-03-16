import { NextRequest, NextResponse } from "next/server";
import {
    findUserIdByWatchChannel,
    processGoogleCalendarDeltaForUser,
    touchGoogleWebhookReceipt,
    triggerGoogleCalendarSyncConnection,
} from "@/lib/google-calendar/sync";
import { webhookLimiter, checkRateLimit } from "@/lib/rate-limit";

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
        const triggered = await triggerGoogleCalendarSyncConnection(userId, "webhook");
        if (!triggered) {
            await processGoogleCalendarDeltaForUser(userId);
        }
    }

    return NextResponse.json({ ok: true });
}
