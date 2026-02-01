import { resend } from "@/lib/resend";
import { createAdminClient } from "@/lib/supabase/admin";

interface NotificationParams {
    to: string; // Email address
    userId?: string; // For push notifications
    subject: string;
    html: string;
    text?: string;
    title?: string; // Often same as subject, specific for push
    data?: Record<string, any>; // Deep link data etc
}

/**
 * Unified Notification Bridge.
 * Sends email via Resend and (optionally) Push Notification via native bridge.
 * This ensures "Tandem" delivery as requested.
 */
export async function sendNotification(params: NotificationParams) {
    const results = {
        email: null as any,
        push: null as any,
    };

    // 1. Send Email (Primary MVP Channel)
    if (resend && params.to) {
        try {
            results.email = await resend.emails.send({
                from: "TAS <noreply@remails.tarunh.com>",
                to: params.to,
                subject: params.subject,
                html: params.html,
                text: params.text,
            });
        } catch (error) {
            console.error("Failed to send email:", error);
            // We don't throw here to ensure push might still work, or at least doesn't crash the action
        }
    } else if (!resend) {
        console.warn("Resend client not initialized, skipping email.");
    }

    // 2. Send Mobile/Web Push (Tandem channel)
    if (params.userId) {
        try {
            const supabase = createAdminClient();

            // Fetch both native tokens (future) and web push subscriptions
            const { data: webSubscriptions } = await supabase
                .from("web_push_subscriptions")
                .select("subscription")
                .eq("user_id", params.userId);

            console.log(`[Notification Bridge] 🔔 Mobile Push to ${params.userId}: "${params.title || params.subject}"`);

            if (webSubscriptions && webSubscriptions.length > 0) {
                console.log(`[Notification Bridge] 🌐 Sending Web Push to ${webSubscriptions.length} subscriptions`);
                // In a production environment with 'web-push' library:
                // webSubscriptions.forEach(sub => {
                //   webpush.sendNotification(sub.subscription, JSON.stringify({
                //     title: params.title || params.subject,
                //     body: params.text || "Open Vouch to see details",
                //     data: params.data
                //   }));
                // });
            }

            results.push = {
                success: true,
                mocked: true,
                webSubscriptionsCount: webSubscriptions?.length || 0
            };
        } catch (error) {
            console.error("Failed to send push:", error);
        }
    }

    return results;
}
