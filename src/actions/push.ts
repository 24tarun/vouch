"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const pushSubscriptionSchema = z.object({
    endpoint: z.string().url(),
    keys: z.object({
        p256dh: z.string().min(1),
        auth: z.string().min(1),
    }),
});
type PushSubscriptionPayload = z.infer<typeof pushSubscriptionSchema>;

/**
 * Saves a web push subscription for the current user.
 */
export async function saveSubscription(subscription: unknown) {
    const parsedSubscription = pushSubscriptionSchema.safeParse(subscription);
    if (!parsedSubscription.success) {
        return { success: false, error: "Invalid push subscription data" };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "User not authenticated" };
    }

    const { error } = await (supabase.from("web_push_subscriptions" as any) as any).upsert(
        {
            user_id: user.id,
            subscription: parsedSubscription.data,
            updated_at: new Date().toISOString(),
        },
        {
            onConflict: "user_id, subscription",
            // RLS allows INSERT/SELECT/DELETE on this table (no UPDATE policy), so avoid
            // ON CONFLICT DO UPDATE behavior that can fail under RLS in production.
            ignoreDuplicates: true,
        }
    );

    if (error) {
        console.error("Error saving subscription:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Deletes a web push subscription.
 */
export async function deleteSubscription(subscription: unknown) {
    const parsedSubscription = pushSubscriptionSchema.safeParse(subscription);
    if (!parsedSubscription.success) return;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const subscriptionPayload: PushSubscriptionPayload = parsedSubscription.data;

    const { error } = await (supabase
        .from("web_push_subscriptions" as any) as any)
        .delete()
        .eq("user_id", user.id)
        .eq("subscription", subscriptionPayload);

    if (error) {
        console.error("Error deleting subscription:", error);
    }
}
