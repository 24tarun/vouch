import { resend } from "@/lib/resend";

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
                from: "Vouch <noreply@remails.tarunh.com>",
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

    // 2. Send Native Push (Future Channel)
    if (params.userId) {
        try {
            // In a real implementation, this would call Firebase Admin or a Trigger.dev task
            // that sends to APNS/FCM tokens stored in a 'push_tokens' table.

            // TODO: Fetch tokens for user
            // const tokens = await supabase.from('push_tokens').select('token').eq('user_id', params.userId);

            console.log(`[Notification Bridge] 🔔 Mobile Push to ${params.userId}: "${params.title || params.subject}"`);

            results.push = { success: true, mocked: true };
        } catch (error) {
            console.error("Failed to send push:", error);
        }
    }

    return results;
}
